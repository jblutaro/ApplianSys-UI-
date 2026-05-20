/*
Assigned Member Name: Member 1
Assigned Feature: Login Testing
Type of Test: Functional UI test and negative login validation
Tool Used: Playwright with JavaScript
*/

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Easy config area
const BASE_URL = "http://localhost:5173";
const LOGIN_EMAIL = "angela@gmail.com";
const LOGIN_PASSWORD = "12345678";
const HEADLESS = false;
const WAIT_MS = 10000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, "logs", "login_test_log.txt");
const screenshotDir = path.join(__dirname, "screenshots");

function writeLog(message) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toLocaleString()}] ${message}\n`, "utf8");
}

async function saveScreenshot(page, name) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `login_test_${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  writeLog(`Screenshot saved: ${screenshotPath}`);
}

async function runTest() {
  let browser;

  try {
    console.log("Starting Login Test...");
    writeLog("Login test started");

    browser = await chromium.launch({ headless: HEADLESS });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.locator("button.sign-in").click({ timeout: WAIT_MS });

    await page.locator("#auth-email").fill(LOGIN_EMAIL);
    await page.locator("#auth-password").fill(LOGIN_PASSWORD);
    await saveScreenshot(page, "before_submit");

    await page.locator("button.auth-modal__primary").click();

    // TODO: If the UI changes, replace this with a stable data-testid selector.
    await page.locator("button.user-avatar").waitFor({ timeout: WAIT_MS });
    await saveScreenshot(page, "after_login");

    console.log("PASSED: Login test completed successfully.");
    writeLog("PASSED: User logged in and account menu appeared");
    return true;
  } catch (error) {
    console.log(`FAILED: Login test failed. Reason: ${error.message}`);
    writeLog(`FAILED: ${error.stack || error.message}`);
    if (browser) {
      const pages = browser.contexts()[0]?.pages() || [];
      if (pages[0]) await saveScreenshot(pages[0], "error");
    }
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

const passed = await runTest();
process.exitCode = passed ? 0 : 1;
