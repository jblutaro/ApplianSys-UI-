import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

/** Load `.env` from this folder even if the shell cwd is elsewhere. */
const projectDir = path.dirname(fileURLToPath(import.meta.url));

const srcPath = new URL("./src", import.meta.url).pathname;
const normalizedSrcPath = decodeURIComponent(
  srcPath.match(/^\/[A-Za-z]:\//) ? srcPath.slice(1) : srcPath,
);

export default defineConfig({
  envDir: projectDir,
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
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
});
