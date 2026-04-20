import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

/** Load `.env` from this folder even if the shell cwd is elsewhere. */
const projectDir = path.dirname(fileURLToPath(import.meta.url));

const srcPath = new URL("./src", import.meta.url).pathname;
const normalizedSrcPath = decodeURIComponent(
  srcPath.match(/^\/[A-Za-z]:\//) ? srcPath.slice(1) : srcPath,
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectDir, "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:4000";

  return {
    envDir: projectDir,
    plugins: [react()],
    server: {
      host: true,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      allowedHosts: true,
    },
    resolve: {
      alias: {
        "@": normalizedSrcPath,
      },
    },
  };
});
