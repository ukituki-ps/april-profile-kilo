---
sidebar_position: 38
---

# 027 — `ProfileInstancesWidget`: список экземпляров профиля и CRUD

## Какая была проблема

После готовности `ProfilesListWidget` не хватало отдельного виджета для следующего уровня навигации: в контексте выбранного профиля нужно видеть его экземпляры, открывать карточку экземпляра и выполнять базовые CRUD-действия с понятным ABAC-поведением.

## Что сделали

- Добавили в `@april/profile-ui` новый `ProfileInstancesWidget`.
- Реализовали загрузку списка экземпляров в контексте `profileId` (фильтрация по `entity_type_id`) и клиентские поиск/пагинацию.
- Добавили события `onAction` (`created`, `updated`, `deleted`) и `onOpenInstance` для маршрутизации в host.
- Подключили CRUD через существующий OpenAPI-клиент (`createEntityProfile`, `updateEntityProfile`, `deleteEntityProfile`).
- Добавили ABAC-ветки UX:
  - `hidden` — скрытые/недоступные строки не попадают в список;
  - `readonly` — после `403` на write кнопки записи блокируются;
  - `denied` — при `401/403` на чтении показывается явный запрет доступа.
- Добавили demo-страницу `/profile-instances-widget-demo` в локальном shell.
- Покрыли поведение тестами Vitest/RTL + MSW (happy-path, readonly, denied).

## Что это даёт команде

- В AprilHub можно встраивать готовый виджет экземпляров профиля без дублирования логики в host.
- Контракт виджета (props/events) стал предсказуемым для интеграции в BFF/роутинг.
- ABAC-поведение в UI стало единообразным и безопасным.

## Как проверить без чтения кода

1. Выполнить `cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui && npm run build -w @april/profile-ui`.
2. Запустить `cd frontend && npm run dev`, открыть `/profile-instances-widget-demo`.
3. Передать `VITE_PROFILE_API_BASE_URL`, `VITE_PROFILE_ACCESS_TOKEN`, `VITE_PROFILE_INSTANCES_DEMO_PROFILE_ID`, `VITE_PROFILE_INSTANCES_DEMO_ENTITY_IDS`.
4. Проверить create/update/delete и поведение при ошибках доступа.

## Границы (что не делали)

- Не добавляли server-side list/search endpoint по `profileId` (используется входной `instanceIds`).
- Не встраивали виджет в AprilHub и не делали e2e через BFF (это задача `028`).
- Не меняли backend ABAC-политику и правила Keycloak.

## Ссылки на артефакты

- `tasks/027-phase-4a-profile-instances-crud-widget/TASK.md`
- `tasks/027-phase-4a-profile-instances-crud-widget/PLAN.md`
- `tasks/027-phase-4a-profile-instances-crud-widget/REPORT.md`
