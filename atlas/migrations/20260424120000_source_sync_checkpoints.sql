-- Checkpoint и идемпотентность для синков внешних source_system (фаза 3, задача 016).

CREATE TABLE source_sync_checkpoints (
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    source_system text NOT NULL,
    last_cursor text NOT NULL DEFAULT '',
    last_seen_source_updated_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now (),
    PRIMARY KEY (tenant_id, source_system)
);

COMMENT ON TABLE source_sync_checkpoints IS 'Checkpoint синхронизации по tenant/source_system (курсор и watermark источника).';

CREATE TABLE source_sync_applied_events (
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    source_system text NOT NULL,
    event_id text NOT NULL,
    external_id text NOT NULL,
    source_updated_at timestamptz NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    applied_at timestamptz NOT NULL DEFAULT now (),
    PRIMARY KEY (tenant_id, source_system, event_id)
);

COMMENT ON TABLE source_sync_applied_events IS 'Журнал применённых событий синка для идемпотентности батчей.';

CREATE INDEX source_sync_applied_events_tenant_source_external_idx
    ON source_sync_applied_events (tenant_id, source_system, external_id);
