export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { fail } from "@/lib/api-response";
import { verifyDownloadToken } from "@/lib/downloads/tokens";
import { getActiveResumePass } from "@/lib/payments/access";
import { getResumeForUser } from "@/lib/resume/repository";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logUserAction } from "@/lib/logging";
import { cleanupStalePdfJobs, createSignedPdfJob } from "@/lib/pdf/jobs";
import { requestPdfRender } from "@/lib/pdf/renderer-client";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return fail("Missing token", 400);

    // 1. Verify access token and get payload
    const payload = await verifyDownloadToken(token);
    if (payload.format !== "pdf") return fail("Invalid download token", 400);

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

    // 3. Validate resume ownership before any renderer job is created
    const resume = await getResumeForUser(user.id, resumeId);
    if (!resume) return fail("Resume not found", 404);

    await cleanupStalePdfJobs().catch(() => undefined);

    // 4. Create a one-time signed internal renderer job. The frontend only sees this route.
    const job = await createSignedPdfJob({
      userId: user.id,
      resumeId,
    });
    const result = await requestPdfRender(job, new URL(request.url).origin);

    await logUserAction({
      userId: user.id,
      actionType: "pdf_download",
      metadata: { resumeId },
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[PDF_GEN] Internal renderer error:", error);
    return fail(error.message || "Failed to generate PDF", 500);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return fail("Missing token", 400);

    // Provide the beautiful loading screen. 
    // It will immediately trigger the POST request in the background.
    const loadingHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Exporting PDF | VigilSiddhiAI</title>
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
            <p class="subtitle">Generating Pixel-Perfect PDF</p>
            
            <div class="status-box">
              <p id="status" class="status-text">Preparing secure export...</p>
              <p id="status-sub" class="status-sub">Validating your download access...</p>
            </div>
            
            <div class="progress-bar-container">
              <div id="progress" class="progress-bar-fill"></div>
            </div>

            <div id="error" class="error-box">
              <p class="error-title">Export Failed</p>
              <p id="error-msg" class="error-msg">An error occurred during generation.</p>
              <a href="" onclick="window.location.reload(); return false;" class="retry-btn">Retry Export</a>
            </div>
          </div>

          <script>
            const token = encodeURIComponent(new URLSearchParams(window.location.search).get("token"));
            
            // Visual state transitions
            const statuses = [
              { pct: 15, txt: "Preparing secure export...", sub: "Validating your download access..." },
              { pct: 30, txt: "Loading resume data...", sub: "Applying the selected template..." },
              { pct: 50, txt: "Composing document layout...", sub: "Preserving spacing and typography..." },
              { pct: 70, txt: "Finalizing PDF...", sub: "Checking fonts and print styles..." },
              { pct: 90, txt: "Securing download...", sub: "Creating your private link..." }
            ];

            function updateVisuals(index) {
              const current = statuses[Math.min(index, statuses.length - 1)];
              document.getElementById("progress").style.width = current.pct + "%";
              document.getElementById("status").textContent = current.txt;
              document.getElementById("status-sub").textContent = current.sub;
            }

            function showError(msg) {
              document.querySelector(".spinner-box").style.display = "none";
              document.querySelector(".status-box").style.display = "none";
              document.getElementById("progress").style.backgroundColor = "#ef4444";
              document.getElementById("progress").style.width = "100%";
              document.getElementById("error-msg").textContent = msg;
              document.getElementById("error").style.display = "block";
            }

            let visualInterval;
            
            async function startGeneration() {
              let step = 0;
              visualInterval = setInterval(() => {
                step++;
                updateVisuals(step);
              }, 1200);

              try {
                const res = await fetch(\`/api/downloads/pdf?token=\${token}\`, {
                  method: 'POST'
                });
                const data = await res.json();
                
                clearInterval(visualInterval);
                
                if (data.status === "success" && data.url) {
                  document.getElementById("progress").style.width = "100%";
                  document.getElementById("status").textContent = "Download starting!";
                  document.getElementById("status-sub").textContent = "Redirecting immediately...";
                  
                  setTimeout(() => {
                    window.location.href = data.url;
                  }, 500);
                } else {
                  showError(data.error || "Generation failed. Please try again.");
                }
              } catch(e) {
                clearInterval(visualInterval);
                showError("Network error. Please try again.");
              }
            }

            // Start automatically
            setTimeout(startGeneration, 500);
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
    console.error("[PDF_DOWNLOAD] Route GET error:", error);
    return fail(error, 400);
  }
}
