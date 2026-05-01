# Документация: `entity-types-widget` — разнесение спецификации на поверхности и «сборку»

## Мета
- **ID / ветка:** `063-docs-entity-types-widget-spec-surfaces-assembly` / `develop`
- **Приоритет:** обычный
- **Связанные файлы:** [`docs/widgets/profile/entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md), [`docs/widgets/README.md`](../../docs/widgets/README.md), [`docs/adr/0005-entity-type-revisions-and-entity-binding.md`](../../docs/adr/0005-entity-type-revisions-and-entity-binding.md), [`docs/integration/entity-types-widget-hub-handoff.md`](../../docs/integration/entity-types-widget-hub-handoff.md), [`docs-site/docs/widget-catalog.md`](../../docs-site/docs/widget-catalog.md)

## Цель
Разделить монолитную карточку **`entity-types-widget`** на **читаемые поверхности** по смыслу UX (не обязательно строго «две колонки», т.к. виджет включает каталог, редактор схемы, историю ревизий и поток **upgrade** сущностей). Итог: отдельные md для **узких** спецификаций плюс **`entity-types-widget.md`** как **сборка и точка входа** (мета, `widgetId`, ссылки на под-спеки, host-контракт, связь с ADR-0005 и задачами 052–057).

## Scope

### Входит в объём
- Добавить в `docs/widgets/profile/` новые файлы (имена — в PR, минимальный набор **три** документа + индекс):
  1. **`entity-types-widget-catalog-list.md`** — master–detail **левая колонка**: список семейств типов, ключ `namespace/code`, индикаторы черновика/последней ревизии, навигация выбора; DS (`CardListColumn`); observability `list_*` / выбор строки.
  2. **`entity-types-widget-schema-admin.md`** — **панель типа** после выбора семейства: черновик схемы, публикация ревизии, история ревизий (read-only), требования к JSON-редакторам `@april/ui`, `AprilJsonValidationSummary`, optimistic concurrency для черновика, события `draft_*` / `publish_*` / `family_*`.
  3. **`entity-types-widget-entities-upgrade.md`** — вкладка/поток **Entities / Upgrade**: список сущностей для апгрейда, single/batch upgrade, связь с `GET /v1/entities`, `onOpenEntity` → profiles; события `upgrade_*` / `batch_upgrade_*`; параметры вроде `pageSize` для списка на вкладке.
- Сократить **`entity-types-widget.md`** до **сборки**:
  - мета-таблица и назначение (кратко);
  - ссылки на три под-дока + сохранить блок про host (`hostContext`, публичные props/events) **либо** вынести props/events в один под-файл `…-integration.md` и дать на него ссылку из индекса — **на выбор исполнителя**, главное — одна понятная точка входа для Hub/BFF;
  - ADR-0005, handoff, таблица связанных задач (052–057) — в индексе или со ссылками без дублирования простыней.
- Проверить согласованность с [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) §9 (`widget: "entity_types"`).
- Обновить **только при необходимости** [`docs/integration/entity-types-widget-hub-handoff.md`](../../docs/integration/entity-types-widget-hub-handoff.md): если там единственная ссылка «вся карточка», добавить строку про новые под-файлы.

### Не входит в объём
- Изменение поведения `EntityTypesWidgetCore` / API / OpenAPI.
- Разбиение npm-пакета на отдельные виджеты.
- Обязательная новая docs-site story.

## AGENT_MASTER_PROMPT compliance checklist
- [ ] Прочитан [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md).
- [ ] Нет противоречий с задачей **054** (production UI) и **057** (DS JSON); нормативные §5/§6 не «ослабляются» при переносе.

## Acceptance criteria
- [ ] Есть **минимум три** новых спецификационных файла + обновлённый **`entity-types-widget.md`** как индекс/сборка.
- [ ] Пользовательские сценарии из текущего §3 распределены по новым файлам **без потери** сценариев (каталог, создание/эволюция, удаление, привязка/апгрейд).
- [ ] [`docs/widgets/README.md`](../../docs/widgets/README.md) по-прежнему ведёт на **`entity-types-widget.md`** как на карточку виджета (допустима подстрочка со списком под-доков).
- [ ] Относительные ссылки между новыми файлами и `WIDGET_CONTRACTS` / ADR работают.

## Проверка (команды)
Ручная проверка markdown-ссылок. При правке `frontend/packages/profile-ui`:
```bash
cd frontend && npm run lint -w @april/profile-ui
```

## Ожидаемый результат в REPORT
Итоговая структура каталога `docs/widgets/profile/`, список затронутых внешних ссылок (ADR, handoff, grep по репо), решение где остались таблицы props, follow-up (например унификация с `profiles-widget` по именованию файлов).
