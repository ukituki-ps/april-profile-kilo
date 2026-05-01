import { http, HttpResponse } from "msw";
import type { RequestHandler } from "msw";

/** Same UUIDs as `ProfilesWidget.test.tsx` so list + filters stay consistent. */
const ENTITY_TYPE_A = "89ac9958-fec8-43d7-8908-f0438e8e0e39";
const ENTITY_TYPE_B = "7fd4f598-c6a7-4b44-9fd8-e8cb2e65d6ad";
const E1 = "c7c5e6ea-8787-4ca0-a691-9f4fdc9830ff";
const E2 = "4f18363d-70e8-4814-9d12-5236b18877d0";
const E3 = "d6f55c6c-6ea8-4ad2-b42b-7e7eefaf55a3";

const jp = (name: string) => JSON.stringify({ name });

type EntityTypeApiRow = {
  id: string;
  namespace: string;
  code: string;
  status: "draft" | "published";
  draft_schema: Record<string, unknown>;
  draft_schema_version: number;
  published_schema?: Record<string, unknown> | null;
  published_schema_version?: number | null;
  published_at?: string | null;
  created_at: string;
};

type RevisionApiRow = {
  id: string;
  family_id: string;
  revision_no: number;
  schema: Record<string, unknown>;
  published_at: string;
};

type ListItem = {
  entity_id: string;
  entity_type_id: string;
  version: number;
  created_at: string;
  preview: string;
};

const schemaPerson: Record<string, unknown> = {
  type: "object",
  properties: {
    name: { type: "string", title: "Display name" },
    email: { type: "string", format: "email" },
  },
  required: ["name"],
};

const schemaOrder: Record<string, unknown> = {
  type: "object",
  properties: {
    orderNo: { type: "string" },
    total: { type: "number" },
  },
};

const buildSnapshot = (entityId: string, version: number, name: string, typeId: string) => ({
  entity_id: entityId,
  entity_type_id: typeId,
  version,
  document: { name },
  created_at: "2026-04-24T10:00:00Z",
  external_refs: [] as unknown[],
});

function previewName(preview: string): string {
  try {
    const o = JSON.parse(preview) as { name?: string };
    return o.name ?? "";
  } catch {
    return "";
  }
}

function snapshotFromListRow(row: ListItem) {
  return buildSnapshot(row.entity_id, row.version, previewName(row.preview) || row.entity_id, row.entity_type_id);
}

type Snap = ReturnType<typeof buildSnapshot>;

function seedVersionHistory(list: ListItem[], past: Map<string, Map<number, Snap>>) {
  for (const row of list) {
    if (!past.has(row.entity_id)) {
      past.set(row.entity_id, new Map());
    }
    past.get(row.entity_id)!.set(row.version, snapshotFromListRow(row));
  }
}

