/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalRef } from './ExternalRef';
/**
 * Снимок профиля. Для **GET**-ответов при включённой политике ABAC на сервере поле `document`
 * может не содержать часть namespace-объектов и корневых полей: видимость задаётся конфигурацией
 * сопоставления сегментов полей realm-ролям Keycloak (переменная окружения `ABAC_SEGMENT_ACCESS_JSON`).
 * Сегмент `default` — корневые скалярные поля документа; именованные вложенные объекты — сегменты
 * с именем ключа верхнего уровня. В `_meta.authority` остаются только пути, относящиеся к разрешённым сегментам.
 * **POST/PUT** возвращают полный документ без ABAC-фильтрации выдачи.
 *
 */
export type ProfileSnapshot = {
    entity_id: string;
    entity_type_id: string;
    version: number;
    document: Record<string, any>;
    created_at: string;
    external_refs: Array<ExternalRef>;
};

