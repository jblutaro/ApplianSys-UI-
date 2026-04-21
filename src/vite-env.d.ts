/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Comma-separated list of emails allowed into /admin. */
  readonly VITE_ADMIN_EMAILS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
