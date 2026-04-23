---
sidebar_position: 34
---

# 020 — Контракт вызова AprilProfile за AprilHub BFF

## Что поменялось

В репозитории AprilProfile зафиксирован единый контракт для вызовов через Hub BFF: публичный путь в Hub — `/admin/profile/api/v1/...`, внутренний путь сервиса — `/api/v1/...`, tenant берётся только из JWT claim. Контракт описан в стратегии интеграции, синхронизирован в OpenAPI (`servers` + описание security), а для проверки до готовности Hub добавлен воспроизводимый dev smoke через локальный nginx reverse proxy.

## Зачем это нужно

Без формального контракта Hub и Profile могут разойтись по путям, обработке заголовков и tenant-контексту. Это приводит к ложным 401/403, рискам подмены tenant и «сломанным» smoke-проверкам. После фиксации у обеих команд одна точка истины для интеграции: какой префикс использовать, какие заголовки допустимы и что именно считается доверенным источником tenant.

## Границы задачи

**Сделано:** документация контракта BFF -> Profile, обновление OpenAPI, гайд локального smoke (`curl` через nginx proxy), отчёт и синхронизация task-stories.

**Не входило:** реализация BFF-маршрутов и OIDC-клиента в AprilHub (это отдельная задача 021), расширение CORS под прямой браузерный доступ к Profile без BFF.

## Как проверить без чтения кода

1. Запустить AprilProfile локально (`go run ./cmd/april-profile`) и поднять временный nginx proxy по гайду `docs/guides/PROFILE_BFF_DEV_SMOKE.md`.
2. Выполнить `curl` на `http://127.0.0.1:18080/admin/profile/api/v1/system/ping` — должен вернуться `{"status":"ok"}`.
3. Выполнить `curl` на `.../auth/whoami` с Bearer-токеном и убедиться, что `tenant_id` в ответе берётся из JWT.
4. Повторить запрос с `?tenant_id=fake-tenant` и убедиться, что значение tenant не меняется (query игнорируется как недоверенный источник).

## Официальные артефакты

- Постановка: `tasks/020-phase-4-profile-contract-behind-hub-bff/TASK.md`
- План: `tasks/020-phase-4-profile-contract-behind-hub-bff/PLAN.md`
- Отчёт: `tasks/020-phase-4-profile-contract-behind-hub-bff/REPORT.md`
