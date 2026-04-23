/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalRef } from './ExternalRef';
export type CreateEntityRequest = {
    entity_type_id: string;
    document: Record<string, any>;
    /**
     * Источник данных для начальной authority-метки полей (по умолчанию api).
     */
    write_source?: string;
    external_refs?: Array<ExternalRef>;
};

