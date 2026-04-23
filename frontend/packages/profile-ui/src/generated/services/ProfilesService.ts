/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateEntityRequest } from '../models/CreateEntityRequest';
import type { ProfileSnapshot } from '../models/ProfileSnapshot';
import type { UpdateEntityRequest } from '../models/UpdateEntityRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProfilesService {
    /**
     * Создать профиль сущности (version=1)
     * @param requestBody
     * @returns ProfileSnapshot Профиль создан, первая версия сохранена
     * @throws ApiError
     */
    public static createEntityProfile(
        requestBody: CreateEntityRequest,
    ): CancelablePromise<ProfileSnapshot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/entities',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Невалидный payload`,
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Тип сущности не найден`,
                409: `Тип не опубликован, конфликт external mapping или все поля заблокированы authority`,
            },
        });
    }
    /**
     * Получить текущую версию профиля
     * При активной серверной политике ABAC (`ABAC_SEGMENT_ACCESS_JSON`) тело `document` фильтруется
     * по сегментам полей и realm-ролям из JWT (`realm_access.roles`); см. описание `ProfileSnapshot`.
     *
     * @param entityId
     * @returns ProfileSnapshot Текущая версия профиля
     * @throws ApiError
     */
    public static getEntityCurrentProfile(
        entityId: string,
    ): CancelablePromise<ProfileSnapshot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/entities/{entityID}',
            path: {
                'entityID': entityId,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Сущность не найдена`,
            },
        });
    }
    /**
     * Обновить профиль (append-only новая версия)
     * @param entityId
     * @param requestBody
     * @returns ProfileSnapshot Создана новая версия профиля
     * @throws ApiError
     */
    public static updateEntityProfile(
        entityId: string,
        requestBody: UpdateEntityRequest,
    ): CancelablePromise<ProfileSnapshot> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/v1/entities/{entityID}',
            path: {
                'entityID': entityId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Невалидный payload`,
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Сущность не найдена`,
                409: `Конфликт external mapping или все предложенные поля отклонены authority (код \`authority_all_blocked\`)`,
            },
        });
    }
    /**
     * Удалить сущность и её версии
     * @param entityId
     * @returns void
     * @throws ApiError
     */
    public static deleteEntityProfile(
        entityId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/entities/{entityID}',
            path: {
                'entityID': entityId,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Сущность не найдена`,
            },
        });
    }
    /**
     * Получить конкретную версию профиля
     * Как и `GET /v1/entities/{entityID}` — при ABAC выдача `document` может быть усечена по ролям.
     *
     * @param entityId
     * @param version
     * @returns ProfileSnapshot Конкретная версия профиля
     * @throws ApiError
     */
    public static getEntityProfileByVersion(
        entityId: string,
        version: number,
    ): CancelablePromise<ProfileSnapshot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/entities/{entityID}/versions/{version}',
            path: {
                'entityID': entityId,
                'version': version,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Версия или сущность не найдены`,
            },
        });
    }
    /**
     * Получить текущий профиль по внешнему ключу
     * Как и остальные GET профиля — при ABAC `document` фильтруется по realm-ролям JWT.
     *
     * @param sourceSystem
     * @param externalId
     * @returns ProfileSnapshot Текущий профиль для внешнего ключа
     * @throws ApiError
     */
    public static getEntityCurrentByExternal(
        sourceSystem: string,
        externalId: string,
    ): CancelablePromise<ProfileSnapshot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/external-mappings/{sourceSystem}/{externalID}/entity',
            path: {
                'sourceSystem': sourceSystem,
                'externalID': externalId,
            },
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `В токене нет claim с tenant_id`,
                404: `Маппинг не найден`,
            },
        });
    }
}
