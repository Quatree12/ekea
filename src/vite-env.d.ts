/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYSIS_ENDPOINT?: string;
  readonly VITE_ANALYSIS_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
