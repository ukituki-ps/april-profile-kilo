# План: задача 059 — RJSF для документа в `profiles-widget`

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-05-01
- **Статус плана:** согласован (реализация по этому документу)

## Исходные допущения

- Источник JSON Schema для документа в v1 — **`published_schema`** из **`GET /v1/entity-types/{id}`** через **`getEntityTypePublishedSchema`** (тот же снимок, что read-only вкладка **schema**). Смена на схему конкретной ревизии сущности — **TODO** / отдельная задача при поле в API.
- Shell оборачивает приложение в **`AprilProviders`**; **`DensityProvider`** в корне виджета сохранён.

## UX (зафиксировано)

- Третья ось **Tree | Source | Form** — как дополнительный сегмент в существующем **`SegmentedControl`** внутри **`EntityTypesDraftJsonEditor`** (единая зона `formData`, без вложенных вкладок): совпадает с привычным паттерном 058 и с витриной «форма + дерево» по смыслу, без дублирования верхних вкладок `formData` / `schema`.

## Правила согласованности Form ↔ Tree ↔ Source

| Событие | Правило |
|--------|---------|
| Правка **Form** | `AprilJsonSchemaForm` → `onChange` → общий **`editDraftValue`** / **`createDraftValue`**; Save/Create читают тот же объект (как для Tree). |
| Правка **Tree** / **Source** | Тот же объект; при входе в **Form** передаётся текущий draft как `formData`. |
| **Source → Tree** или **Source → Form** при невалидном JSON | Как в 058: блокировка переключения, **`Alert`**, до успешного parse. |
| **Cancel** edit / смена **версии** / новый snapshot с сервера | **`applyDetailsSnapshot`** / **`onSelectVersion`**: сброс draft и режима на **Tree**. |
| Потеря схемы (ошибка загрузки / `none`) при активном **Form** | `useEffect` в Core: режим → **Tree**; в редакторе — `useEffect`: если `form` и `!withFormMode` → **Tree**. |
| **Create**: смена **entity type** | `useEffect` на **`createTypeId`**: если режим был **Form** → **Tree** (схема перезагружается; избегаем рассинхрона без принудительного сброса всего документа). |

## Политика `$ref` и ограничения RJSF

- Как в **057**: дерево документа не резолвит **`$ref`** в браузере (`resolveValidationSchemaRefs={false}`). Схема для RJSF передаётся в **`AprilJsonSchemaForm`** как из API; небезопасный dereference в prod не добавляется.
- Известные ограничения виджетов DS (**`aprilRjsfWidgets`**, неподдерживаемые конструкции схемы) — fallback: пользователь переключается на **Tree** / **Source**; при отсутствии published-схемы сегмент **Form** не показывается.

## Порядок работ (факт)

1. Расширить **`DraftJsonEditorMode`** и **`EntityTypesDraftJsonEditor`** (`AprilJsonSchemaForm`, опциональные пропсы).
2. Подключить в **`ProfilesWidgetCore`** (create + edit), подсказки при `none` / `error`, эффекты сброса режима.
3. Тесты **`ProfilesWidgetCore.test.tsx`**, документация, docs-site, **`REPORT.md`**.

## Затрагиваемые области

| Область | Изменения |
|--------|-----------|
| `frontend/packages/profile-ui` | `EntityTypesDraftJsonEditor.tsx`, `ProfilesWidgetCore.tsx`, тесты, `package.json` devDependency `@rjsf/utils` (типы) |
| Документация | `docs/widgets/profile/profiles-widget.md`, docs-site, `task_list.md` |
| Backend / OpenAPI | Нет (v1) |

## Риски и откат

| Риск | Митигация |
|------|-----------|
| ABAC-усечённый `document` vs полная схема | Сервер остаётся источником истины (**422** / **`schemaIssues`**); клиентский RJSF — подсказка; при необходимости пользователь правит в Tree/Source. |
| Двойной Ajv (RJSF + сервер) | Как в 057: финальная валидация на сервере. |

**Откат:** revert PR.

## Проверка

Команды из `TASK.md`; smoke: `/profiles-widget-demo`.

## Примечания

- Эталон композиции DS: `JsonTreeEditorSection` — те же примитивы, без импорта **`UIKit`**.
