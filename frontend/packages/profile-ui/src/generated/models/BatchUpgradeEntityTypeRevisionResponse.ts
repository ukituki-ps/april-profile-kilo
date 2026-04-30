/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BatchUpgradeEntityTypeRevisionResponse = {
    processed: number;
    succeeded: number;
    failed: number;
    idempotency_key?: string;
    results: Array<{
        entity_id: string;
        ok: boolean;
        code?: string;
        message?: string;
        profile_version?: number;
    }>;
};

