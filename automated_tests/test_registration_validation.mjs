/*
Assigned Member Name: Member 2
Assigned Feature: Registration/Input Validation Testing
Type of Test: Negative input validation test
Tool Used: Playwright with JavaScript
*/

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Easy config area
const BASE_URL = "http://localhost:5173";
const HEADLESS = false;
const WAIT_MS = 10000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, "logs", "registration_validation_log.txt");
const screenshotDir = path.join(__dirname, "screenshots");

function writeLog(message) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toLocaleString()}] ${message}\n`, "utf8");
}

async function saveScreenshot(page, name) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `registration_validation_test_${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  writeLog(`Screenshot saved: ${screenshotPath}`);
}

async function runTest() {
  let browser;

  try {
    console.log("Starting Registration/Input Validation Test...");
    writeLog("Registration validation test started");

    browser = await chromium.launch({ headless: HEADLESS });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.locator("button.sign-in").click({ timeout: WAIT_MS });
    await page.getByRole("button", { name: "Sign up" }).click();

    await page.locator("#auth-first-name").fill("Test");
    await page.locator("#auth-last-name").fill("User");
    await page.locator("#auth-email").fill("invalid-registration@example.com");
    await page.locator("#auth-password").fill("123456");
    await page.locator("#auth-confirm").fill("654321");
    await saveScreenshot(page, "before_submit");

    await page.locator("button.auth-modal__primary").click();

    const errorMessage = await page.locator(".auth-modal__error").textContent({ timeout: WAIT_MS });
    if (!errorMessage || !errorMessage.includes("Passwords do not match")) {
      throw new Error(`Expected password mismatch error, got: ${errorMessage}`);
    }

    await saveScreenshot(page, "validation_message");
    console.log("PASSED: Registration validation showed the expected password mismatch message.");
    writeLog("PASSED: Password mismatch validation appeared");
    return true;
  } catch (error) {
    console.log(`FAILED: Registration validation test failed. Reason: ${error.message}`);
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
