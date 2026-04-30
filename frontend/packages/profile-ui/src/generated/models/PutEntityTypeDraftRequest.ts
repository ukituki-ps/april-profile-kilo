/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PutEntityTypeDraftRequest = {
    draft_schema: Record<string, any>;
    /**
     * Ожидаемая текущая версия черновика с GET типа; при рассогласовании — 409.
     */
    if_draft_schema_version: number;
};

