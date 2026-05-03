# Задача 059 (фаза 7): `@april/profile-ui` — RJSF (`AprilJsonSchemaForm`) для документа профиля в `profiles-widget`

## Мета

- **ID / ветка (рекомендуется):** `feature/task-059-phase-7-profiles-widget-rjsf-document-form`
- **Приоритет:** обычный
- **Связанные документы:**
  - Завершённая база JSON-редакторов: [`058-phase-7-profile-ui-ds-json-profiles-widget-integration`](../058-phase-7-profile-ui-ds-json-profiles-widget-integration/) (`TASK.md`, `REPORT.md`)
  - Карточка виджета: [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md)
  - DS-first и витрина: [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md) (§3.1, §7 — `UIKit` только для демо)
  - Эталон «форма + дерево» в исходниках DS (submodule): `design-system/DisignApril/packages/ui/src/components/JsonTreeEditorSection.tsx`, компонент `AprilJsonSchemaForm`: `.../json/AprilJsonSchemaForm.tsx`, `sanitizeSchemaForRjsf` / виджеты RJSF в том же пакете
  - Тестирование: [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)
  - Контракт embed: [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md)
  - Индекс: [`task_list.md`](../../task_list.md)

## Цель

Дать в **`ProfilesWidgetCore`** третий способ работы с **`document`** (наряду с уже реализованными **Tree / Source** на `AprilJsonTreeEditor` / `AprilJsonCollectionTextEditor`): **форму по JSON Schema** через публичный компонент дизайн-системы **`AprilJsonSchemaForm`** (RJSF + Mantine + `@rjsf/validator-ajv8`), в духе секции **«Данные экземпляра: форма и дерево»** витрины `UIKit`, но встроенного в продуктовый виджет с одним источником правды при **Save** и предсказуемым поведением при переключении режимов.

## Контекст для агента

- Текущий код: `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx` (вкладки `formData` / `schema`; внутри `formData` — дерево/Source; схема типа — `getEntityTypePublishedSchema` / `GET /v1/entity-types/{id}`).
- Провайдер: [`profilesDataProvider.ts`](../../frontend/packages/profile-ui/src/providers/profilesDataProvider.ts), реализация OpenAPI — [`openapiProfilesProvider.ts`](../../frontend/packages/profile-ui/src/providers/openapiProfilesProvider.ts).
- В **058** режим Form (RJSF) был **осознанно отложён** до явных правил согласованности с деревом и наличия схемы в данных API — см. [`058/TASK.md`](../058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md) §2 и **жёсткий запрет №3** (нельзя два противоречивых источника правды без `PLAN.md`).

## Жёсткие требования (нарушение = провал задачи)

1. **DS-first:** использовать только **`AprilJsonSchemaForm`** из **`@april/ui`** для RJSF-формы документа; не подключать «голый» `@rjsf/core` в обход DS без записанного исключения в `TASK.md` / `REPORT.md`.
2. **Один источник правды при сохранении:** объект `document`, который уходит в `provider.create` / `provider.update`, должен быть **однозначно** получен из согласованного состояния (см. `PLAN.md`: приоритет при конфликте Tree/Source vs Form).
3. **Нет витрины в прод-коде:** не импортировать **`UIKit`** в пакет виджета или shell-прод (см. `DESIGN_SYSTEM.md` §7).
4. **Без регрессий 047/051/058:** optimistic concurrency (`expectedVersion`), telemetry, `AbortSignal`, embed layout, вкладка read-only **schema** (JSON Schema типа), обработка `401/403/409/422` и `schemaIssues`.

## Входит в объём

### 1. Условие показа режима «Form»

- Показывать подрежим **Form** (или отдельную под-вкладку внутри **`formData`**, или `SegmentedControl` **Tree | Source | Form** — выбрать в `PLAN.md` с обоснованием UX) **только если** для текущего **`entity_type_id`** загружена **валидная для RJSF** опубликованная схема (`published_schema` из ответа `getEntityTypePublishedSchema` / кэша).
- Если схемы нет, RJSF не поддерживается (`sanitizeSchemaForRjsf` / пустая схема / только draft) — явное сообщение в UI; поведение **Tree / Source** без изменений.

### 2. Интеграция `AprilJsonSchemaForm`

- `schema` как `RJSFSchema` (после необходимого приведения типов / санитизации в духе DS).
- `formData` из текущего состояния документа профиля (`editDraftValue` / `createDraftValue` или выделенное зеркало — зафиксировать в `PLAN.md`).
- `hideDefaultSubmit` + сохранение **существующими** кнопками **Save** / **Create** виджета (связка `form` / `id` как в `JsonTreeEditorSection` или эквивалент без дублирования submit).
- Ошибки RJSF и серверные **`schemaIssues`** — согласованно с **`AprilJsonValidationSummary`** / текущими Alert (не дублировать противоречивые блоки).

