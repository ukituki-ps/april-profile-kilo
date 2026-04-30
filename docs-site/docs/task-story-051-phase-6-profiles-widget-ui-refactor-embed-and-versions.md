---
sidebar_position: 248
---

# 051 — рефакторинг UI ProfilesWidget (embed, версии, имя)

## Проблема

Виджет был удобен для полноэкранного демо, но при встраивании в хост оставлял пустое место при схлапывании списка, не заполнял высоту контейнера, показывал отладочные заголовки, список вёл себя как список по `entity_id`, не было явной работы с версиями и именем профиля, создание требовало ручного ввода UUID типа сущности.

## Что сделали

1. Layout на `flex` с `minHeight`/`minWidth: 0`, колонка карточки расширяется; повторная загрузка списка без полноэкранного лоадера, если данные уже были.
2. Убраны строки «Profiles list widget» и «Tenant: …» из корня виджета.
3. Список: основная строка — имя из `document.name` (или сокращённый id), вторичная — версия; id показан мелкой строкой с `title`.
4. Карточка: Select версий (загрузка через `getByVersion` + текущая голова), историческая версия read-only и кнопка «Save snapshot as new version (+1)»; JSON-редактор растягивается по высоте колонки.
5. Действия Edit/Save/Cancel/Delete переведены на `ActionIcon` + `@tabler/icons-react`.
6. Имя профиля при создании и уникальность по уже загруженному списку (клиентская проверка).
7. Модалка создания: Select типа из `listEntityTypes` (`GET /v1/entity-types`), опционально `initialCreateEntityTypeId` для хоста/тестов; без каталога остаётся поле UUID типа.
8. Провайдер: добавлены `getByVersion` и `listEntityTypes` в контракт и в `openapiProfilesProvider`.

## Что это даёт

Интеграторам проще встроить виджет в AprilHub и произвольные shell: предсказуемая геометрия, меньше шума в UI, понятные версии и имена без ручного копирования UUID в модалке (при доступном каталоге типов).

## Как проверить без чтения кода

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

При локальном демо — открыть маршрут приложения с `ProfilesWidget`, проверить список, смену версии и создание профиля.

## Границы задачи

Сделано: UI/UX и клиентский контракт провайдера в рамках описания задачи 051.

Не делалось: серверная уникальность имени и aggregate endpoint списка версий (при больших `version` возможен отдельный API).

## Артефакты

- [`tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/TASK.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/TASK.md)
- [`tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/PLAN.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/PLAN.md)
- [`tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/REPORT.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/REPORT.md)