export function createDemoApiHandlers(resolvedBase: string): RequestHandler[] {
  const base = resolvedBase.replace(/\/$/, "");

  const initialFamilies: EntityTypeApiRow[] = [
    {
      id: ENTITY_TYPE_A,
      namespace: "demo",
      code: "person",
      status: "published",
      draft_schema: { ...schemaPerson },
      draft_schema_version: 1,
      published_schema: { ...schemaPerson },
      published_schema_version: 1,
      published_at: "2026-01-01T00:00:00Z",
      created_at: "2025-12-01T00:00:00Z",
    },
    {
      id: ENTITY_TYPE_B,
      namespace: "demo",
      code: "order",
      status: "published",
      draft_schema: { ...schemaOrder },
      draft_schema_version: 1,
      published_schema: { ...schemaOrder },
      published_schema_version: 1,
      published_at: "2026-01-01T00:00:00Z",
      created_at: "2025-12-01T00:00:00Z",
    },
  ];

  const families = new Map<string, EntityTypeApiRow>(initialFamilies.map((r) => [r.id, { ...r }]));

  const revisions = new Map<string, RevisionApiRow[]>([
    [
      ENTITY_TYPE_A,
      [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          family_id: ENTITY_TYPE_A,
          revision_no: 1,
          schema: { ...schemaPerson },
          published_at: "2026-01-01T00:00:00Z",
        },
      ],
    ],
    [
      ENTITY_TYPE_B,
      [
        {
          id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
          family_id: ENTITY_TYPE_B,
          revision_no: 1,
          schema: { ...schemaOrder },
          published_at: "2026-01-01T00:00:00Z",
        },
      ],
    ],
  ]);

  const initialList: ListItem[] = [
    { entity_id: E1, entity_type_id: ENTITY_TYPE_A, version: 1, created_at: "2026-04-24T10:00:00Z", preview: jp("Acme Corp") },
    { entity_id: E2, entity_type_id: ENTITY_TYPE_A, version: 1, created_at: "2026-04-24T10:01:00Z", preview: jp("Contoso Ltd") },
    { entity_id: E3, entity_type_id: ENTITY_TYPE_B, version: 1, created_at: "2026-04-24T10:02:00Z", preview: jp("Order #1042") },
  ];

  let listItems: ListItem[] = initialList.map((r) => ({ ...r }));

  /** Snapshots keyed by entity id and version (for `GET .../versions/:n`). */
  const pastSnapshots = new Map<string, Map<number, Snap>>();
  seedVersionHistory(listItems, pastSnapshots);

  const nextRevId = () => crypto.randomUUID();

  return [
    http.get(`${base}/v1/entity-types`, () =>
      HttpResponse.json({
        items: [...families.values()],
      }),
    ),
    http.get(`${base}/v1/entity-types/:entityTypeID`, ({ params }) => {
      const id = params.entityTypeID as string;
      const row = families.get(id);
      if (!row) {
        return HttpResponse.json({ message: "not found" }, { status: 404 });
      }
      return HttpResponse.json(row);
    }),
    http.post(`${base}/v1/entity-types`, async ({ request }) => {
      const body = (await request.json()) as {
        namespace: string;
        code: string;
        draft_schema: Record<string, unknown>;
      };
      const id = crypto.randomUUID();
      const row: EntityTypeApiRow = {
        id,
        namespace: body.namespace,
        code: body.code,
        status: "draft",
        draft_schema: body.draft_schema ?? {},
        draft_schema_version: 1,
        published_schema: null,
        published_schema_version: null,
        published_at: null,
        created_at: new Date().toISOString(),
      };
      families.set(id, row);
      revisions.set(id, []);
      return HttpResponse.json(row, { status: 201 });
    }),
    http.patch(`${base}/v1/entity-types/:entityTypeID`, async ({ params, request }) => {
      const id = params.entityTypeID as string;
      const row = families.get(id);
      if (!row) {
        return HttpResponse.json({ message: "not found" }, { status: 404 });
      }
      const body = (await request.json()) as { namespace?: string; code?: string };
      const next: EntityTypeApiRow = {
        ...row,
        namespace: body.namespace ?? row.namespace,
        code: body.code ?? row.code,
      };
      families.set(id, next);
      return HttpResponse.json(next);
    }),
    http.delete(`${base}/v1/entity-types/:entityTypeID`, ({ params }) => {
      const id = params.entityTypeID as string;
      if (!families.has(id)) {
        return HttpResponse.json({ message: "not found" }, { status: 404 });
      }
      families.delete(id);
      revisions.delete(id);
      return new HttpResponse(null, { status: 204 });
    }),
    http.put(`${base}/v1/entity-types/:entityTypeID/draft`, async ({ params, request }) => {
      const id = params.entityTypeID as string;
      const row = families.get(id);
      if (!row) {
        return HttpResponse.json({ message: "not found" }, { status: 404 });
      }
      const body = (await request.json()) as {
        draft_schema: Record<string, unknown>;
        if_draft_schema_version: number;
      };
      if (body.if_draft_schema_version !== row.draft_schema_version) {
        return HttpResponse.json({ message: "draft version conflict" }, { status: 409 });
      }
      const next: EntityTypeApiRow = {
        ...row,
        draft_schema: body.draft_schema,
        draft_schema_version: row.draft_schema_version + 1,
      };
      families.set(id, next);
      return HttpResponse.json(next);
    }),
    http.post(`${base}/v1/entity-types/:entityTypeID/publish`, ({ params }) => {
      const id = params.entityTypeID as string;
      const row = families.get(id);
      if (!row) {
        return HttpResponse.json({ message: "not found" }, { status: 404 });
      }
      const nextNo = (row.published_schema_version ?? 0) + 1;
      const list = [...(revisions.get(id) ?? [])];
      const rev: RevisionApiRow = {
        id: nextRevId(),
        family_id: id,
        revision_no: nextNo,
        schema: { ...row.draft_schema },
        published_at: new Date().toISOString(),
      };
      list.push(rev);
      revisions.set(id, list);
      const next: EntityTypeApiRow = {
        ...row,
        status: "published",
        published_schema: { ...row.draft_schema },
        published_schema_version: nextNo,
        published_at: rev.published_at,
      };
      families.set(id, next);
      return HttpResponse.json(next);
    }),
    http.get(`${base}/v1/entity-types/:entityTypeID/revisions`, ({ params }) => {
      const id = params.entityTypeID as string;
      const items = revisions.get(id) ?? [];
      return HttpResponse.json({ items });
    }),

    http.get(`${base}/v1/entities`, ({ request }) => {
      const url = new URL(request.url);
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const type = url.searchParams.get("entity_type_id") ?? "";
      const limit = Number(url.searchParams.get("limit") ?? "20");
      const cursor = url.searchParams.get("cursor");

      const filtered = listItems.filter((item) => {
        const searchHit =
          !search ||
          item.entity_id.toLowerCase().includes(search) ||
          item.preview.toLowerCase().includes(search);
        const typeHit = !type || item.entity_type_id === type;
        return searchHit && typeHit;
      });

      const start = cursor === "cursor-2" ? 2 : 0;
      const page = filtered.slice(start, start + limit);
      const nextCursor = start + limit < filtered.length ? "cursor-2" : null;
      return HttpResponse.json({
        items: page,
        next_cursor: nextCursor,
        total_count: filtered.length,
      });
    }),
    http.get(`${base}/v1/entities/:entityID`, ({ params }) => {
      const id = params.entityID as string;
      const row = listItems.find((x) => x.entity_id === id);
      if (!row) {
        return HttpResponse.json({ message: "not found" }, { status: 404 });
      }
      return HttpResponse.json(snapshotFromListRow(row));
    }),
    http.get(`${base}/v1/entities/:entityID/versions/:version`, ({ params }) => {
      const id = params.entityID as string;
      const ver = Number(params.version);
      const fromPast = pastSnapshots.get(id)?.get(ver);
      if (fromPast) {
        return HttpResponse.json(fromPast);
      }
      const row = listItems.find((x) => x.entity_id === id);
      if (!row || row.version !== ver) {
        return HttpResponse.json({ message: "not found" }, { status: 404 });
      }
      return HttpResponse.json(snapshotFromListRow(row));
    }),
    http.post(`${base}/v1/entities`, async ({ request }) => {
      const body = (await request.json()) as { entity_type_id: string; document: { name?: string } };
      const preview = JSON.stringify({ name: body.document.name ?? "Created" });
      const newId = crypto.randomUUID();
      listItems = [
        {
          entity_id: newId,
          entity_type_id: body.entity_type_id,
          version: 1,
          created_at: new Date().toISOString(),
          preview,
        },
        ...listItems,
      ];
      const snap = buildSnapshot(newId, 1, body.document.name ?? "New profile", body.entity_type_id);
      if (!pastSnapshots.has(newId)) {
        pastSnapshots.set(newId, new Map());
      }
      pastSnapshots.get(newId)!.set(1, snap);
      return HttpResponse.json(snap, { status: 201 });
    }),
    http.put(`${base}/v1/entities/:entityID`, async ({ params, request }) => {
      const id = params.entityID as string;
      const body = (await request.json()) as { document: { name?: string } };
      const idx = listItems.findIndex((x) => x.entity_id === id);
      if (idx === -1) {
        return HttpResponse.json({ message: "not found" }, { status: 404 });
      }
      const row = listItems[idx]!;
      const nextVersion = row.version + 1;
      const name = body.document.name ?? (previewName(row.preview) || id);
      if (!pastSnapshots.has(id)) {
        pastSnapshots.set(id, new Map());
      }
      pastSnapshots.get(id)!.set(row.version, snapshotFromListRow(row));
      listItems = [
        ...listItems.slice(0, idx),
        {
          ...row,
          version: nextVersion,
          preview: JSON.stringify({ name }),
        },
        ...listItems.slice(idx + 1),
      ];
      const nextSnap = buildSnapshot(id, nextVersion, name, row.entity_type_id);
      pastSnapshots.get(id)!.set(nextVersion, nextSnap);
      return HttpResponse.json(nextSnap);
    }),
    http.delete(`${base}/v1/entities/:entityID`, ({ params }) => {
      const id = params.entityID as string;
      listItems = listItems.filter((item) => item.entity_id !== id);
      pastSnapshots.delete(id);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${base}/v1/entities/:entityID/upgrade-entity-type-revision`, async ({ params, request }) => {
      const id = params.entityID as string;
      const idx = listItems.findIndex((x) => x.entity_id === id);
      if (idx === -1) {
        return HttpResponse.json({ message: "not found" }, { status: 404 });
      }
      void request.json();
      const row = listItems[idx]!;
      const nextVersion = row.version + 1;
      if (!pastSnapshots.has(id)) {
        pastSnapshots.set(id, new Map());
      }
      pastSnapshots.get(id)!.set(row.version, snapshotFromListRow(row));
      listItems = [
        ...listItems.slice(0, idx),
        { ...row, version: nextVersion },
        ...listItems.slice(idx + 1),
      ];
      const up = buildSnapshot(id, nextVersion, previewName(row.preview) || id, row.entity_type_id);
      pastSnapshots.get(id)!.set(nextVersion, up);
      return HttpResponse.json(up);
    }),
    http.post(`${base}/v1/entities/batch-upgrade-entity-type-revision`, async ({ request }) => {
      const body = (await request.json()) as { entity_ids?: string[] };
      const ids = body.entity_ids ?? [];
      const results = ids.map((entity_id) => ({
        entity_id,
        ok: true,
        profile_version: 2,
      }));
      return HttpResponse.json({
        processed: ids.length,
        succeeded: ids.length,
        failed: 0,
        results,
      });
    }),
  ];
}
