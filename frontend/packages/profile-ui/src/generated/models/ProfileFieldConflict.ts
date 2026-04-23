/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProfileFieldConflict = {
    id: string;
    entity_id: string;
    status: 'open' | 'resolved';
    namespace: string;
    field_key: string;
    existing_value?: any;
    incoming_value?: any;
    existing_source: string;
    incoming_source: string;
    reason: string;
    created_at: string;
    resolved_at?: string;
    resolution_value?: any;
    resolved_by_sub?: string;
    resolution_notes?: string;
};

