/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CUTSHEET_URL?: string;
  readonly VITE_FEASO_URL?: string;
  readonly VITE_FORMGEN_URL?: string;
  readonly VITE_ENVIRO_URL?: string;
  readonly VITE_ALLOWED_ORIGIN_REGEX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
