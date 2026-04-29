import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenApiProfilesProvider } from "./openapiProfilesProvider";
import type { ProviderContext } from "./profilesDataProvider";

const baseCtx: ProviderContext = {
  tenantId: "tenant-a",
  auth: { accessToken: "ctx-token", subject: "user-1", roles: ["profile_editor"] },
  telemetry: { requestId: "req-1", correlationId: "corr-1" },
};

describe("createOpenApiProfilesProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps list response and uses context token/baseUrl", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toContain("http://localhost:8080/admin/profile/api/v1/entities");
      expect(String(input)).toContain("search=Jane");
      expect(String(input)).toContain("entity_type_id=type-a");
      expect(init?.headers).toBeInstanceOf(Headers);
      expect((init?.headers as Headers).get("Authorization")).toBe("Bearer ctx-token");
      return new Response(
        JSON.stringify({
          items: [
            {
              entity_id: "e1",
              entity_type_id: "type-a",
              version: 2,
              created_at: "2026-04-29T10:00:00Z",
              preview: "Jane",
            },
          ],
          next_cursor: "cursor-2",
          total_count: 10,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = createOpenApiProfilesProvider({
      apiBaseUrl: "http://localhost:8080/admin/profile/api",
      accessToken: "config-token",
    });

    const page = await provider.list(
      { search: "Jane", entityTypeId: "type-a", limit: 5, sort: "updated_desc" },
      baseCtx,
    );

    expect(page.items).toEqual([
      {
        entityId: "e1",
        entityTypeId: "type-a",
        version: 2,
        updatedAt: "2026-04-29T10:00:00Z",
        preview: "Jane",
      },
    ]);
    expect(page.nextCursor).toBe("cursor-2");
    expect(page.totalCount).toBe(10);
  });

  it("maps api status and request_id to normalized provider error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ message: "raw backend error", request_id: "api-req-42" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const provider = createOpenApiProfilesProvider({
      apiBaseUrl: "http://localhost:8080/admin/profile/api",
      accessToken: "config-token",
    });

    await expect(provider.get("e1", baseCtx)).rejects.toMatchObject({
      code: "forbidden",
      requestId: "api-req-42",
      status: 403,
    });
  });

  it("propagates abort through context signal", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = createOpenApiProfilesProvider({
      apiBaseUrl: "http://localhost:8080/admin/profile/api",
      accessToken: "config-token",
    });
    const controller = new AbortController();
    const pending = provider.get("e1", { ...baseCtx, signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ code: "unknown" });
  });
});
