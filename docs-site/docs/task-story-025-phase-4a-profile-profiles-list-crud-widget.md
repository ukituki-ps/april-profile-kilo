---
sidebar_position: 37
---

# 025 — `ProfilesListWidget`: список профилей и базовый CRUD

## Какая была проблема

После задачи `022` в пакете `@april/profile-ui` был только виджет карточки одной сущности. Для AprilHub не хватало готового блока со списком профилей и базовыми операциями создания/редактирования/удаления, чтобы собирать админский сценарий без дублирования UI-логики.

## Что сделали

- Добавили в `@april/profile-ui` новый `ProfilesListWidget`.
- Реализовали состояния `loading`, `empty`, `error` и безопасное UX-сообщение ошибок `401/403/409`.
- Подключили CRUD-операции через существующий OpenAPI-клиент (`ProfilesService`): `createEntityProfile`, `updateEntityProfile`, `deleteEntityProfile`.
- Добавили поиск, фильтр по `entityTypeId` и пагинацию в самом виджете.
- Описали публичный контракт `props/events` в README пакета (`entityIds`, `onAction`, `onError`, `pageSize`).
- Добавили demo-страницу в локальном shell: `/profiles-list-widget-demo`.
- Покрыли виджет тестами Vitest/RTL + MSW (поиск/пагинация, CRUD-сценарии, ошибки доступа/конфликта).

## Что это даёт команде

- В AprilHub можно встраивать готовый список профилей как продуктовый блок, а не собирать его заново.
- Поведение ошибок теперь единообразное и безопасное для пользователя.
- Есть тестируемый и документированный контракт интеграции host → widget.

## Как проверить без чтения кода

1. Выполнить `cd frontend && npm run lint && npm run test && npm run build`.
2. Запустить `cd frontend && npm run dev`, открыть `/profiles-list-widget-demo`.
3. Передать `VITE_PROFILE_API_BASE_URL`, `VITE_PROFILE_ACCESS_TOKEN` и `VITE_PROFILE_LIST_DEMO_ENTITY_IDS`.
4. Проверить поиск/фильтр/страницы и выполнить create/edit/delete в демо.

## Границы (что не делали)

- Не встраивали маршрут и OIDC/BFF-хостинг в AprilHub (это задача `026`).
- Не расширяли backend-контракт новым list endpoint в фазе 2.
- Не добавляли Playwright e2e в контуре AprilHub.

## Ссылки на артефакты

- `tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md`
- `tasks/025-phase-4a-profile-profiles-list-crud-widget/PLAN.md`
- `tasks/025-phase-4a-profile-profiles-list-crud-widget/REPORT.md`
