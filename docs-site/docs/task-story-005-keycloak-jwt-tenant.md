---
sidebar_position: 21
---

# 005 — JWT Keycloak и tenant "только из токена"

## Проблема простыми словами

До задачи API не проверял "кто ты" через Keycloak на уровне полноценного middleware, а `tenant_id` можно было потенциально подменять недоверенными параметрами запроса.

Риск: пользователь одного tenant мог попытаться сходить в данные другого tenant, просто подставив `tenant_id` в query/body.

## Что сделали

### 1) Научили backend проверять access token от Keycloak

Проверяются:

- подпись токена через JWKS (`KEYCLOAK_JWKS_URL`);
- issuer (`KEYCLOAK_ISSUER`);
- audience (`KEYCLOAK_AUDIENCE`) через `aud`/`azp`;
- срок действия токена;
- наличие `sub`.

### 2) Зафиксировали источник tenant

`tenant_id` для бизнес-логики берется только из доверенного claim токена (по умолчанию claim называется `tenant_id`, можно переопределить через `KEYCLOAK_TENANT_CLAIM`).

Из query/body `tenant_id` не читается для защищенных маршрутов.

### 3) Добавили минимальные маршруты для проверки

- `GET /v1/system/ping` — публичный маршрут (без JWT);
- `GET /v1/auth/whoami` — защищенный маршрут (только Bearer JWT).

### 4) Покрыли поведение тестами и документацией

- юнит/интеграционные тесты на auth/middleware;
- обновлены `README`, `openapi/openapi.yaml`, `.env.example`;
- оформлены `tasks/005.../PLAN.md` и `tasks/005.../REPORT.md`.

## Что получили на выходе

Практически:

- если токена нет или он битый -> API отвечает `401`;
- если токен валидный -> API берет tenant из токена и прокидывает в request context;
- попытка "подсунуть" `tenant_id=evil` в URL не меняет tenant-контекст.

Это базовый защитный слой мультитенантности для следующих API-задач.

## Что проверили на стенде (реально)

Стенд: `192.168.1.42`, realm `april`, client `april-profile-api`.

Проверки:

- `GET /v1/system/ping` -> `200 {"status":"ok"}`
- `GET /v1/auth/whoami` без Bearer -> `401 missing_bearer`
- `GET /v1/auth/whoami` с невалидным токеном -> `401 invalid_token`
- `GET /v1/auth/whoami?tenant_id=evil` с реальным Bearer (где в JWT `tenant_id=tenant-dev`) -> `200`, в ответе `tenant_id=tenant-dev`

Вывод: недоверенный `tenant_id` из запроса игнорируется, используется только claim из JWT.

## Ограничения текущего шага

- Проверка алгоритма подписи сейчас фиксирована на `RS256`.
- Вариант "tenant приходит только через BFF header" не реализован в этой задаче.
- Постоянный runtime backend в dev через compose/ghcr — следующая стадия (задача 007).

## Технические детали

- Постановка: `tasks/005-phase-1-keycloak-jwt-tenant-context/TASK.md`
- План: `tasks/005-phase-1-keycloak-jwt-tenant-context/PLAN.md`
- Отчёт: `tasks/005-phase-1-keycloak-jwt-tenant-context/REPORT.md`
