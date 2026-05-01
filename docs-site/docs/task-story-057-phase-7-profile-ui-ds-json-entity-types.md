---
sidebar_position: 252
---

# 057 — JSON-редакторы дизайн-системы в `entity-types-widget`

## Проблема

После задачи **054** черновик JSON Schema и начальный черновик при создании семейства редактировались через обычный **`Textarea`**, а на вкладке **Revisions** не было просмотра **snapshot** схемы. Это расходилось с DS-first политикой и с появлением в **`@april/ui` 0.1.5** готовых JSON-примитивов.

## Что сделали

- В **`EntityTypesWidgetCore`** черновик и модалка создания используют **`AprilJsonTreeEditor`** / **`AprilJsonCollectionTextEditor`** (режимы **Tree** и **Source**), **`AprilJsonValidationSummary`** для `issues` с API и локальной проверки корня как объекта.
- Вкладка **Revisions**: выбор строки таблицы → read-only **`AprilJsonTreeEditor`** для поля `schema` ревизии.
- Обёртка **`DensityProvider`** из `@april/ui` вокруг виджета; в **`package.json`** добавлены **`peerDependencies`** на `@april/ui` ≥ 0.1.5 и **devDependency** на vendored tarball для сборки пакета.
- Общий разбор ошибок OpenAPI: **`mapApiErrorToProfilesProviderError`** + поле **`schemaIssues`** в **`ProfilesProviderError`** (используется и профильным провайдером).

## Что это даёт

- Единый UX с дизайн-системой April, меньше ошибок форматирования JSON и нагляднее структура схемы.
- При **422** с массивом **`issues`** администратор видит список путей и сообщений рядом с редактором, а не только общий текст ошибки.

## Как проверить

1. Собрать фронт: из `frontend/` выполнить `npm run build -w @april/profile-ui` и при необходимости `npm run test -w @april/profile-ui`.
2. В демо-shell открыть **`EntityTypesWidget`**, выбрать семейство → вкладка **Draft**: переключить **Tree / Source**, сохранить черновик.
3. Вкладка **Revisions**: клик по строке → под таблицей read-only дерево схемы.
4. (Опционально) вызвать API, возвращающий **422** с `issues`, и убедиться, что блок «Server validation» заполняется.

## Границы и follow-up

- **`ProfilesWidget`** и общий переиспользуемый слой для документа профиля — задача **058**.
- Полная валидация «это корректная JSON Schema» на клиенте не дублируется: минимальная проверка **корень = object**; семантика — на сервере.

## Ссылки на артефакты

- [`tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/TASK.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/TASK.md)
- [`tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/PLAN.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/PLAN.md)
- [`tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/REPORT.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/REPORT.md)
- Карточка виджета: `docs/widgets/profile/entity-types-widget.md`
