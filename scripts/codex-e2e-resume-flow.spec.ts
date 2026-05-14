import { expect, test } from "C:/Users/DELL/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/@playwright/test/index.mjs";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3015";
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const resumeFile = process.env.E2E_RESUME_FILE;

test.use({ channel: "chrome" });

test("sign in, import resume, choose template, and reach payment checkout", async ({ page }) => {
  if (!email || !password || !resumeFile) {
    throw new Error("E2E_EMAIL, E2E_PASSWORD, and E2E_RESUME_FILE are required");
  }

  await page.goto(`${baseUrl}/sign-in?next=%2Fbuilder%2Fimport`);
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL((url) => url.pathname === "/builder/import" || url.pathname === "/settings", {
    timeout: 30000,
  });
  if (page.url().includes("/settings")) {
    const accept = page.getByRole("button", { name: "Accept and Continue" });
    if (await accept.isVisible()) {
      await accept.click();
    }
  }

  await page.waitForURL(/\/builder\/import/, { timeout: 30000 });
  await page.locator("input[type='file']").setInputFiles(resumeFile);
  await page.getByRole("button", { name: "Structure with AI" }).click();

  await page.waitForURL(/\/builder\/templates\?resumeId=/, { timeout: 180000 });
  await page.getByRole("button").filter({ hasText: "ATS Minimal" }).click();

  await page.waitForURL(/\/builder\/[^/]+$/, { timeout: 30000 });
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Download PDF" }).click();

  await expect(page.locator("iframe[src*='checkout.razorpay.com']").or(page.getByText("Razorpay"))).toBeVisible({
    timeout: 30000,
  });
});
