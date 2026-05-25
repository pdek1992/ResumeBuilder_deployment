const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pako = require('pako');
const { createClient } = require('@supabase/supabase-js');

// Parse arguments
const args = {};
process.argv.slice(2).forEach(arg => {
  const match = arg.match(/^--([^=]+)=(.*)$/);
  if (match) {
    args[match[1]] = match[2];
  }
});

const { jobId, resumeId, signature, timestamp, nonce } = args;

// Helper to decompress JSON (matches Next.js implementation)
function decompressJson(base64Value, fallback) {
  try {
    const inflated = pako.inflate(Buffer.from(base64Value, 'base64'), { to: 'string' });
    return JSON.parse(inflated);
  } catch (err) {
    console.error("Decompression failed:", err);
    return fallback;
  }
}

async function run() {
  console.log(`[RENDERER] Starting job: ${jobId} for resume: ${resumeId}`);
  
  if (!jobId || !resumeId || !signature || !timestamp || !nonce) {
    throw new Error("Missing required arguments. Usage: node generate-pdf.js --jobId=.. --resumeId=.. --signature=.. --timestamp=.. --nonce=..");
  }

  // 1. Validate Environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const renderSecret = process.env.RENDER_SECRET;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials in environment variables.");
  }
  if (!renderSecret) {
    throw new Error("Missing RENDER_SECRET in environment variables.");
  }

  // 2. Verify HMAC Signature (Security check)
  const dataToSign = jobId + resumeId + timestamp + nonce;
  const expectedSignature = crypto
    .createHmac('sha256', renderSecret)
    .update(dataToSign)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new Error("HMAC Signature verification failed. Unauthorized request.");
  }

  // Replay Attack Prevention (15 min window)
  const timeDifference = Math.abs(Date.now() - new Date(timestamp).getTime());
  if (timeDifference > 15 * 60 * 1000) {
    throw new Error("Request timestamp expired. Potential replay attack.");
  }

  // 3. Connect to Supabase
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Update status to 'processing'
  await supabase
    .from('pdf_generation_jobs')
    .update({ status: 'processing', updated_at: new Date() })
    .eq('id', jobId);

  // 4. Retrieve Resume & Template Records
  const { data: resumeRecord, error: resumeError } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .single();

  if (resumeError || !resumeRecord) {
    throw new Error(`Failed to retrieve resume record: ${resumeError?.message || 'Not found'}`);
  }

  const { data: templateRecord, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', resumeRecord.template_id)
    .maybeSingle();

  // Fallback default template if not found in database
  const templateConfig = templateRecord || {
    id: resumeRecord.template_id || "elite-modular-card",
    template_name: "Default Template",
    config_json: {
      accent: "#2563eb",
      density: "balanced",
      typography: "modern-sans",
      columns: "single"
    }
  };

  const parsedResume = decompressJson(resumeRecord.raw_json_compressed, resumeRecord.content || {});

  // 5. Initialize Puppeteer
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (err) {
    console.log("[RENDERER] Standard puppeteer package not found, falling back to puppeteer-core...");
    puppeteer = require('puppeteer-core');
  }

  // Find Chrome/Chromium installation path automatically
  let executablePath = '';
  if (process.platform === 'win32') {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }
  } else {
    // Standard Linux locations in GitHub runner
    const paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }
  }

  const launchOptions = {
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
    console.log(`[RENDERER] Using browser binary at: ${executablePath}`);
  } else {
    console.log(`[RENDERER] Relying on Puppeteer's default Chrome download...`);
  }

  const browser = await puppeteer.launch(launchOptions);
  
  try {
    const page = await browser.newPage();

    // Load static HTML template
    const htmlPath = path.resolve(__dirname, '../templates/default/index.html');
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`Template index.html file not found at: ${htmlPath}`);
    }

    console.log(`[RENDERER] Loading template: ${htmlPath}`);
    await page.goto('file://' + htmlPath, { waitUntil: 'load' });

    // Inject data elements and run renderer inside DOM
    console.log("[RENDERER] Injecting resume data model...");
    await page.evaluate((resume, template) => {
      document.getElementById('resume-data-json').textContent = JSON.stringify(resume);
      document.getElementById('template-config-json').textContent = JSON.stringify(template);
      if (typeof window.renderResume === 'function') {
        window.renderResume(resume, template);
      }
    }, parsedResume, templateConfig);

    // Wait for fonts & rendering settles
    console.log("[RENDERER] Waiting for local fonts and visual settle...");
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // Short buffer for final rendering paints
    await new Promise(r => setTimeout(r, 600));

    // Print A4 dimensions securely
    console.log("[RENDERER] Creating exact A4 PDF...");
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    // 6. Upload PDF to Supabase storage
    const storagePath = `pdf/${resumeId}.pdf`;
    console.log(`[RENDERER] Uploading PDF buffer to Supabase storage resumes bucket: ${storagePath}`);
    
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    // Generate signed delivery URL valid for 24 hours
    console.log("[RENDERER] Generating 24h secure signed download URL...");
    const { data: signedData, error: signedError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, 60 * 60 * 24);

    if (signedError || !signedData?.signedUrl) {
      throw new Error(`Failed to generate secure signed URL: ${signedError?.message || 'Empty response'}`);
    }

    // 7. Update Job as completed
    console.log("[RENDERER] Updating job record to completed.");
    await supabase
      .from('pdf_generation_jobs')
      .update({
        status: 'completed',
        pdf_url: signedData.signedUrl,
        updated_at: new Date()
      })
      .eq('id', jobId);

    console.log(`[RENDERER] Success! PDF generated and uploaded successfully. Signed URL: ${signedData.signedUrl}`);

  } finally {
    await browser.close();
  }
}

run().catch(async err => {
  console.error("[RENDERER] Critical error encountered during PDF pipeline run:", err);
  
  if (jobId) {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        await supabase
          .from('pdf_generation_jobs')
          .update({
            status: 'failed',
            error_message: err.message || String(err),
            updated_at: new Date()
          })
          .eq('id', jobId);
      }
    } catch(dbErr) {
      console.error("[RENDERER] Failed to log failure status back to database:", dbErr);
    }
  }
  process.exit(1);
});
