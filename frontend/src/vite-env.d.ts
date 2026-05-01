/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROFILE_API_BASE_URL?: string;
  readonly VITE_PROFILE_ACCESS_TOKEN?: string;
  readonly VITE_PROFILE_DEMO_ENTITY_ID?: string;
  /** `false` — не поднимать MSW; иначе в dev ответы API для виджетов подменяются демо-данными. */
  readonly VITE_PROFILE_DEMO_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
