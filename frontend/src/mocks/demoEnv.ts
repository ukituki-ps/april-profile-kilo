/**
 * Dev-only: MSW demo dataset (see `handlers.ts`) перехватывает запросы к
 * `getResolvedApiBaseUrl()` — в том числе если в `.env.local` задан другой host/port
 * (например `http://localhost:18081`), пока не отключено явно.
 */
export function isDemoMswEnabled(): boolean {
  if (!import.meta.env.DEV) {
    return false;
  }
  return import.meta.env.VITE_PROFILE_DEMO_MOCK !== "false";
}

export function getResolvedApiBaseUrl(): string {
  const raw = import.meta.env.VITE_PROFILE_API_BASE_URL ?? "/admin/profile/api";
  return new URL(raw, window.location.href).href.replace(/\/$/, "");
}
