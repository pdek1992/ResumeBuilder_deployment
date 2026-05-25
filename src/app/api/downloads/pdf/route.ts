export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import crypto from "crypto";

import { fail } from "@/lib/api-response";
import { verifyDownloadToken } from "@/lib/downloads/tokens";
import { getActiveResumePass } from "@/lib/payments/access";
import { getResumeForUser } from "@/lib/resume/repository";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logUserAction } from "@/lib/logging";

// Helper to generate HMAC signature for the backend GHA dispatch
function generateHmacSignature(jobId: string, resumeId: string, timestamp: string, nonce: string, secret: string): string {
  const data = jobId + resumeId + timestamp + nonce;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const isCheck = searchParams.get("check") === "true";

    if (!token) {
      return fail("Missing token", 400);
    }

    // 1. Verify access token and get payload
    const payload = await verifyDownloadToken(token);
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== payload.userId) {
      return fail("Authentication required", 401);
    }

    // 2. Validate active export pass
    const pass = await getActiveResumePass(user.id, payload.resumeId);
    if (!pass) {
      return fail("Export access expired", 403);
    }

    const resumeId = payload.resumeId;

    // 3. Check if PDF already exists and is complete in storage
    const storagePath = `pdf/${resumeId}.pdf`;
    const adminSupabase = getSupabaseAdminClient();
    
    // Check if there is an active completed job first to fetch the file
    const { data: activeCompletedJob } = await adminSupabase
      .from("pdf_generation_jobs")
      .select("*")
      .eq("resume_id", resumeId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeCompletedJob) {
      // Check if file actually exists in storage
      const { data: signedData, error: signedError } = await adminSupabase.storage
        .from("resumes")
        .createSignedUrl(storagePath, 60 * 5); // 5 min access is safe for immediate redirect

      if (!signedError && signedData?.signedUrl) {
        if (isCheck) {
          return NextResponse.json({ status: "completed", url: signedData.signedUrl });
        }
        // Log downlading metric
        await logUserAction({
          userId: user.id,
          actionType: "pdf_download",
          metadata: { resumeId },
        });
        
        return NextResponse.redirect(signedData.signedUrl);
      }
    }

    // 4. Polling JSON status check
    if (isCheck) {
      // Find the latest active job in the last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentJob } = await adminSupabase
        .from("pdf_generation_jobs")
        .select("*")
        .eq("resume_id", resumeId)
        .gte("created_at", tenMinutesAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!recentJob) {
        return NextResponse.json({ status: "not_started" });
      }

      if (recentJob.status === "completed") {
        const { data: signedData } = await adminSupabase.storage
          .from("resumes")
          .createSignedUrl(storagePath, 60 * 5);
        return NextResponse.json({ status: "completed", url: signedData?.signedUrl || recentJob.pdf_url });
      }

      if (recentJob.status === "failed") {
        return NextResponse.json({ status: "failed", error: recentJob.error_message });
      }

      return NextResponse.json({ status: recentJob.status }); // 'pending' | 'processing'
    }

    // 5. Normal Browser Request - Trigger PDF generation & render beautiful loader page
    const renderSecret = process.env.RENDER_SECRET;
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO;
    const githubBranch = process.env.GITHUB_BRANCH || "main";

    if (!renderSecret || !githubToken || !githubRepo) {
      console.error("[PDF_PIPELINE] Missing environment credentials:", { renderSecret: !!renderSecret, githubToken: !!githubToken, githubRepo: !!githubRepo });
      return fail("Render compute backend is not fully configured.", 500);
    }

    // Initialize the GHA pipeline trigger
    const jobId = crypto.randomUUID();
    const nonce = crypto.randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();
    const signature = generateHmacSignature(jobId, resumeId, timestamp, nonce, renderSecret);

    // Save job track record
    await adminSupabase.from("pdf_generation_jobs").insert({
      id: jobId,
      user_id: user.id,
      resume_id: resumeId,
      status: "pending",
      signature,
      nonce,
      timestamp,
    });

    // Fire GHA workflow dispatch asynchronously
    const [owner, repo] = githubRepo.split("/");
    const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/render-pdf.yml/dispatches`;
    
    // Non-blocking fire and forget trigger (safe fetch, we do not await it blocking the HTML return)
    fetch(dispatchUrl, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "Vercel-Resume-Builder",
      },
      body: JSON.stringify({
        ref: githubBranch,
        inputs: { jobId, resumeId, timestamp, nonce, signature },
      }),
    }).catch(err => console.error("[PDF_PIPELINE] Async GHA trigger failed:", err));

    // Return the premium loading screen page in modern dark mode styling
    const resume = await getResumeForUser(user.id, resumeId);
    const resumeTitle = resume?.title || "My Resume";

    const loadingHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Exporting ${resumeTitle} | VigilSiddhiAI</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Outfit:wght@600;800&display=swap" rel="stylesheet">
          <style>
            :root {
              --bg: #0b0f19;
              --card-bg: #141c2f;
              --primary: #3067ea;
              --primary-gradient: linear-gradient(135deg, #3067ea 0%, #1d4ed8 100%);
              --text-main: #f8fafc;
              --text-sub: #94a3b8;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Inter', sans-serif;
              background-color: var(--bg);
              color: var(--text-main);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              overflow: hidden;
            }
            .container {
              max-width: 480px;
              width: 100%;
              text-align: center;
              padding: 40px;
              border-radius: 36px;
              background-color: var(--card-bg);
              border: 1px solid rgba(255, 255, 255, 0.05);
              box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
              position: relative;
              z-index: 2;
            }
            .header {
              font-family: 'Outfit', sans-serif;
              font-size: 26px;
              font-weight: 800;
              letter-spacing: -0.01em;
              margin-bottom: 8px;
              background: linear-gradient(to right, #ffffff, #94a3b8);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .subtitle {
              font-size: 13px;
              font-weight: 600;
              color: var(--text-sub);
              text-transform: uppercase;
              letter-spacing: 0.16em;
              margin-bottom: 35px;
            }
            /* Premium Spinner */
            .spinner-box {
              position: relative;
              width: 80px;
              height: 80px;
              margin: 0 auto 35px auto;
            }
            .spinner-ring {
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              border: 4px solid rgba(48, 103, 234, 0.1);
              border-top-color: var(--primary);
              animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            }
            .spinner-ring-inner {
              position: absolute;
              width: calc(100% - 16px);
              height: calc(100% - 16px);
              top: 8px;
              left: 8px;
              border-radius: 50%;
              border: 4px solid transparent;
              border-bottom-color: #60a5fa;
              animation: spin-reverse 2s linear infinite;
              opacity: 0.6;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes spin-reverse {
              0% { transform: rotate(360deg); }
              100% { transform: rotate(0deg); }
            }
            /* Progress status lines */
            .status-box {
              min-height: 48px;
              margin-bottom: 25px;
            }
            .status-text {
              font-size: 14px;
              font-weight: 600;
              color: var(--text-main);
              transition: all 0.3s ease;
            }
            .status-sub {
              font-size: 11px;
              color: var(--text-sub);
              margin-top: 4px;
            }
            .progress-bar-container {
              width: 100%;
              height: 5px;
              border-radius: 10px;
              background-color: rgba(255, 255, 255, 0.05);
              overflow: hidden;
              margin-bottom: 30px;
            }
            .progress-bar-fill {
              height: 100%;
              width: 10%;
              border-radius: 10px;
              background: var(--primary-gradient);
              box-shadow: 0 0 12px rgba(48, 103, 234, 0.5);
              transition: width 0.5s cubic-bezier(0.1, 0.8, 0.25, 1);
            }
            .glow-bg {
              position: absolute;
              width: 250px;
              height: 250px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(48, 103, 234, 0.15) 0%, transparent 70%);
              filter: blur(40px);
              z-index: 1;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }
            .error-box {
              display: none;
              padding: 20px;
              border-radius: 20px;
              background-color: rgba(239, 68, 68, 0.06);
              border: 1px solid rgba(239, 68, 68, 0.15);
              margin-top: 20px;
            }
            .error-title {
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              color: #f87171;
              margin-bottom: 6px;
            }
            .error-msg {
              font-size: 12.5px;
              color: var(--text-sub);
              line-height: 1.5;
            }
            .retry-btn {
              display: inline-block;
              margin-top: 15px;
              padding: 10px 22px;
              border-radius: 14px;
              background-color: rgba(255,255,255,0.06);
              color: #ffffff;
              text-decoration: none;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              border: 1px solid rgba(255,255,255,0.1);
              transition: all 0.2s ease;
            }
            .retry-btn:hover {
              background-color: rgba(255,255,255,0.12);
              border-color: rgba(255,255,255,0.2);
            }
          </style>
        </head>
        <body>
          <div class="glow-bg"></div>
          <div class="container">
            <div class="spinner-box">
              <div class="spinner-ring"></div>
              <div class="spinner-ring-inner"></div>
            </div>
            
            <h1 class="header">AI PDF Generator</h1>
            <p class="subtitle">${resumeTitle}</p>
            
            <div class="status-box">
              <p id="status" class="status-text">Booting Puppeteer runner...</p>
              <p id="status-sub" class="status-sub">Securing cloud compute sandbox...</p>
            </div>
            
            <div class="progress-bar-container">
              <div id="progress" class="progress-bar-fill"></div>
            </div>

            <div id="error" class="error-box">
              <p class="error-title">Export Failed</p>
              <p id="error-msg" class="error-msg">A processing timeout occurred. Please try again.</p>
              <a href="" onclick="window.location.reload(); return false;" class="retry-btn">Retry Export</a>
            </div>
          </div>

          <script>
            const token = encodeURIComponent(new URLSearchParams(window.location.search).get("token"));
            let pollCount = 0;
            const maxPolls = 60; // 2 minutes (2s intervals)
            
            // Visual state transitions
            const statuses = [
              { pct: 15, txt: "Verifying secure signatures...", sub: "Authenticating HMAC keys..." },
              { pct: 30, txt: "Booting headless sandbox...", sub: "Deploying Chromium container..." },
              { pct: 45, txt: "Injecting data models...", sub: "Hydrating absolute dimensions..." },
              { pct: 60, txt: "Assembling layout structure...", sub: "Resolving grid divisions and typography..." },
              { pct: 75, txt: "Rendering pixel-perfect shapes...", sub: "Optimizing vectors and vectors spacing..." },
              { pct: 90, txt: "Uploading PDF package...", sub: "Saving securely to storage cloud..." }
            ];

            function updateVisuals(pollNum) {
              const fillEl = document.getElementById("progress");
              const txtEl = document.getElementById("status");
              const subEl = document.getElementById("status-sub");
              
              // Smooth virtual progress
              const index = Math.min(statuses.length - 1, Math.floor(pollNum / 4));
              const current = statuses[index];
              
              fillEl.style.width = current.pct + "%";
              txtEl.textContent = current.txt;
              subEl.textContent = current.sub;
            }

            async function pollStatus() {
              pollCount++;
              updateVisuals(pollCount);
              
              if (pollCount > maxPolls) {
                showError("The request timed out. Our cloud runner might be overloaded. Please click Retry below.");
                return;
              }

              try {
                const res = await fetch(\`/api/downloads/pdf?token=\${token}&check=true\`);
                const data = await res.json();
                
                if (data.status === "completed") {
                  document.getElementById("progress").style.width = "100%";
                  document.getElementById("status").textContent = "Download starting!";
                  document.getElementById("status-sub").textContent = "Redirecting immediately...";
                  
                  setTimeout(() => {
                    window.location.href = data.url;
                  }, 800);
                  return;
                }
                
                if (data.status === "failed") {
                  showError(data.error || "An error occurred inside the headless runner.");
                  return;
                }
                
                // Keep polling
                setTimeout(pollStatus, 2000);
              } catch(e) {
                console.error("Polling error:", e);
                setTimeout(pollStatus, 2000); // retry polling on network error
              }
            }

            function showError(msg) {
              document.querySelector(".spinner-box").style.display = "none";
              document.getElementById("status-box") ? document.getElementById("status-box").style.display = "none" : null;
              document.getElementById("status").style.color = "#f87171";
              document.getElementById("status").textContent = "Generation halted";
              document.getElementById("status-sub").textContent = "Error encountered";
              document.getElementById("progress").style.backgroundColor = "#ef4444";
              document.getElementById("progress").style.width = "100%";
              
              document.getElementById("error-msg").textContent = msg;
              document.getElementById("error").style.display = "block";
            }

            // Start polling process
            setTimeout(pollStatus, 1500);
          </script>
        </body>
      </html>
    `;

    return new NextResponse(loadingHtml, {
      headers: {
        "content-type": "text/html",
        "cache-control": "no-store",
      },
    });

  } catch (error) {
    console.error("[PDF_DOWNLOAD] Route error:", error);
    return fail(error, 400);
  }
}
