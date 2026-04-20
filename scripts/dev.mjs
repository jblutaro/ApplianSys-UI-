import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = path.join(rootDir, "backend");

function runNpm(args, cwd) {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", "npm", ...args], {
      cwd,
      stdio: "inherit",
      shell: false,
    });
  }

  return spawn("npm", args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });
}

if (!existsSync(path.join(backendDir, "node_modules"))) {
  console.error("Missing backend dependencies.");
  console.error("Run `npm run install:backend` first, then retry `npm run dev`.");
  process.exit(1);
}

const children = [
  runNpm(["--prefix", "backend", "run", "dev"], rootDir),
  runNpm(["run", "start:frontend"], rootDir),
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  process.exit(exitCode);
}

for (const child of children) {
  child.on("exit", (code) => {
    shutdown(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
