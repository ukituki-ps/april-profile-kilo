-- Phase 2 (task 012): очередь конфликтов authority по полю/namespace и аудит админ-операций merge/resolve.

CREATE TABLE profile_field_conflicts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    entity_id uuid NOT NULL,
    status text NOT NULL,
    namespace text NOT NULL DEFAULT '',
    field_key text NOT NULL,
    existing_value jsonb,
    incoming_value jsonb,
    existing_source text NOT NULL DEFAULT '',
    incoming_source text NOT NULL DEFAULT '',
    reason text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now (),
    resolved_at timestamptz,
    resolution_value jsonb,
    resolved_by_sub text,
    resolution_notes text,
    CONSTRAINT profile_field_conflicts_status_allowed CHECK (status IN ('open', 'resolved')),
    CONSTRAINT profile_field_conflicts_entity_fk FOREIGN KEY (tenant_id, entity_id) REFERENCES entities (tenant_id, entity_id) ON DELETE CASCADE
);

COMMENT ON TABLE profile_field_conflicts IS 'Очередь конфликтов authority: несовместимые входные изменения по полю в рамках tenant/entity.';

CREATE INDEX profile_field_conflicts_tenant_status_idx ON profile_field_conflicts (tenant_id, status);

CREATE INDEX profile_field_conflicts_tenant_entity_idx ON profile_field_conflicts (tenant_id, entity_id);

CREATE TABLE admin_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    actor_sub text NOT NULL,
    action text NOT NULL,
    entity_id uuid,
    related_entity_id uuid,
    conflict_id uuid REFERENCES profile_field_conflicts (id) ON DELETE SET NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now ()
);

COMMENT ON TABLE admin_audit_log IS 'Аудит админ-операций: merge дубликатов, ручное разрешение конфликтов (ADR-0003).';

CREATE INDEX admin_audit_log_tenant_created_idx ON admin_audit_log (tenant_id, created_at DESC);
