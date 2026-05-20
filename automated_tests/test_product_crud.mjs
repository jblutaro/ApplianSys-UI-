/*
Assigned Member Name: Member 3
Assigned Feature: Product CRUD Testing
Type of Test: Admin product management UI test
Tool Used: Playwright with JavaScript
*/

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Easy config area
const BASE_URL = "http://localhost:5173";
const ADMIN_EMAIL = "hb@gmail.com";
const ADMIN_PASSWORD = "12345678";
const PRODUCT_SEARCH_TEXT = "fridge"; // Product keyword from "Smart Fridge Master 3000".
const HEADLESS = false;
const WAIT_MS = 12000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, "logs", "product_crud_log.txt");
const screenshotDir = path.join(__dirname, "screenshots");

function writeLog(message) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toLocaleString()}] ${message}\n`, "utf8");
}

async function saveScreenshot(page, name) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `product_crud_test_${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  writeLog(`Screenshot saved: ${screenshotPath}`);
}

async function loginAsAdmin(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.locator("button.sign-in").click({ timeout: WAIT_MS });
  await page.locator("#auth-email").fill(ADMIN_EMAIL);
  await page.locator("#auth-password").fill(ADMIN_PASSWORD);
  await page.locator("button.auth-modal__primary").click();
  await page.locator("button.user-avatar").waitFor({ timeout: WAIT_MS });
}

async function runTest() {
  let browser;

  try {
    console.log("Starting Product CRUD Test...");
    writeLog("Product CRUD test started");

    browser = await chromium.launch({ headless: HEADLESS });
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin?section=products`, { waitUntil: "domcontentloaded" });

    await page.locator("#product-table-search").waitFor({ timeout: WAIT_MS });
    await saveScreenshot(page, "products_page");

    // Read/Search part of CRUD: verify product table can be searched.
    await page.locator("#product-table-search").fill(PRODUCT_SEARCH_TEXT);
    await page.locator(".admin-table").waitFor({ timeout: WAIT_MS });
    await saveScreenshot(page, "product_search");

    // TODO: For full Create/Update/Delete evidence, add stable data-testid attributes
    // to the product modal buttons and inputs, then extend this script to:
    // 1. Click "Add Product"
    // 2. Fill product fields
    // 3. Save the product
    // 4. Edit the created product
    // 5. Delete the created product
    const tableText = (await page.locator(".admin-table").innerText()).toLowerCase();
    if (!tableText.includes(PRODUCT_SEARCH_TEXT.toLowerCase()) && !tableText.includes("no products found")) {
      throw new Error("Product table did not update after searching.");
    }

    console.log("PASSED: Product admin page opened and product search/read check worked.");
    writeLog("PASSED: Admin products page loaded and search/read check completed");
    return true;
  } catch (error) {
    console.log(`FAILED: Product CRUD test failed. Reason: ${error.message}`);
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
