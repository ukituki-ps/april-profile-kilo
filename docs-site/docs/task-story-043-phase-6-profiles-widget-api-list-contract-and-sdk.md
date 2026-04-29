---
sidebar_position: 53
---

# 043 — API и SDK для server-side списка `ProfilesWidget`

## Какая была проблема

`ProfilesWidget` нельзя считать production-ready, пока список профилей строится на клиентских костылях (например, через заранее известный набор id). Для боевого сценария нужны серверные поиск/фильтр/пагинация и стабильный SDK-метод, на который сможет опираться рефактор задачи 044.

## Что сделали

- Добавили контракт `GET /v1/entities` для списка профилей:
  - `search`, `entity_type_id`, `limit`, `cursor`, `sort`;
  - детерминированный порядок;
  - ответ с `items`, `next_cursor`, `total_count`.
- Реализовали backend handler и сервисный метод списка с cursor-pagination.
- Нормализовали ошибки list-контракта через envelope `code`, `message`, `request_id` (включая `422` для невалидного cursor/limit).
- Добавили тесты:
  - unit API-level для handler (`httpapi`);
  - integration test для `profiles.Service` с search/filter/cursor semantics.
- Обновили OpenAPI и regenerated frontend SDK (`@april/profile-ui/src/generated`) с новым методом list.

## Что это даёт команде и пользователям

- Виджет получает настоящий server-side источник списка без client-side имитации.
- Контракт пагинации и фильтрации теперь предсказуем и типобезопасен через generated SDK.
- Задача 044 может переходить к `Core + ApiWidget` реализации без временных fallback решений.

## Как проверить без чтения кода

1. Запустить backend-тесты: `go test ./...`.
2. Проверить list semantics в integration:
   - `go test -tags=integration ./internal/integrationtest -run TestProfilesService_ListSupportsSearchFilterAndCursor`.
3. Запустить frontend quality gate:
   - `cd frontend && npm run lint && npm run test && npm run build`.
4. Убедиться, что в generated SDK появился метод `listEntityProfiles`.

## Границы и follow-up

- В рамках 043 не делался UI-рефактор `ProfilesWidget` в `Core + ApiWidget` (это задача 044).
- Hub e2e-интеграция нового потока не входила в scope этой задачи.
- IAM-модель (Keycloak/RBAC/ABAC) не изменялась.

## Ссылки на артефакты

- `tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md`
- `tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/PLAN.md`
- `tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/REPORT.md`
