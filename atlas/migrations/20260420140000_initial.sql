-- AprilProfile: начальная схема — tenant, заготовка метамодели и профилей (ADR-0002, ADR-0003).
-- Доменный API и JWT — не в этой миграции.
-- Зарезервировано: отдельные таблицы под Asynq/Redis — до фазы 3 (очередь вне схемы БД по умолчанию).

CREATE TABLE tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tenants IS 'Организации (tenant_id); изоляция данных по tenant.';

CREATE TABLE entity_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    namespace text NOT NULL,
    code text NOT NULL,
    schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    schema_version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT entity_types_tenant_namespace_code UNIQUE (tenant_id, namespace, code),
    CONSTRAINT uq_entity_types_tenant_id UNIQUE (tenant_id, id)
);

COMMENT ON TABLE entity_types IS 'Тип сущности с версионируемой схемой (JSON Schema в schema_json — заготовка).';

CREATE INDEX entity_types_tenant_id_idx ON entity_types (tenant_id);

CREATE TABLE entities (
    entity_id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    entity_type_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now (),
    CONSTRAINT entities_tenant_entity_key UNIQUE (tenant_id, entity_id),
    FOREIGN KEY (tenant_id, entity_type_id) REFERENCES entity_types (tenant_id, id) ON DELETE RESTRICT
);

COMMENT ON TABLE entities IS 'Идентичность профиля: стабильный entity_id и связь с типом (полиморфная модель).';

CREATE INDEX entities_tenant_id_idx ON entities (tenant_id);

CREATE TABLE profile_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    entity_id uuid NOT NULL,
    version bigint NOT NULL,
    document jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now (),
    CONSTRAINT profile_versions_entity_version UNIQUE (entity_id, version),
    CONSTRAINT profile_versions_version_positive CHECK (version > 0),
    FOREIGN KEY (tenant_id, entity_id) REFERENCES entities (tenant_id, entity_id) ON DELETE CASCADE
);

COMMENT ON TABLE profile_versions IS 'Версии профиля (append-only; откат — новой версией).';

CREATE INDEX profile_versions_tenant_entity_idx ON profile_versions (tenant_id, entity_id);

CREATE TABLE external_id_mappings (
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    source_system text NOT NULL,
    external_id text NOT NULL,
    entity_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now (),
    PRIMARY KEY (tenant_id, source_system, external_id),
    FOREIGN KEY (tenant_id, entity_id) REFERENCES entities (tenant_id, entity_id) ON DELETE CASCADE
);

COMMENT ON TABLE external_id_mappings IS 'Маппинг (tenant_id, source_system, external_id) → entity_id (ADR-0003).';

CREATE INDEX external_id_mappings_entity_idx ON external_id_mappings (tenant_id, entity_id);

CREATE TABLE profile_events (
    event_id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    entity_id uuid NOT NULL,
    entity_type_code text NOT NULL,
    profile_version bigint NOT NULL,
    occurred_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now (),
    FOREIGN KEY (tenant_id, entity_id) REFERENCES entities (tenant_id, entity_id) ON DELETE CASCADE
);

COMMENT ON TABLE profile_events IS 'Заготовка событий профиля (at-least-once; идемпотентность по event_id).';

CREATE INDEX profile_events_tenant_occurred_idx ON profile_events (tenant_id, occurred_at);
