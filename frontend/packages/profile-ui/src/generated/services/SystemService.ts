/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReadyzResponse } from '../models/ReadyzResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemService {
    /**
     * Публичная проверка API (без JWT)
     * @returns any Сервис отвечает
     * @throws ApiError
     */
    public static getSystemPing(): CancelablePromise<{
        status: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/system/ping',
        });
    }
    /**
     * Liveness
     * @returns any Сервис жив
     * @throws ApiError
     */
    public static getHealthz(): CancelablePromise<{
        status?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/healthz',
        });
    }
    /**
     * Readiness
     * Endpoint отражает готовность внешних зависимостей:
     * - PostgreSQL (`database`)
     * - Redis (`redis`)
     * При недоступности хотя бы одной обязательной зависимости возвращается `503`.
     *
     * @returns ReadyzResponse Готов принимать трафик
     * @throws ApiError
     */
    public static getReadyz(): CancelablePromise<ReadyzResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/readyz',
            errors: {
                503: `Не готов (зависимости недоступны)`,
            },
        });
    }
}
