/*
Assigned Member Name: Member 4
Assigned Feature: Search/Filter Testing
Type of Test: Functional search test
Tool Used: Playwright with JavaScript
*/

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Easy config area
const BASE_URL = "http://localhost:5173";
const SEARCH_TEXT = "fridge"; // Product keyword from "Smart Fridge Master 3000".
const HEADLESS = false;
const WAIT_MS = 10000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, "logs", "search_filter_log.txt");
const screenshotDir = path.join(__dirname, "screenshots");

function writeLog(message) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toLocaleString()}] ${message}\n`, "utf8");
}

async function saveScreenshot(page, name) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `search_filter_test_${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  writeLog(`Screenshot saved: ${screenshotPath}`);
}

async function runTest() {
  let browser;

  try {
    console.log("Starting Search/Filter Test...");
    writeLog("Search/filter test started");

    browser = await chromium.launch({ headless: HEADLESS });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.locator("input.search-box").fill(SEARCH_TEXT);
    await saveScreenshot(page, "before_search");
    await page.locator("input.search-box").press("Enter");

    await page.waitForURL(`**/?q=*`, { timeout: WAIT_MS });
    await page.locator(".search-results-title").waitFor({ timeout: WAIT_MS });
    await saveScreenshot(page, "results");

    const pageText = (await page.locator("body").innerText()).toLowerCase();
    if (!pageText.includes(SEARCH_TEXT.toLowerCase()) && !pageText.includes("no products found")) {
      throw new Error("Search results page did not show the searched keyword or no-results message.");
    }

    console.log("PASSED: Search/filter test completed.");
    writeLog("PASSED: Search submitted and results page appeared");
    return true;
  } catch (error) {
    console.log(`FAILED: Search/filter test failed. Reason: ${error.message}`);
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
