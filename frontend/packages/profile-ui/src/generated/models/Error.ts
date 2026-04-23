/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Error = {
    /**
     * Стабильный код ошибки (машиночитаемый).
     */
    code: string;
    /**
     * Описание для клиента и логов.
     */
    message: string;
    /**
     * Идентификатор запроса для корреляции в логах и трассировке.
     */
    request_id?: string | null;
};

