/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateEntityTypeDraftRequest } from '../models/CreateEntityTypeDraftRequest';
import type { EntityType } from '../models/EntityType';
import type { EntityTypeListResponse } from '../models/EntityTypeListResponse';
import type { EntityTypeRevision } from '../models/EntityTypeRevision';
import type { EntityTypeRevisionListResponse } from '../models/EntityTypeRevisionListResponse';
import type { PatchEntityTypeFamilyRequest } from '../models/PatchEntityTypeFamilyRequest';
import type { PutEntityTypeDraftRequest } from '../models/PutEntityTypeDraftRequest';
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
    /**
     * Получить семейство типа с черновиком и последней ревизией
     * @param entityTypeId
     * @returns EntityType Тип сущности
     * @throws ApiError
     */
    public static getEntityType(
        entityTypeId: string,
    ): CancelablePromise<EntityType> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/entity-types/{entityTypeID}',
            path: {
                'entityTypeID': entityTypeId,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Не найдено`,
            },
        });
    }
    /**
     * Обновить namespace/code семейства типа
     * @param entityTypeId
     * @param requestBody
     * @returns EntityType Обновлённый тип
     * @throws ApiError
     */
    public static patchEntityTypeFamily(
        entityTypeId: string,
        requestBody: PatchEntityTypeFamilyRequest,
    ): CancelablePromise<EntityType> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/entity-types/{entityTypeID}',
            path: {
                'entityTypeID': entityTypeId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Семейство типа не найдено`,
                409: `Дубликат пары namespace/code в tenant`,
            },
        });
    }
    /**
     * Удалить семейство (только без ревизий и без сущностей)
     * @param entityTypeId
     * @returns void
     * @throws ApiError
     */
    public static deleteEntityTypeFamily(
        entityTypeId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/entity-types/{entityTypeID}',
            path: {
                'entityTypeID': entityTypeId,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Семейство типа не найдено`,
                409: `Есть опубликованные ревизии или сущности`,
            },
        });
    }
    /**
     * Сохранить черновик с optimistic concurrency
     * @param entityTypeId
     * @param requestBody
     * @returns EntityType Черновик сохранён
     * @throws ApiError
     */
    public static putEntityTypeDraft(
        entityTypeId: string,
        requestBody: PutEntityTypeDraftRequest,
    ): CancelablePromise<EntityType> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/v1/entity-types/{entityTypeID}/draft',
            path: {
                'entityTypeID': entityTypeId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Невалидный JSON или отсутствует if_draft_schema_version`,
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Семейство типа не найдено`,
                409: `Конфликт if_draft_schema_version`,
            },
        });
    }
    /**
     * Список опубликованных ревизий семейства
     * @param entityTypeId
     * @returns EntityTypeRevisionListResponse Ревизии по возрастанию revision_no
     * @throws ApiError
     */
    public static listEntityTypeRevisions(
        entityTypeId: string,
    ): CancelablePromise<EntityTypeRevisionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/entity-types/{entityTypeID}/revisions',
            path: {
                'entityTypeID': entityTypeId,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
            },
        });
    }
    /**
     * Получить ревизию по номеру
     * @param entityTypeId
     * @param revisionNo
     * @returns EntityTypeRevision Ревизия схемы
     * @throws ApiError
     */
    public static getEntityTypeRevisionByNo(
        entityTypeId: string,
        revisionNo: number,
    ): CancelablePromise<EntityTypeRevision> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/entity-types/{entityTypeID}/revisions/by-revision-no/{revisionNo}',
            path: {
                'entityTypeID': entityTypeId,
                'revisionNo': revisionNo,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Ревизия или семейство не найдены`,
            },
        });
    }
    /**
     * Получить ревизию по UUID
     * @param entityTypeId
     * @param revisionId
     * @returns EntityTypeRevision Ревизия схемы
     * @throws ApiError
     */
    public static getEntityTypeRevision(
        entityTypeId: string,
        revisionId: string,
    ): CancelablePromise<EntityTypeRevision> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/entity-types/{entityTypeID}/revisions/{revisionID}',
            path: {
                'entityTypeID': entityTypeId,
                'revisionID': revisionId,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Ревизия или семейство не найдены`,
            },
        });
    }
}
