/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EntityType = {
    id: string;
    namespace: string;
    code: string;
    status: 'draft' | 'published';
    draft_schema: Record<string, any>;
    draft_schema_version: number;
    published_schema?: (Record<string, any> | null);
    published_schema_version?: (number | null);
    published_at?: (string | null);
    created_at: string;
};

