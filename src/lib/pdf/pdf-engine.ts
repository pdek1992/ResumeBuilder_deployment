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

// Find local chrome path for Windows development
async function getLocalChromePath() {
  const fs = await import("node:fs");
  const paths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
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
  const isDev = process.env.NODE_ENV === "development";
  const { default: chromium } = env.chromiumPackUrl
    ? await import("@sparticuz/chromium-min")
    : await import("@sparticuz/chromium");
  const chr = chromium as any;
  chr.setGraphicsMode = false;
  
  const executablePath = isDev 
    ? await getLocalChromePath()
    : await chr.executablePath(env.chromiumPackUrl || undefined);
    
  const browser = await puppeteer.launch({
    args: isDev ? OPTIMIZED_CHROMIUM_FLAGS : Array.from(new Set([...chr.args, ...OPTIMIZED_CHROMIUM_FLAGS])),
    defaultViewport: {
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    },
    executablePath,
    headless: isDev ? true : "shell",
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