### 3. Синхронизация Form ↔ Tree ↔ Source

- Зафиксировать в **`PLAN.md`** пошагово: переключение вкладок/режимов, кто перезаписывает кого, что делаем при невалидном JSON в Source, при несоответствии Form и дерева, при смене версии профиля / смене типа в модалке create.
- Покрыть критичные ветки **unit-тестами** (`ProfilesWidgetCore.test.tsx`).

### 4. Ограничения схемы

- Политика **`$ref`**: как в **057** (по умолчанию без небезопасного dereference в браузере); при необходимости — явное исключение в `PLAN.md`.
- Задокументировать известные ограничения RJSF-обёртки DS (см. `aprilRjsfWidgets` / неподдерживаемые конструкции) и поведение при их срабатывании (fallback только Tree/Source).

### 5. Документация и артефакты задачи

- Обновить [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md): режим Form, компоненты DS, условия доступности.
- **`PLAN.md`** в этой подпапке — до или в начале реализации (шаблон [`docs/AGENT_PLAN_TEMPLATE.md`](../../docs/AGENT_PLAN_TEMPLATE.md)).
- После выполнения — **`REPORT.md`**, строка в [`task_list.md`](../../task_list.md), страница **docs-site** + [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) (формат как у **057–058**).

## Не входит в объём (v1)

- Смена **OpenAPI / Go** ради нового поля в снимке профиля (если не требуется уже сгенерированным контрактом). Привязка документа к **схеме конкретной ревизии типа** (а не к «последней published» семейства) — **follow-up**, если в API появится явное поле на `ProfileSnapshot` / отдельный endpoint; в **059** достаточно зафиксировать текущий источник схемы и TODO.
- Замена **entity-types-widget** или редактора черновика схемы типа.
- Локализация всех строк RJSF (достаточно не ломать текущий язык UI виджета; полная i18n — отдельная задача).

## Технические ограничения

- React 18, Mantine 7, `@april/ui` ≥ **0.1.7** (актуальный vendored shell); не понижать peer-зависимости.
- Комментарии в коде — в стиле соседних файлов пакета (RU/EN как уже принято).

## Требования к дизайн-системе

- [ ] Изучены `AprilJsonSchemaForm`, `AprilJsonValidationSummary`, эталон `JsonTreeEditorSection` в DisignApril.
- [ ] Форма документа собрана на **`AprilJsonSchemaForm`**, без дублирования обходных обёрток RJSF без причины.
- [ ] Исключения из DS-first (если появятся) — в `TASK.md` / `REPORT.md`.

## Критерии готовности (acceptance)

- [ ] При наличии опубликованной схемы, пригодной для RJSF, пользователь может редактировать **`document`** через **Form** и сохранить тем же **Save / Create**, что и раньше.
- [ ] При отсутствии схемы или неподдерживаемой схеме виджет **деградирует** к текущему поведению Tree/Source без падений.
- [ ] Правила переключения Form ↔ Tree ↔ Source описаны в **`PLAN.md`** и покрыты тестами на уровне Core (ключевые сценарии).
- [ ] `cd frontend && npm run lint -w @april/profile-ui`, `npm run test -w @april/profile-ui`, `npm run build -w @april/profile-ui` — зелёные; при принятом gate — `go test ./...`.
- [ ] Обновлены **`profiles-widget.md`**, **docs-site** история, **`task-stories-overview.md`**.

## Проверка (команды)

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

Ручной smoke: `npm run dev` → `/profiles-widget-demo` — профиль с типом из MSW, переключение Tree / Source / Form, сохранение, конфликт 409 при необходимости (по сценарию тестов).

## Результат в отчёте

По [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md): таблица «где какой компонент DS», риски (двойная валидация Ajv RJSF vs сервер, ABAC-усечённый `document` vs полная схема), follow-up по схеме ревизии.

## Зависимости

- **Зависит от:** [`058-phase-7-profile-ui-ds-json-profiles-widget-integration`](../058-phase-7-profile-ui-ds-json-profiles-widget-integration/) (вкладки `formData`/`schema`, `getEntityTypePublishedSchema`, JSON-редакторы DS).

## Связь с витриной `UIKit`

Витрина **`/showcase`** демонстрирует паттерн «форма + дерево» для **обучения и ревью DS**; эта задача **переносит согласованный подмножество поведения** в **`profiles-widget`** под продуктовые ограничения (один `document`, провайдер, telemetry, отсутствие `UIKit` в прод-коде). Поведение **не обязано** быть пиксель-в-пиксель как в `JsonTreeEditorSection`, но **должно ссылаться на те же примитивы DS** и не противоречить `DESIGN_SYSTEM.md`.
