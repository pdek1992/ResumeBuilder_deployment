import puppeteer, { type Browser } from "puppeteer-core";

import { env } from "@/lib/env";

const OPTIMIZED_CHROMIUM_FLAGS = [
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-web-security",
  "--font-render-hinting=none",
  "--no-first-run",
  "--no-zygote",
  "--single-process",
];

let browserPromise: Promise<Browser> | null = null;

// Find local chrome path for local development
async function getLocalChromePath() {
  const fs = await import("node:fs");
  const paths = [
    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    // Mac
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Could not find a local Chrome/Edge installation. Please install Chrome.");
}

export async function getBrowser() {
  if (browserPromise) {
    return browserPromise;
  }

  browserPromise = launchBrowser().catch((error) => {
    browserPromise = null;
    throw error;
  });

  return browserPromise;
}

async function launchBrowser() {
  const isDev = process.env.NODE_ENV === "development" || !process.env.VERCEL;
  
  if (isDev) {
    console.log("[PDF_ENGINE] Running in local/dev mode. Using local Chrome installation.");
    const executablePath = await getLocalChromePath();
    const browser = await puppeteer.launch({
      args: OPTIMIZED_CHROMIUM_FLAGS,
      defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
      executablePath,
      headless: true,
    });
    browser.once("disconnected", () => { browserPromise = null; });
    return browser;
  }

  console.log("[PDF_ENGINE] Running in production/Vercel mode. Fetching sparticuz/chromium-min.");
  
  // Dynamic import of sparticuz/chromium-min for production
  // We explicitly avoid importing @sparticuz/chromium because its binary size exceeds Vercel's 50MB Serverless limit.
  const { default: chromium } = await import("@sparticuz/chromium-min");
  const chr = chromium as any;
  chr.setGraphicsMode = false;
  
  // Puppeteer ^24.43.1 -> Chromium v133
  const packUrl = env.chromiumPackUrl || "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar";
  
  console.log(`[PDF_ENGINE] Downloading Chromium pack from: ${packUrl}`);
  const executablePath = await chr.executablePath(packUrl);
    
  const browser = await puppeteer.launch({
    args: Array.from(new Set([...chr.args, ...OPTIMIZED_CHROMIUM_FLAGS])),
    defaultViewport: {
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    },
    executablePath,
    headless: "shell",
  });

  browser.once("disconnected", () => {
    browserPromise = null;
  });

  return browser;
}

export async function newPdfPage() {
  const browser = await getBrowser();
  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(env.pdfRendererTimeoutMs);
  page.setDefaultTimeout(env.pdfRendererTimeoutMs);

  await page.setViewport({
    width: 794,
    height: 1123,
    deviceScaleFactor: 1,
  });

  return page;
}
