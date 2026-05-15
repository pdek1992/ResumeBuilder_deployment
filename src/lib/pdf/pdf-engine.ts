import puppeteer from "puppeteer-core";

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
  const isDev = process.env.NODE_ENV === "development";
  const { default: chromium } = await import("@sparticuz/chromium");
  const chr = chromium as any;
  chr.setGraphicsMode = false;
  
  const executablePath = isDev 
    ? await getLocalChromePath()
    : await chr.executablePath();
    
  return await puppeteer.launch({
    args: isDev ? ["--no-sandbox", "--disable-setuid-sandbox"] : chr.args,
    defaultViewport: chr.defaultViewport,
    executablePath,
    headless: isDev ? true : chr.headless,
  });
}
