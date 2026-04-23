/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROFILE_API_BASE_URL?: string;
  readonly VITE_PROFILE_ACCESS_TOKEN?: string;
  readonly VITE_PROFILE_DEMO_ENTITY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
