-- Phase 2 (task 010): lifecycle draft -> published for entity type catalog.

ALTER TABLE entity_types
    ADD COLUMN status text NOT NULL DEFAULT 'draft',
    ADD COLUMN published_schema_json jsonb,
    ADD COLUMN published_schema_version int,
    ADD COLUMN published_at timestamptz;

ALTER TABLE entity_types
    ADD CONSTRAINT entity_types_status_allowed CHECK (status IN ('draft', 'published')),
    ADD CONSTRAINT entity_types_published_payload_consistency CHECK (
        (status = 'draft' AND published_schema_json IS NULL AND published_schema_version IS NULL AND published_at IS NULL)
        OR
        (status = 'published' AND published_schema_json IS NOT NULL AND published_schema_version IS NOT NULL AND published_at IS NOT NULL)
    );

COMMENT ON COLUMN entity_types.status IS 'Lifecycle status of entity type schema.';
COMMENT ON COLUMN entity_types.schema_json IS 'Current draft schema (JSON Schema-like document).';
COMMENT ON COLUMN entity_types.schema_version IS 'Draft schema version (starts from 1).';
COMMENT ON COLUMN entity_types.published_schema_json IS 'Published immutable snapshot of schema.';
COMMENT ON COLUMN entity_types.published_schema_version IS 'Version of published snapshot.';
COMMENT ON COLUMN entity_types.published_at IS 'Timestamp when draft became published.';
