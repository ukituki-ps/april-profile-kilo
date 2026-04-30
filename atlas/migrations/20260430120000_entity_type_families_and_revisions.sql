-- Task 052: семейство типа + неизменяемые опубликованные ревизии + черновик; привязка сущности к ревизии.
-- Преемник монолитной таблицы entity_types (ADR-0005).

CREATE TABLE entity_type_families (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    namespace text NOT NULL,
    code text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT entity_type_families_tenant_namespace_code UNIQUE (tenant_id, namespace, code),
    CONSTRAINT uq_entity_type_families_tenant_id UNIQUE (tenant_id, id)
);

COMMENT ON TABLE entity_type_families IS 'Семейство логического типа сущности (ключ namespace+code в tenant); id совместимо с прежним entity_types.id.';
CREATE INDEX entity_type_families_tenant_id_idx ON entity_type_families (tenant_id);

CREATE TABLE entity_type_revisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    family_id uuid NOT NULL,
    revision_no int NOT NULL,
    schema_json jsonb NOT NULL,
    published_at timestamptz NOT NULL,
    CONSTRAINT entity_type_revisions_revision_positive CHECK (revision_no > 0),
    CONSTRAINT entity_type_revisions_family_unique_no UNIQUE (tenant_id, family_id, revision_no),
    CONSTRAINT entity_type_revisions_tenant_uuid UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, family_id) REFERENCES entity_type_families (tenant_id, id) ON DELETE CASCADE
);

COMMENT ON TABLE entity_type_revisions IS 'Опубликованные immutable снимки схемы; revision_no монотонен внутри семейства.';
CREATE INDEX entity_type_revisions_tenant_family_idx ON entity_type_revisions (tenant_id, family_id);

CREATE TABLE entity_type_drafts (
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    family_id uuid NOT NULL,
    draft_schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    draft_schema_version int NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now (),
    CONSTRAINT entity_type_drafts_pk PRIMARY KEY (tenant_id, family_id),
    FOREIGN KEY (tenant_id, family_id) REFERENCES entity_type_families (tenant_id, id) ON DELETE CASCADE
);

COMMENT ON TABLE entity_type_drafts IS 'Черновик схемы на семейство (одна строка); до публикации создаётся запись в entity_type_revisions.';

-- Перенос из legacy entity_types в новую модель.
INSERT INTO entity_type_families (id, tenant_id, namespace, code, created_at, updated_at)
SELECT id,
    tenant_id,
    namespace,
    code,
    created_at,
    now()
FROM entity_types;

INSERT INTO entity_type_drafts (tenant_id, family_id, draft_schema_json, draft_schema_version, updated_at)
SELECT tenant_id,
    id,
    schema_json,
    schema_version,
    created_at
FROM entity_types;

INSERT INTO entity_type_revisions (
    id,
    tenant_id,
    family_id,
    revision_no,
    schema_json,
    published_at
)
SELECT gen_random_uuid (),
    tenant_id,
    id,
    GREATEST (COALESCE(published_schema_version, 1), 1),
    CASE
        WHEN published_schema_json IS NOT NULL THEN published_schema_json
        ELSE schema_json
    END,
    COALESCE(published_at, now())
FROM entity_types
WHERE
    status = 'published';

-- Привязка сущности к конкретной опубликованной ревизии (последняя опубликованная на момент миграции).
ALTER TABLE entities
ADD COLUMN bound_entity_type_revision_id uuid;

UPDATE entities e
SET
    bound_entity_type_revision_id = r.id
FROM (
    SELECT DISTINCT ON (tenant_id, family_id)
        id,
        family_id,
        tenant_id
    FROM entity_type_revisions
    ORDER BY
        tenant_id,
        family_id,
        revision_no DESC,
        published_at DESC
) r
WHERE
    e.entity_type_id = r.family_id
    AND e.tenant_id = r.tenant_id;

-- Не должно оставаться сущностей без ревизии (тип мог быть только черновиком — тогда записей профилей быть не должно).
DO $$
BEGIN
    IF EXISTS (
        SELECT
            1
        FROM
            entities e
        WHERE
            e.bound_entity_type_revision_id IS NULL
    ) THEN
        RAISE EXCEPTION 'migration 052: entity without bound_entity_type_revision_id — проверить draft-only типы с существующими сущностями';
    END IF;
END;

$$;

ALTER TABLE entities ALTER COLUMN bound_entity_type_revision_id SET NOT NULL;

ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_tenant_id_entity_type_id_fkey;

ALTER TABLE entities
ADD CONSTRAINT entities_entity_type_family_fk FOREIGN KEY (tenant_id, entity_type_id) REFERENCES entity_type_families (tenant_id, id) ON DELETE RESTRICT;

ALTER TABLE entities
ADD CONSTRAINT entities_bound_entity_type_revision_fk FOREIGN KEY (tenant_id, bound_entity_type_revision_id) REFERENCES entity_type_revisions (tenant_id, id) ON DELETE RESTRICT;

COMMENT ON COLUMN entities.bound_entity_type_revision_id IS 'Опубликованная ревизия схемы, по которой интерпретируется профиль этой сущности (ADR-0005).';

DROP TABLE entity_types;

CREATE INDEX entities_bound_revision_idx ON entities (tenant_id, bound_entity_type_revision_id);
