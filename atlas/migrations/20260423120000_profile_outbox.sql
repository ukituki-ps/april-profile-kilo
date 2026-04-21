-- Outbox для событий изменения профиля (transactional outbox, ADR-0003).
-- Заменяет заготовку profile_events: полноценная таблица с payload и статусом публикации.

DROP TABLE IF EXISTS profile_events;

CREATE TABLE profile_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    event_id uuid NOT NULL,
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    entity_id uuid NOT NULL,
    entity_type text NOT NULL,
    profile_version bigint NOT NULL,
    occurred_at timestamptz NOT NULL,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now (),
    published_at timestamptz,
    CONSTRAINT profile_outbox_status_check CHECK (
        status IN ('pending', 'published', 'failed')
    ),
    CONSTRAINT profile_outbox_version_positive CHECK (profile_version > 0),
    CONSTRAINT profile_outbox_event_id_uq UNIQUE (event_id),
    CONSTRAINT profile_outbox_idempotent_uq UNIQUE (tenant_id, entity_id, profile_version),
    FOREIGN KEY (tenant_id, entity_id) REFERENCES entities (tenant_id, entity_id) ON DELETE CASCADE
);

COMMENT ON TABLE profile_outbox IS 'Transactional outbox: события изменения профиля; идемпотентность по (tenant_id, entity_id, profile_version) и event_id.';

CREATE INDEX profile_outbox_tenant_status_idx ON profile_outbox (tenant_id, status);

CREATE INDEX profile_outbox_tenant_created_idx ON profile_outbox (tenant_id, created_at);
