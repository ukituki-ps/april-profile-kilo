/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateEntityTypeDraftRequest } from '../models/CreateEntityTypeDraftRequest';
import type { EntityType } from '../models/EntityType';
import type { EntityTypeListResponse } from '../models/EntityTypeListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EntityTypesService {
    /**
     * Список типов сущностей tenant
     * @returns EntityTypeListResponse Каталог типов сущностей текущего tenant
     * @throws ApiError
     */
    public static listEntityTypes(): CancelablePromise<EntityTypeListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/entity-types',
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
            },
        });
    }
    /**
     * Создать черновик типа сущности
     * @param requestBody
     * @returns EntityType Черновик типа создан
     * @throws ApiError
     */
    public static createEntityTypeDraft(
        requestBody: CreateEntityTypeDraftRequest,
    ): CancelablePromise<EntityType> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/entity-types',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Невалидный body или пустые поля namespace/code`,
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
            },
        });
    }
    /**
     * Опубликовать черновик типа сущности (создаёт новую immutable-ревизию схемы; повторные вызовы допускаются)
     * @param entityTypeId
     * @returns EntityType Тип успешно опубликован
     * @throws ApiError
     */
    public static publishEntityTypeDraft(
        entityTypeId: string,
    ): CancelablePromise<EntityType> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/entity-types/{entityTypeID}/publish',
            path: {
                'entityTypeID': entityTypeId,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Тип не найден в текущем tenant`,
                422: `Черновик не проходит структурную валидацию/invariants`,
            },
        });
    }
}
