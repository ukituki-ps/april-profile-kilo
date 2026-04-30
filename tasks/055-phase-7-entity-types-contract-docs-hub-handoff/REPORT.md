## 1) Итого

- Статус: ✅ выполнено
- Задача: 055 — контракты embed, docs-site истории, handoff AprilHub/BFF
- Ветка: `feature/task-055-phase-7-entity-types-contract-docs-hub-handoff` (рекомендуется для PR)
- Коммиты: `5052915` (основной объём), `1ebb01c` (уточнение REPORT)
- PR: не создавался из среды агента

## 2) Что сделано

- **[docs]** Добавлен раздел **§9** в [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) и зеркало [`docs-site/docs/widget-contracts.md`](../../docs-site/docs/widget-contracts.md): baseline `EntityTypesWidget` (слои Core/Api/фасад), `EntityTypesDataProvider`, публичные props, расширение telemetry (`entity_types`, `draft_save_*`, `publish_*`, `upgrade_*`, `batch_upgrade_*`), ссылка на handoff.
- **[docs]** Расширены [`docs/WIDGET_INTEGRATION_CHECKLIST.md`](../../docs/WIDGET_INTEGRATION_CHECKLIST.md) и [`docs-site/docs/widget-integration-checklist.md`](../../docs-site/docs/widget-integration-checklist.md): чеклист для **`entity-types-admin` / `entity-types-widget`** (идентификаторы, BFF, `hostContext`, `onAction`/`onOpenEntity`, таймауты publish/batch).
- **[docs]** Финализирован [`docs/integration/entity-types-widget-hub-handoff.md`](../../docs/integration/entity-types-widget-hub-handoff.md): таблица HTTP endpoints, OIDC/RBAC ориентиры, пример `hostContext`, рекомендации по таймаутам BFF, запрет произвольного URL без OIDC.
- **[docs-site]** Новые страницы: [`task-story-052-phase-7-entity-type-revisions-data-model.md`](../../docs-site/docs/task-story-052-phase-7-entity-type-revisions-data-model.md), [`task-story-053-phase-7-entity-type-revisions-api.md`](../../docs-site/docs/task-story-053-phase-7-entity-type-revisions-api.md), [`task-story-054-phase-7-entity-types-widget.md`](../../docs-site/docs/task-story-054-phase-7-entity-types-widget.md); обновлён [`task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md).
- **[docs]** Карточка [`docs/widgets/profile/entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md): telemetry указывает на §9 контрактов.

## 3) Ссылочная матрица (аудитория)

| Документ | Аудитория | Назначение |
|----------|-----------|------------|
| `WIDGET_CONTRACTS.md` §9 | Hub + авторы `@april/profile-ui` | Формальный embed-baseline виджета каталога типов |
| `WIDGET_INTEGRATION_CHECKLIST.md` (новый блок) | Интеграторы host | Не забыть BFF paths, идентификаторы, таймауты |
| `docs/integration/entity-types-widget-hub-handoff.md` | Команда BFF/Hub **вне репозитория** | Исполняемый перечень путей и паттерн OIDC без догадок |
| `docs/widgets/profile/entity-types-widget.md` | Продукт / аналитики | Карточка виджета и ссылки на контракты |
| docs-site `task-story-052/053/054` | Все | Человекопонятные истории эпика фазы 7 |
| `tasks/052–055/*/TASK|PLAN|REPORT` | Разработка AprilProfile | Источник истины по объёму и факту выполнения |

**Внешнему исполнителю Hub** остаётся: реализация маршрутов, OIDC client, layout страницы и e2e по политике Hub — в репозитории зафиксированы только **входные требования** и handoff.

## 4) Изменённые файлы

- `docs/WIDGET_CONTRACTS.md`
- `docs/WIDGET_INTEGRATION_CHECKLIST.md`
- `docs/integration/entity-types-widget-hub-handoff.md`
- `docs/widgets/profile/entity-types-widget.md`
- `docs-site/docs/widget-contracts.md`
- `docs-site/docs/widget-integration-checklist.md`
- `docs-site/docs/task-story-052-phase-7-entity-type-revisions-data-model.md`
- `docs-site/docs/task-story-053-phase-7-entity-type-revisions-api.md`
- `docs-site/docs/task-story-054-phase-7-entity-types-widget.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/055-phase-7-entity-types-contract-docs-hub-handoff/PLAN.md`
- `tasks/055-phase-7-entity-types-contract-docs-hub-handoff/REPORT.md`
- `task_list.md`

## 5) Миграции и данные

- Нет

## 6) Проверка качества

Команда (фактически):

```bash
cd /home/ukituki/april-profile-1/docs-site && npm ci && npm run build
```

- Линтер / сборка docs-site: **ok** (`cd docs-site && npm ci && npm run build`)

## 7) Деплой

- Не применялся

## 8) Риски и ограничения

- Ссылки на GitHub `develop` в story-страницах предполагают канонический remote `ukituki-ps/april-profile`; при форке заменить на свой upstream в PR при необходимости.

## 9) Что осталось

- [ ] PR и интеграция в AprilHub по handoff (вне этого репозитория).
