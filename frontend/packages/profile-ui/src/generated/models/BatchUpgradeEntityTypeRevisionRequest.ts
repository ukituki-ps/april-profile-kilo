/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BatchUpgradeEntityTypeRevisionRequest = {
    /**
     * Семейство типа (`entity_type_families.id`).
     */
    entity_type_id: string;
    target_entity_type_revision_id?: string;
    target_revision_no?: number;
    entity_ids?: Array<string>;
    /**
     * Если true и `entity_ids` пуст — выбрать сущности, у которых привязка старее целевой ревизии.
     */
    only_behind_latest?: boolean;
    limit?: number;
    /**
     * Опциональный ключ для корреляции на стороне клиента (сервер возвращает его в ответе).
     */
    idempotency_key?: string;
};

