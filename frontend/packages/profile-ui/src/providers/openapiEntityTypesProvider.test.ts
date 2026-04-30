import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenApiEntityTypesProvider } from "./openapiEntityTypesProvider";
import type { ProviderContext } from "./profilesDataProvider";

const baseCtx: ProviderContext = {
  tenantId: "tenant-a",
  auth: { accessToken: "ctx-token", subject: "user-1", roles: ["admin"] },
  telemetry: { requestId: "req-1", correlationId: "corr-1" },
};

describe("createOpenApiEntityTypesProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists families and maps fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            items: [
              {
                id: "fam-1",
                namespace: "hr",
                code: "person",
                status: "published",
                draft_schema: { type: "object" },
                draft_schema_version: 2,
                published_schema: { type: "object" },
                published_schema_version: 1,
                published_at: "2026-01-01T00:00:00Z",
                created_at: "2025-12-01T00:00:00Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const provider = createOpenApiEntityTypesProvider({
      apiBaseUrl: "http://localhost:8080/admin/profile/api",
      accessToken: "config-token",
    });

    const rows = await provider.listFamilies(baseCtx);
    expect(rows).toEqual([
      {
        id: "fam-1",
        namespace: "hr",
        code: "person",
        status: "published",
        draftSchemaVersion: 2,
        publishedSchemaVersion: 1,
      },
    ]);
  });

  it("maps 403 with request_id to provider error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ message: "denied", request_id: "api-99" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const provider = createOpenApiEntityTypesProvider({
      apiBaseUrl: "http://localhost:8080/admin/profile/api",
    });

    await expect(provider.listFamilies(baseCtx)).rejects.toMatchObject({
      code: "forbidden",
      requestId: "api-99",
    });
  });

  it("posts batch upgrade with snake_case body", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toContain("/v1/entities/batch-upgrade-entity-type-revision");
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({
        entity_type_id: "fam-1",
        only_behind_latest: true,
        limit: 10,
      });
      return new Response(
        JSON.stringify({
          processed: 1,
          succeeded: 1,
          failed: 0,
          results: [{ entity_id: "e1", ok: true, profile_version: 3 }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = createOpenApiEntityTypesProvider({
      apiBaseUrl: "http://localhost:8080/admin/profile/api",
      accessToken: "t",
    });

    const result = await provider.batchUpgradeEntityBindings(
      { entityTypeId: "fam-1", onlyBehindLatest: true, limit: 10 },
      baseCtx,
    );
    expect(result.succeeded).toBe(1);
    expect(result.results[0]).toMatchObject({ entityId: "e1", ok: true, profileVersion: 3 });
  });
});
