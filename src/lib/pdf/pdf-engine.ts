import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import fs from "fs";

// Find local chrome path for Windows development
function getLocalChromePath() {
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
  const chr = chromium as any;
  
  const executablePath = isDev 
    ? getLocalChromePath()
    : await chr.executablePath();
    
  return await puppeteer.launch({
    args: isDev ? ["--no-sandbox", "--disable-setuid-sandbox"] : chr.args,
    defaultViewport: chr.defaultViewport,
    executablePath,
    headless: isDev ? true : chr.headless,
  });
}
