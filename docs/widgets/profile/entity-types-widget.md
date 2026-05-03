# Карточка виджета: `entity-types-widget` (сборка)

## 1) Мета

| Поле | Значение |
|------|----------|
| `profileId` | `entity-types-admin` |
| `widgetId` | `entity-types-widget` |
| `packageName` | `@april/profile-ui` |
| `contractVersion` | `v1` (на старте; эволюция по [`../../VERSIONING_AND_COMPATIBILITY.md`](../../VERSIONING_AND_COMPATIBILITY.md)) |
| `lifecycleStatus` | `beta` (задача **054**; далее `stable` по релизной политике) |
| Владелец | команда AprilProfile (`april-profile`) + интеграция в AprilHub через BFF/OIDC |

Архитектурное решение по домену типов и ревизий: **ADR-0005** — [`../../adr/0005-entity-type-revisions-and-entity-binding.md`](../../adr/0005-entity-type-revisions-and-entity-binding.md).

## 2) Назначение (сборка)

Виджет обеспечивает **полный административный контур** над **каталогом типов сущностей**: семейство (`namespace` + `code`), **immutable** ревизии схемы, **черновик**, привязка `entity` к ревизии и **явный апгрейд** привязки с валидацией документа профиля (семантика бэкенда — задача **053**; инвариант — append-only версии профиля).

Виджет **не** демо-обёртка: паттерн **`Core` + `ApiWidget` + фасад embed + data provider`**, как у [`profiles-widget`](./profiles-widget.md) (задачи **042–047**). Сборка списка и **детальной карточки** разнесена по компонентам **`EntityTypesWidgetCore`** (каталог + layout + создание семейства) и **`EntityTypesWidgetDetailCore`** (черновик, ревизии, upgrade, patch/delete) — см. [`MASTER_DETAIL_WIDGET_PATTERN.md`](../MASTER_DETAIL_WIDGET_PATTERN.md).

### Документация по поверхностям

| Поверхность | Документ |
|-------------|----------|
| Каталог семейств (список слева, `CardListColumn`) | [`entity-types-widget-catalog-list.md`](./entity-types-widget-catalog-list.md) |
| Черновик, публикация, история ревизий, удаление | [`entity-types-widget-schema-admin.md`](./entity-types-widget-schema-admin.md) |
| Вкладка Entities / Upgrade (`GET /v1/entities`, batch) | [`entity-types-widget-entities-upgrade.md`](./entity-types-widget-entities-upgrade.md) |
| Host: props, `onAction`, ошибки, telemetry | [`entity-types-widget-integration.md`](./entity-types-widget-integration.md) |

## 3) Архитектура кода

```mermaid
flowchart LR
    Host[Host App / AprilHub] -->|hostContext, callbacks| Facade[EntityTypesWidget facade]
    Facade --> Api[EntityTypesApiWidget]
    Api --> Provider[EntityTypesDataProvider]
    Api --> Core[EntityTypesWidgetCore]
    Core --> Detail[EntityTypesWidgetDetailCore]
    Core -->|listFamilies| Provider
    Detail -->|get/save/publish/revisions/upgrade| Provider
    Provider -->|OpenAPI SDK| BFF[/admin/profile/api]
```

- `EntityTypesWidgetCore`: **каталог** (`CardListColumn`), выбор `familyId`, модалка создания семейства, `AbortSignal` на список; без HTTP.
- `EntityTypesWidgetDetailCore`: **детальная карточка** выбранного семейства (вкладки Draft / Revisions / Upgrade, patch/delete), отмена запросов детали; публичный экспорт для кастомного embed при необходимости.
- `EntityTypesApiWidget`: wiring host + OpenAPI provider, отмена запросов через **`AbortSignal`**.
- `EntityTypesWidget`: публичный фасад для embed.

## 4) Контракт интеграции (обзор)

Таблица props, `onAction`, `onError`, telemetry — в [`entity-types-widget-integration.md`](./entity-types-widget-integration.md). Общие правила embed: [`../../WIDGET_CONTRACTS.md`](../../WIDGET_CONTRACTS.md) §9 (`widget: "entity_types"`).

## 5) Требования к UI (сводка)

- **DS-first** на всех поверхностях; запреты и перечень JSON-примитивов — в [`entity-types-widget-schema-admin.md`](./entity-types-widget-schema-admin.md) и [`entity-types-widget-catalog-list.md`](./entity-types-widget-catalog-list.md).
- Эволюция схемы: редактировать черновик; опубликовать → **новая ревизия N+1**; предыдущие ревизии read-only (детали — [`entity-types-widget-schema-admin.md`](./entity-types-widget-schema-admin.md)).
- Привязка и апгрейд сущностей: single- и batch-upgrade, фильтры — [`entity-types-widget-entities-upgrade.md`](./entity-types-widget-entities-upgrade.md).
- Публичные примитивы JSON в **`@april/ui` ≥ 0.1.9** (`AprilJsonTreeEditor`, `AprilJsonCollectionTextEditor`, `AprilJsonValidationSummary`, `DensityProvider`).

## 6) Зависимости по API и SDK

Целевой REST после задачи **053**; детализация по сценариям — в [`entity-types-widget-schema-admin.md`](./entity-types-widget-schema-admin.md), [`entity-types-widget-entities-upgrade.md`](./entity-types-widget-entities-upgrade.md). Прокси BFF: [`../../integration/entity-types-widget-hub-handoff.md`](../../integration/entity-types-widget-hub-handoff.md).

## 7) Безопасность

- `tenant_id` только из доверенного контекста; виджет не принимает tenant из недоверенного ввода.
- Операции каталога и апгрейда — под admin/realm-role политику (детали в Keycloak/host); в UI **403** без утечек внутренних деталей.

## 8) Проверка и качество

Как у фазы `profiles-widget`: lint/test/build `@april/profile-ui`, тесты Core/provider, отсутствие гонок на отмену (`AbortSignal`), обработка вложенных ошибок API. Команды — в `TASK.md` задачи **054**.

## 9) Связанные задачи репозитория

Handoff для AprilHub/BFF: [`../../integration/entity-types-widget-hub-handoff.md`](../../integration/entity-types-widget-hub-handoff.md).

| Задача | Содержание |
|--------|------------|
| [`tasks/052-phase-7-entity-type-revisions-data-model-and-migrations`](../../../tasks/052-phase-7-entity-type-revisions-data-model-and-migrations/TASK.md) | БД + миграции + доменное отображение к ADR-0005 |
| [`tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration`](../../../tasks/053-phase-7-entity-type-revisions-backend-api-profile-integration/TASK.md) | OpenAPI, HTTP handlers, связка с `profiles`, интеграционные тесты |
| [`tasks/054-phase-7-entity-types-widget-production-ui`](../../../tasks/054-phase-7-entity-types-widget-production-ui/TASK.md) | Виджет UI (Core/Api/Facade/Provider), DS-first |
| [`tasks/055-phase-7-entity-types-contract-docs-hub-handoff`](../../../tasks/055-phase-7-entity-types-contract-docs-hub-handoff/TASK.md) | WIDGET_CONTRACTS, docs-site stories, индекс, финализация handoff Hub |
| [`tasks/057-phase-7-profile-ui-ds-json-entity-types-integration`](../../../tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/TASK.md) | Замена textarea на публичные JSON-компоненты `@april/ui` (0.1.9+) в виджете |
| [`tasks/063-docs-entity-types-widget-spec-surfaces-assembly`](../../../tasks/063-docs-entity-types-widget-spec-surfaces-assembly/TASK.md) | Разнесение этой карточки на поверхности + индекс |
