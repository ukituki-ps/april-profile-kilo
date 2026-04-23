/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WhoAmI } from '../models/WhoAmI';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Идентичность и tenant из JWT (Keycloak)
     * `tenant_id` берётся только из согласованного claim access token (см. README / задачу 005), не из query/body.
     *
     * @returns WhoAmI Текущий субъект и tenant из токена
     * @throws ApiError
     */
    public static getAuthWhoAmI(): CancelablePromise<WhoAmI> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/auth/whoami',
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
            },
        });
    }
}
