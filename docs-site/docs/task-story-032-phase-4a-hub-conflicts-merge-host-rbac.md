---
sidebar_position: 44
---

# 032 — AprilHub: хостинг конфликтного UI, RBAC и e2e (исполнение в AprilHub)

Статус: интеграционная часть фазы **4a.4** выполнена в репозитории **`april-worker`** (AprilHub); продуктовый виджет `ConflictQueueWidget` остаётся в задаче **031** (`april-profile-1`).

## Зачем это бизнесу

Оператор разрешает конфликты authority и выполняет merge дубликатов из единой рабочей зоны AprilHub, не обходя BFF и tenant из JWT.

## Что сделано в Hub

- Hash-маршрут `/app/profile/admin/conflicts`, `HostContext` через существующий провайдер и те же заголовки авторизации, что и у других host-экранов профиля.
- Ограничение shell по роли **`admin`** (согласовано с guard Hub BFF на `/api/v1/admin/profile/*`).
- Автотесты: позитивный сценарий (stubs), негативный RBAC для учётной записи без `admin`.

## Как проверить

1. Поднять контур AprilHub (`docker compose` с профилем `aprilhub`, см. `april-worker/docs-site/docs/getting-started.md`).
2. Войти как пользователь с ролью `admin` в Hub → открыть «Профиль — конфликты и merge».
3. Убедиться, что запросы уходят на BFF-префикс `/api/v1/admin/profile/api/v1/admin/profile-conflicts` и родственные admin-маршруты.
4. Войти как `april-user` (только `user`) и открыть `#/app/profile/admin/conflicts` — ожидается экран «Доступ запрещен».

## Роли и риски

- Неверная выдача ролей в Keycloak даёт ложное чувство доступа: shell может совпасть с политикой Hub, но AprilProfile вернёт 403, если нет `KEYCLOAK_ADMIN_REALM_ROLE` в JWT.
- Не ослаблять tenant-изоляцию: tenant только из доверенного контекста токена/BFF.

## Ссылки

- `tasks/032-phase-4a-hub-conflicts-merge-host-rbac/TASK.md`
- `tasks/032-phase-4a-hub-conflicts-merge-host-rbac/REPORT.md`
- `tasks/029-aprilhub-execute-external-task-032-april-profile-1/REPORT.md` в репозитории `april-worker`
