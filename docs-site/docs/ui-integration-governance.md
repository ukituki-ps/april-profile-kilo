---
sidebar_position: 5
---

# Гибридная интеграция UI: governance

Канонические тексты в корне репозитория: `docs/*.md` — при правках синхронизируйте с этими страницами.

**Решение зафиксировано:** [ADR-0004: гибридная модель интеграции UI](/adr/hybrid-ui-integration-model).

## Три режима

| Режим | Описание |
|-------|----------|
| **Host-driven** | Полноценный экран в AprilHub; уникальная IA и оркестрация. |
| **Widget-driven** | Переиспользуемые блоки в `@april/*-ui` с контрактами host ↔ widget. |
| **API/BFF-first** | Данные и действия через API без обязательного слоя виджетов (переходный или тонкий клиент). |

## Документы

| Документ | Содержание |
|----------|------------|
| [Контракты виджетов (HostContext, props, events)](/docs/widget-contracts) | Версия v1 |
| [Операционная модель документации виджетов](/docs/widget-docs-operating-model) | Единый словарь `profileId/widgetId/version/status` и DoD |
| [Каталог профилей и виджетов](/docs/widget-catalog) | Точка входа в текущие карточки виджетов |
| [Матрица решений](/docs/decision-matrix-ui-integration) | Когда какой режим |
| [Версионирование и совместимость](/docs/versioning-and-compatibility) | Semver, матрица host × widget, deprecation |
| [Чеклист релиза виджета](/docs/widget-release-checklist) | Перед публикацией npm |
| [Чеклист интеграции в host](/docs/widget-integration-checklist) | Перед merge в Hub |
| [Наблюдаемость виджетов](/docs/widget-observability-guide) | Telemetry, ошибки, корреляция |

## Шаблоны (в репозитории)

- `docs/templates/WIDGET_SPEC_TEMPLATE.md`
- `docs/templates/HOST_INTEGRATION_SPEC_TEMPLATE.md`
- `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`

## Связанные материалы

- [Стратегия фронтенда](/docs/frontend-strategy)
- [Дизайн модуля AprilProfile](/docs/design-april-profile)
- Задача трека: `tasks/003-hybrid-ui-integration-governance/` (см. `TASK.md` в каталоге задачи)
