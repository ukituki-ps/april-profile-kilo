/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReadyzResponse = {
    status: 'ready' | 'not_ready';
    database: 'ok' | 'unavailable';
    redis: 'ok' | 'unavailable' | 'skipped';
};

