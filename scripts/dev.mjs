import { existsSync } from "node:fs";
import net from "node:net";
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

function waitForPort(port, host = "127.0.0.1", timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function tryConnect() {
      const socket = net.createConnection({ host, port });

      socket.once("connect", () => {
        socket.end();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();

        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }

        setTimeout(tryConnect, 250);
      });
    }

    tryConnect();
  });
}

if (!existsSync(path.join(backendDir, "node_modules"))) {
  console.error("Missing backend dependencies.");
  console.error("Run `npm run install:backend` first, then retry `npm run dev`.");
  process.exit(1);
}

const backendPort = Number(process.env.PORT ?? 4000);
const children = [];

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

function watchChild(child) {
  child.on("exit", (code) => {
    shutdown(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const backend = runNpm(["--prefix", "backend", "run", "dev"], rootDir);
children.push(backend);
watchChild(backend);

try {
  await waitForPort(backendPort);
} catch (error) {
  console.error(error);
  shutdown(1);
}

const frontend = runNpm(["run", "start:frontend"], rootDir);
children.push(frontend);
watchChild(frontend);
