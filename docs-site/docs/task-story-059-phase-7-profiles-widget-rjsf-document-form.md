---
sidebar_position: 254
---

# 059 — RJSF (`AprilJsonSchemaForm`) для `document` в `profiles-widget`

## Проблема

После **058** документ профиля редактировался только **Tree** и **Source** на компонентах DS; режим **Form** по опубликованной JSON Schema был отложен из‑за необходимости явных правил одного источника правды и наличия схемы из API.

## Что сделали

- В **`EntityTypesDraftJsonEditor`** добавлен третий сегмент **Form** (при опциональных `withFormMode` + `rjsfSchema`): **`AprilJsonSchemaForm`** из **`@april/ui`**, `hideDefaultSubmit`, данные через общий `value` / `onChange` с Tree/Source.
- **`ProfilesWidgetCore`**: Form доступен, если у провайдера есть **`getEntityTypePublishedSchema`** и загрузка дала **`published_schema`** как JSON-объект (тот же источник, что read-only вкладка **schema** — `GET /v1/entity-types/{id}`). Иначе — подсказки в UI и только Tree/Source.
- Переключение режимов и сброс при смене типа в модалке create / потере схемы — по **`tasks/059-phase-7-profiles-widget-rjsf-document-form/PLAN.md`**; unit-тесты в **`ProfilesWidgetCore.test.tsx`**.

## Что это даёт

- Один объект **`document`** на **Save / Create**: из **`editDraftValue`** / **`createDraftValue`** (в режиме Source после успешного parse; в Form — через `onChange` RJSF).
- Согласованность с **047/051/058**: telemetry, `AbortSignal`, `expectedVersion`, **`schemaIssues`** через **`AprilJsonValidationSummary`**, без **`UIKit`** в прод-коде.

## Как проверить

1. `cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui && npm run build -w @april/profile-ui`
2. Демо: **`/profiles-widget-demo`** — Edit → **Tree | Source | Form**, сохранение.

## Границы и follow-up

- Схема — **последняя published** типа, не ревизия, привязанная к сущности (см. **`TASK.md`** в задаче 059).
- Полный **`$ref`** resolve в браузере не добавлялся (как в **057**); при неподдерживаемых конструкциях — **Tree/Source**.

## Ссылки на артефакты

- [`tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md)
- [`tasks/059-phase-7-profiles-widget-rjsf-document-form/PLAN.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/059-phase-7-profiles-widget-rjsf-document-form/PLAN.md)
- [`tasks/059-phase-7-profiles-widget-rjsf-document-form/REPORT.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/059-phase-7-profiles-widget-rjsf-document-form/REPORT.md)
