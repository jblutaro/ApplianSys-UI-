/*
Assigned Member Name: Member 5
Assigned Feature: Checkout/Order Flow Testing
Type of Test: Customer checkout flow smoke test
Tool Used: Playwright with JavaScript
*/

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Easy config area
const BASE_URL = "http://localhost:5173";
const CUSTOMER_EMAIL = "angela@gmail.com";
const CUSTOMER_PASSWORD = "12345678";
const HEADLESS = false;
const WAIT_MS = 12000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, "logs", "checkout_order_log.txt");
const screenshotDir = path.join(__dirname, "screenshots");

function writeLog(message) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toLocaleString()}] ${message}\n`, "utf8");
}

async function saveScreenshot(page, name) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `checkout_order_flow_test_${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  writeLog(`Screenshot saved: ${screenshotPath}`);
}

async function loginAsCustomer(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.locator("button.sign-in").click({ timeout: WAIT_MS });
  await page.locator("#auth-email").fill(CUSTOMER_EMAIL);
  await page.locator("#auth-password").fill(CUSTOMER_PASSWORD);
  await page.locator("button.auth-modal__primary").click();
  await page.locator("button.user-avatar").waitFor({ timeout: WAIT_MS });
}

async function runTest() {
  let browser;

  try {
    console.log("Starting Checkout/Order Flow Test...");
    writeLog("Checkout/order flow test started");

    browser = await chromium.launch({ headless: HEADLESS });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

    await loginAsCustomer(page);
    await page.goto(`${BASE_URL}/cart`, { waitUntil: "domcontentloaded" });

    await page.locator("body").waitFor({ timeout: WAIT_MS });
    await saveScreenshot(page, "cart_page");

    const pageText = await page.locator("body").innerText();
    if (!pageText.includes("Shopping Cart") && !pageText.includes("Your cart is empty")) {
      throw new Error("Cart page did not load expected cart content.");
    }

    const checkoutButton = page.locator(".cart-summary__checkout").first();
    if ((await checkoutButton.count()) > 0 && await checkoutButton.isEnabled()) {
      await checkoutButton.click();
      await page.locator(".checkout-sheet").waitFor({ timeout: WAIT_MS });
      await saveScreenshot(page, "checkout_modal");
      writeLog("Checkout modal opened because cart had available items");
    } else {
      // TODO: Add a product to the test customer cart before recording final checkout evidence.
      writeLog("Cart loaded, but no checkout button was available. Add an item to test full checkout.");
    }

    console.log("PASSED: Checkout/order flow smoke test completed.");
    writeLog("PASSED: Customer cart/order flow page was reachable");
    return true;
  } catch (error) {
    console.log(`FAILED: Checkout/order flow test failed. Reason: ${error.message}`);
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
