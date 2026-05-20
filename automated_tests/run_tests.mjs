import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "logs");
const summaryLog = path.join(logsDir, "summary_log.txt");

const tests = {
  "1": ["Login Test", "test_login.mjs"],
  "2": ["Registration/Input Validation Test", "test_registration_validation.mjs"],
  "3": ["Product CRUD Test", "test_product_crud.mjs"],
  "4": ["Search/Filter Test", "test_search_filter.mjs"],
  "5": ["Checkout/Order Flow Test", "test_checkout_order_flow.mjs"],
};

function writeSummary(message) {
  fs.mkdirSync(logsDir, { recursive: true });
  fs.appendFileSync(summaryLog, `[${new Date().toLocaleString()}] ${message}\n`, "utf8");
}

function runScript(scriptName) {
  console.log(`\nRunning ${scriptName}...\n`);
  writeSummary(`Started ${scriptName}`);

  const result = spawnSync(process.execPath, [path.join(__dirname, scriptName)], {
    cwd: __dirname,
    stdio: "inherit",
  });

  if (result.status === 0) {
    console.log(`\nPASSED: ${scriptName}`);
    writeSummary(`PASSED ${scriptName}`);
    return 0;
  }

  console.log(`\nFAILED: ${scriptName}`);
  writeSummary(`FAILED ${scriptName}`);
  return result.status || 1;
}

function runAllTests() {
  let failedCount = 0;

  for (const [, scriptName] of Object.values(tests)) {
    const result = runScript(scriptName);
    if (result !== 0) failedCount += 1;
  }

  const passedCount = Object.keys(tests).length - failedCount;
  console.log("\nAll tests finished.");
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  writeSummary(`Run all completed. Passed=${passedCount}, Failed=${failedCount}`);

  return failedCount > 0 ? 1 : 0;
}

function showMenu() {
  console.log("Automated Software Testing Activity");
  console.log("E-commerce System - JavaScript Version");
  console.log("--------------------------------------");
  for (const [key, [label]] of Object.entries(tests)) {
    console.log(`${key}. Run ${label}`);
  }
  console.log("6. Run All Tests");
  console.log("0. Exit");
}

function askQuestion(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  fs.mkdirSync(logsDir, { recursive: true });

  const command = process.argv[2]?.toLowerCase();
  const shortcuts = {
    login: "1",
    registration: "2",
    validation: "2",
    product: "3",
    crud: "3",
    search: "4",
    filter: "4",
    checkout: "5",
    order: "5",
    all: "6",
  };

  if (command) {
    const choice = shortcuts[command];
    if (choice === "6") return runAllTests();
    if (tests[choice]) return runScript(tests[choice][1]);
    console.log(`Unknown test option: ${command}`);
    return 1;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    showMenu();
    const choice = (await askQuestion(rl, "\nChoose a test to run: ")).trim();

    if (choice === "0") {
      console.log("Testing menu closed.");
      writeSummary("Testing menu closed");
      rl.close();
      return 0;
    }

    if (choice === "6") {
      rl.close();
      return runAllTests();
    }

    if (tests[choice]) {
      runScript(tests[choice][1]);
      await askQuestion(rl, "\nPress Enter to return to the menu...");
      console.log("");
    } else {
      console.log("Invalid choice. Please try again.\n");
    }
  }
}

main().then((exitCode) => {
  process.exitCode = exitCode;
});
