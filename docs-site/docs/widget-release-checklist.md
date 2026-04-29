---
sidebar_position: 9
---

# Чеклист релиза виджета (`@april/*-ui`)

> Каноническая копия: `docs/WIDGET_RELEASE_CHECKLIST.md`.

Перед публикацией версии в npm (или перед тегом релиза в монорепо):

## Контракт и код

- [ ] Публичный API соответствует [контрактам виджетов](/docs/widget-contracts) (HostContext, props, events).
- [ ] Нет доменной логики в слое DS; домен остаётся в пакете виджета / API-клиенте.
- [ ] Навигация экосистемы не вызывается напрямую из виджета; только intent-события.
- [ ] `tenant` / `auth` не берутся из недоверенного ввода.

## Версионирование и документация

- [ ] Версия по semver; при breaking — **major** ([версионирование](/docs/versioning-and-compatibility)).
- [ ] Changelog по `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`.
- [ ] Обновлена спецификация виджета (`docs/templates/WIDGET_SPEC_TEMPLATE.md`), если менялся контракт.
- [ ] Синхронизированы канонические карточки в `docs/widgets/...` и соответствующие страницы в docs-site с теми же идентификаторами и статусами.

## Качество

- [ ] Линт и типизация проходят; нет «тихих» `any` на публичных пропсах.
- [ ] Минимальные unit-тесты на эмиссию событий и обработку ошибок.
- [ ] Peer dependencies (`react`, `@april/ui`, …) задекларированы корректно.
- [ ] Для `ProfilesWidget` выполнен release-gate variant C из [TESTING_STRATEGY](https://github.com/ukituki-ps/april-profile/blob/develop/docs/TESTING_STRATEGY.md): Core + provider integration + smoke.
- [ ] Для `ProfilesWidget` есть тесты на `AbortSignal`/race и conflict UX (`401/403/409`).
- [ ] Для `ProfilesWidget` есть evidence фактического прогона gate-команд в `tasks/<id>/REPORT.md`.

## Наблюдаемость

- [ ] События ошибок и успеха содержат `requestId` из контракта при наличии ([наблюдаемость](/docs/widget-observability-guide)).
- [ ] Для `ProfilesWidget` transport-события `list_*`/`details_*` эмитятся и покрыты тестами.

## После публикации

- [ ] Уведомить команды потребителей; при major — задача на обновление Hub с ссылкой на миграцию.
