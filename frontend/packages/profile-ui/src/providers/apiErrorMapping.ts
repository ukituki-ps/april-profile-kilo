import { ApiError } from "../generated";
import type { ProfilesProviderError, ProfilesProviderErrorCode } from "./profilesDataProvider";

type ApiErrorBody = {
  request_id?: string | null;
  message?: string;
  code?: string;
  issues?: Array<{ path?: string; message?: string }>;
};

const statusToCode = (status: number): ProfilesProviderErrorCode => {
  if (status === 401) {
    return "unauthorized";
  }
  if (status === 403) {
    return "forbidden";
  }
  if (status === 404) {
    return "not_found";
  }
  if (status === 409) {
    return "conflict";
  }
  if (status === 422 || status === 400) {
    return "validation";
  }
  if (status === 429) {
    return "rate_limited";
  }
  return "unknown";
};

/**
 * Единый разбор тел ошибок OpenAPI (`Error` из generated) для провайдеров profile-ui.
 */
export function mapApiErrorToProfilesProviderError(error: unknown): ProfilesProviderError {
  if (error instanceof ApiError) {
    const body = error.body as ApiErrorBody | undefined;
    const rawIssues = body?.issues;
    const schemaIssues =
      Array.isArray(rawIssues) && rawIssues.length > 0
        ? rawIssues
            .filter((row) => typeof row?.message === "string" && row.message.length > 0)
            .map((row) => ({
              path: typeof row.path === "string" && row.path.length > 0 ? row.path : "/",
              message: String(row.message),
            }))
        : undefined;
    return {
      code: statusToCode(error.status),
      message: body?.message ?? error.message,
      requestId: body?.request_id ?? undefined,
      status: error.status,
      retryable: error.status >= 500 || error.status === 429,
      schemaIssues,
    };
  }
  if (error instanceof TypeError) {
    return { code: "network", message: "Network error", retryable: true };
  }
  return { code: "unknown", message: "Unknown API error" };
}
