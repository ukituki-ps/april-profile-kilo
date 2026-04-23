/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalRef } from './ExternalRef';
export type UpdateEntityRequest = {
    document: Record<string, any>;
    /**
     * Логический источник входящего изменения для authority (по умолчанию api).
     */
    write_source?: string;
    external_refs?: Array<ExternalRef>;
};

