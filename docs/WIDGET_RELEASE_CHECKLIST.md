# Чеклист релиза виджета (`@april/*-ui`)

> Опубликованная копия: `docs-site/docs/widget-release-checklist.md`.

Перед публикацией версии в npm (или перед тегом релиза в монорепо):

## Контракт и код

- [ ] Публичный API соответствует [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md) (HostContext, props, events).
- [ ] Нет доменной логики в слое DS; домен остаётся в пакете виджета / API-клиенте.
- [ ] Навигация экосистемы не вызывается напрямую из виджета; только intent-события.
- [ ] `tenant` / `auth` не берутся из недоверенного ввода.

## Версионирование и документация

- [ ] Версия по semver; при breaking — **major** ([`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md)).
- [ ] Changelog по [`templates/WIDGET_CHANGELOG_TEMPLATE.md`](./templates/WIDGET_CHANGELOG_TEMPLATE.md).
- [ ] Обновлена спецификация виджета ([`templates/WIDGET_SPEC_TEMPLATE.md`](./templates/WIDGET_SPEC_TEMPLATE.md)), если менялся контракт.
- [ ] Обновлены карточка в `docs/widgets/...` и адаптированная страница в `docs-site/` без расхождения терминов (`profileId`, `widgetId`, `contractVersion`, `lifecycleStatus`).

## Качество

- [ ] Линт и типизация проходят; нет «тихих» `any` на публичных пропсах.
- [ ] Минимальные unit-тесты на эмиссию событий и обработку ошибок.
- [ ] Peer dependencies (`react`, `@april/ui`, …) задекларированы корректно.
- [ ] Для `ProfilesWidget` выполнен release-gate variant C из [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md): Core + provider integration + smoke.
- [ ] Для `ProfilesWidget` есть тесты на `AbortSignal`/race и conflict UX (`401/403/409`).
- [ ] Для `ProfilesWidget` есть evidence фактического прогона gate-команд в `tasks/<id>/REPORT.md`.

## Наблюдаемость

- [ ] События ошибок и успеха содержат `requestId` из [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md) при наличии ([`WIDGET_OBSERVABILITY_GUIDE.md`](./WIDGET_OBSERVABILITY_GUIDE.md)).
- [ ] Для `ProfilesWidget` transport-события `list_*`/`details_*` эмитятся и покрыты тестами.

## После публикации

- [ ] Уведомить команды потребителей; при major — задача на обновление Hub с ссылкой на миграцию.
