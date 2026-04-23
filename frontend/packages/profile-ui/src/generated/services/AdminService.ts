/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MergeEntityProfilesRequest } from '../models/MergeEntityProfilesRequest';
import type { MergeEntityProfilesResponse } from '../models/MergeEntityProfilesResponse';
import type { ProfileConflictListResponse } from '../models/ProfileConflictListResponse';
import type { ProfileSnapshot } from '../models/ProfileSnapshot';
import type { ResolveProfileConflictRequest } from '../models/ResolveProfileConflictRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Список открытых конфликтов authority (admin)
     * Требуется роль realm из `realm_access.roles` (имя задаётся `KEYCLOAK_ADMIN_REALM_ROLE`, по умолчанию ожидается `april-profile-admin`).
     *
     * @returns ProfileConflictListResponse Открытые конфликты
     * @throws ApiError
     */
    public static listProfileFieldConflicts(): CancelablePromise<ProfileConflictListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/admin/profile-conflicts',
            errors: {
                401: `Нет или невалидный Bearer`,
                403: `Нет tenant claim или недостаточно прав realm-роли`,
            },
        });
    }
    /**
     * Ручное разрешение конфликта authority
     * Записывает выбранное значение как новую версию профиля с источником `manual` в `_meta.authority`, закрывает конфликт, пишет аудит.
     *
     * @param conflictId
     * @param requestBody
     * @returns ProfileSnapshot Новая версия профиля после разрешения
     * @throws ApiError
     */
    public static resolveProfileFieldConflict(
        conflictId: string,
        requestBody: ResolveProfileConflictRequest,
    ): CancelablePromise<ProfileSnapshot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/admin/profile-conflicts/{conflictID}/resolve',
            path: {
                'conflictID': conflictId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Невалидный body`,
                401: `Нет или невалидный Bearer`,
                403: `Недостаточно прав`,
                404: `Конфликт не найден`,
            },
        });
    }
    /**
     * Явный merge дубликатов профилей (source → target)
     * Объединяет профили в пределах tenant и одного `entity_type_id`, переносит external mappings, удаляет source, пишет аудит.
     *
     * @param requestBody
     * @returns MergeEntityProfilesResponse Результат merge (целевой профиль)
     * @throws ApiError
     */
    public static mergeEntityProfiles(
        requestBody: MergeEntityProfilesRequest,
    ): CancelablePromise<MergeEntityProfilesResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/admin/entities/merge',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Некорректная пара сущностей`,
                401: `Нет или невалидный Bearer`,
                403: `Недостаточно прав`,
                404: `Сущность не найдена`,
                409: `Коллизия external mapping при merge`,
            },
        });
    }
}
