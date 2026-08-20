/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" in the static GitHub Pages build (no backend). */
  readonly VITE_STATIC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
