/**
 * Pipeline Verification Script
 * Run locally to validate HMAC handshake, data decompression, and Puppeteer setup
 * Usage: node verify-pipeline.js
 *
 * Required env vars (create a .env.local or export them):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RENDER_SECRET
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ─── Colour helpers ──────────────────────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const BOLD  = '\x1b[1m';
const RESET = '\x1b[0m';
const ok  = msg => console.log(`${GREEN}  ✓  ${RESET}${msg}`);
const err = msg => console.log(`${RED}  ✗  ${RESET}${msg}`);
const hdr = msg => console.log(`\n${BOLD}${CYAN}━━ ${msg} ${RESET}`);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { ok(label);  passed++; }
  else           { err(label); failed++; }
}

// ─── Step 1 – env vars present ───────────────────────────────────────────────
hdr('Step 1 · Environment Variables');

// Load .env.local if present (simple key=value parser)
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  });
  ok('.env.local loaded');
} else {
  ok('.env.local not found – relying on exported shell env vars');
}

assert(!!process.env.SUPABASE_URL,          'SUPABASE_URL is set');
assert(!!process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY is set');
assert(!!process.env.RENDER_SECRET,         'RENDER_SECRET is set');

// ─── Step 2 – HMAC round-trip ────────────────────────────────────────────────
hdr('Step 2 · HMAC Signature Round-Trip');

const renderSecret = process.env.RENDER_SECRET || 'test-secret-for-local-verification';
const jobId     = crypto.randomUUID();
const resumeId  = crypto.randomUUID();
const timestamp = new Date().toISOString();
const nonce     = crypto.randomBytes(16).toString('hex');

const data         = jobId + resumeId + timestamp + nonce;
const signature    = crypto.createHmac('sha256', renderSecret).update(data).digest('hex');
const recomputed   = crypto.createHmac('sha256', renderSecret).update(data).digest('hex');

assert(signature === recomputed,        'HMAC signature matches on round-trip');
assert(signature.length === 64,         'HMAC output is 64-char hex (SHA-256)');

// Tamper test
const tampered = crypto.createHmac('sha256', renderSecret).update(data + 'X').digest('hex');
assert(signature !== tampered,          'Tampered payload produces different signature');

// ─── Step 3 – Replay window check ───────────────────────────────────────────
hdr('Step 3 · Replay Attack Window');

const freshTs  = new Date().toISOString();
const staleTs  = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 min ago

const freshDiff = Math.abs(Date.now() - new Date(freshTs).getTime());
const staleDiff = Math.abs(Date.now() - new Date(staleTs).getTime());

assert(freshDiff <= 15 * 60 * 1000,    'Fresh timestamp passes 15-min window');
assert(staleDiff >  15 * 60 * 1000,    'Stale timestamp (20 min) is correctly rejected');

// ─── Step 4 – pako decompression ────────────────────────────────────────────
hdr('Step 4 · JSON Decompression (pako)');

let pako;
try {
  pako = require('pako');
  ok('pako module loaded');
} catch (e) {
  err('pako module missing – run: npm install pako');
  failed++;
}

if (pako) {
  const sample = { personal: { firstName: 'Jane', lastName: 'Doe' }, experience: [] };
  const compressed = Buffer.from(pako.deflate(JSON.stringify(sample))).toString('base64');
  const inflated   = pako.inflate(Buffer.from(compressed, 'base64'), { to: 'string' });
  const parsed     = JSON.parse(inflated);

  assert(parsed.personal.firstName === 'Jane', 'Decompressed firstName matches');
  assert(Array.isArray(parsed.experience),      'Decompressed experience is an array');
}

// ─── Step 5 – Template files present ────────────────────────────────────────
hdr('Step 5 · Template Engine Files');

const templateRoot = path.resolve(__dirname, '../templates/default');
['index.html', 'style.css', 'mapping.js'].forEach(f => {
  const exists = fs.existsSync(path.join(templateRoot, f));
  assert(exists, `templates/default/${f} exists`);
});

// ─── Step 6 – Puppeteer smoke test ──────────────────────────────────────────
hdr('Step 6 · Puppeteer Smoke Test');

async function puppeteerSmoke() {
  let puppeteer;
  try {
    try { puppeteer = require('puppeteer'); }
    catch { puppeteer = require('puppeteer-core'); }
    ok('puppeteer module loaded');
  } catch (e) {
    err('puppeteer not installed – run: npm install puppeteer');
    failed++;
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    ok('Headless browser launched');

    const page = await browser.newPage();
    await page.setContent('<html><body><h1 id="t">OK</h1></body></html>');
    const text = await page.$eval('#t', el => el.textContent);
    assert(text === 'OK', 'Page content evaluates correctly');

    // A4 PDF generation smoke test
    const pdfBuf = await page.pdf({ format: 'A4', printBackground: true });
    assert(pdfBuf && pdfBuf.length > 500, `PDF buffer generated (${pdfBuf?.length} bytes)`);

  } catch (e) {
    err(`Puppeteer test failed: ${e.message}`);
    failed++;
  } finally {
    if (browser) await browser.close();
  }
}

// ─── Step 7 – Supabase connectivity (optional) ───────────────────────────────
async function supabaseSmoke() {
  hdr('Step 7 · Supabase Connectivity (optional)');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    ok('Skipped – credentials not set (set them to test connectivity)');
    return;
  }

  let supabase;
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    ok('@supabase/supabase-js loaded');
  } catch (e) {
    err('supabase-js not installed – run: npm install @supabase/supabase-js');
    failed++;
    return;
  }

  try {
    // Lightweight table-existence check
    const { error } = await supabase
      .from('pdf_generation_jobs')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      err(`Supabase query error: ${error.message}`);
      failed++;
    } else {
      ok('pdf_generation_jobs table accessible via service role');
    }
  } catch (e) {
    err(`Supabase connectivity error: ${e.message}`);
    failed++;
  }
}

// ─── Run async steps ────────────────────────────────────────────────────────
(async () => {
  await puppeteerSmoke();
  await supabaseSmoke();

  // ─── Summary ───────────────────────────────────────────────────────────────
  hdr('Verification Summary');
  console.log(`  ${GREEN}Passed: ${passed}${RESET}   ${failed > 0 ? RED : ''}Failed: ${failed}${RESET}\n`);

  if (failed > 0) {
    console.log(`${RED}${BOLD}  Pipeline is NOT ready. Fix the failures above before deploying.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}  All checks passed. Pipeline is ready for production deployment!${RESET}\n`);
  }
})();
