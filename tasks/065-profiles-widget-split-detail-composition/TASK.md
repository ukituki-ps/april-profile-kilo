# `@april/profile-ui`: самостоятельный виджет детали профиля + сборка `profiles-widget` (список + деталь + создание)

## Мета

- **ID / ветка:** `065-profiles-widget-split-detail-composition` / `develop` (работа в `feature/*`, merge через PR)
- **Приоритет:** обычный (архитектурный рефакторинг публичного API и доков)
- **Связанные файлы:** [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md), [`docs/widgets/profile/profiles-widget-profile-detail.md`](../../docs/widgets/profile/profiles-widget-profile-detail.md), [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md), пакет [`frontend/packages/profile-ui/`](../../frontend/packages/profile-ui/), [`frontend/src/widgetDemos/`](../../frontend/src/widgetDemos/), [`tasks/062-docs-profiles-widget-spec-list-content-assembly/TASK.md`](../062-docs-profiles-widget-spec-list-content-assembly/TASK.md), [`tasks/064-frontend-profiles-surface-detail-column-only/TASK.md`](../064-frontend-profiles-surface-detail-column-only/TASK.md)

## Цель

Перейти от модели «**один** `ProfilesWidget` + внутренний `layout` / скрытие колонок» к модели:

1. **`profiles-widget-profile-detail`** — **самостоятельный публичный виджет** в `@april/profile-ui` (отдельный экспорт компонента и типов пропсов), состоящий из **двух явных частей**:
   - **Часть 1 — просмотр/редактирование профиля** (карточка выбранной сущности: версии, документ, сегменты Form/Tree/Source/Schema по текущей спеке). **Редактирование опционально**: host может **выключить** возможность менять документ/сохранять (read-only / без мутаций update), сохранив просмотр и навигацию по версиям там, где это допустимо сценарием.
   - **Часть 2 — форма создания профиля** (модалка или эквивалент: тип из каталога, имя, начальный документ). **Открытие не привязано к UI части 1**: host или родительский виджет вызывают открытие создания **извне** (императивный ref / отдельный колбэк / проп `createOpened` — конкретный API на усмотрение исполнителя, но семантика: «создание не только изнутри карточки просмотра»).

2. **`profiles-widget`** — **итоговый составной виджет**:
   - **Левая колонка** — список профилей (текущее поведение списка: поиск, фильтр, пагинация, выбор строки).
   - По **выбору строки** — в области детали монтируется **часть 1** нового виджета `profiles-widget-profile-detail` (или обёртка пакета с тем же контрактом данных).
   - **Кнопка «Создание»** на уровне master-сборки открывает **часть 2** того же виджета `profiles-widget-profile-detail` (не обязательно дублировать модалку внутри `ProfilesWidget`).

3. **Документация:** поверхность **`profiles-widget-list`** как **отдельный markdown-файл** — **исключить** (содержание перенести в **`profiles-widget.md`** как раздел про левую колонку / список; с битых ссылок — редирект или явная замена ссылок по репозиторию). Индекс [`docs/widgets/README.md`](../../docs/widgets/README.md) и сборка [`profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md) обновляются так, чтобы **точка входа** по-прежнему была понятна интегратору.

4. **На будущее (в постановке зафиксировать, не реализовывать в объёме этой задачи):** другие виджеты (например вне `@april/profile-ui`) могут иметь **свой аналог** «детали профиля» с тем же UX-разбиением; в этой задаче — только **паттерн композиции** и публичный API для **профильного** контура.

## Контекст

- Задача **062** разнесла **документацию** на `list` + `profile-detail` + сборку, сознательно **не** вводя отдельные npm-компоненты.
- Задача **064** добавила **`layout="detail-only"`** как быстрый шаг к демо без левой колонки.
- Текущая постановка — **следующий этап**: реальный **split** в коде и контракте, чтобы **`profiles-widget-profile-detail`** соответствовал не только имени md, но и **экспортируемому виджету**; **`profiles-widget`** остаётся **фасадом сборки** со списком.

## Scope

### Входит в объём

- Новый публичный виджет (имя компонента согласовать в PR, ориентир: **`ProfilesWidgetProfileDetail`** или **`ProfilesProfileDetailWidget`**) + экспорт из [`frontend/packages/profile-ui/src/index.ts`](../../frontend/packages/profile-ui/src/index.ts), README пакета, при необходимости — отдельный файл(ы) рядом с текущим `ProfilesWidgetCore.tsx` после выделения логики (без ломания типов провайдера `ProfilesDataProvider`).
- Разделение UI на **часть 1** (просмотр/опционально редактирование) и **часть 2** (создание), с **внешним** триггером для части 2.
- Рефакторинг **`ProfilesWidget`**: список слева + композиция с новым виджетом (часть 1 + кнопка создания → часть 2); удаление или свёртывание временного **`layout="detail-only"`** — **на усмотрение**: либо deprecated-алиас к новому виджету, либо удаление после миграции демо.
- Проп(ы) для **read-only / отключения редактирования** части 1 (имена и гранулярность — в PR; зафиксировать в спеке `profiles-widget-profile-detail.md`).
- Обновление **демо** (`SurfaceDocDemoPages`, `App.tsx`, `frontend/README.md`, `WidgetDemoPages.tsx`): маршрут **`/demo/surfaces/profiles-widget-profile-detail`** монтирует **новый** самостоятельный виджет (MSW как сейчас); маршрут **`/demo/surfaces/profiles-widget-list`** — **удалить или перенаправить** на **`profiles-widget`** с пояснением в UI/README, чтобы не поддерживать отдельную «спеку-страницу только список» без отдельного npm-виджета (согласованно с исключением `profiles-widget-list.md`).
- Документация: обновить **`profiles-widget.md`**, **`profiles-widget-profile-detail.md`**, удалить/слить **`profiles-widget-list.md`**, поправить перекрёстные ссылки; при необходимости — § в **`WIDGET_CONTRACTS.md`** / observability (новый `widgetId` для телеметрии детального виджета **или** явное решение оставить прежние события — **обязательно описать в REPORT**).
- Тесты: unit для нового виджета (часть 1 read-only, открытие части 2 снаружи), регрессия для составного **`ProfilesWidget`**.

### Не входит в объём

- Реализация «аналога детали» для **других** доменных виджетов (только комментарий/раздел «будущее» в спеке или `REPORT.md`).
- Изменение **OpenAPI** / контрактов REST, кроме **использования** существующих операций провайдером.
- Обязательная страница **docs-site** `task-story-*` — по политике PM; по умолчанию достаточно обновления `frontend/README.md` и `docs/widgets/`.

## Технические ограничения

- **DS-first**, без дублирования больших кусков UI; вынос общих кусков во внутренние модули приемлем.
- **Обратная совместимость:** миграционная заметка в README (breaking vs minor semver для `@april/profile-ui`) — semver решение зафиксировать в `REPORT.md`.
- Не коммитить секреты.

## AGENT_MASTER_PROMPT compliance checklist

- [ ] Прочитан [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md).
- [ ] Согласованность с [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) и [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md).
- [ ] Нет противоречий с задачами **042–047**, **058–059**, **062**, **064** (учесть миграцию с `layout`).

## Acceptance criteria

- [ ] В `@april/profile-ui` экспортируется **самостоятельный** виджет детали/создания (имя в PR), с **частью 1** (опционально без редактирования) и **частью 2** (создание), открываемой **не только** из UI части 1.
- [ ] **`ProfilesWidget`** — составной: список + часть 1 + кнопка создания → часть 2; поведение для пользователя эквивалентно или улучшено относительно текущего master-detail (без потери сценариев поиска/фильтра/версий/документа).
- [ ] Файл **`profiles-widget-list.md`** исключён из набора спецификаций (контент перенесён); ссылки по репозиторию обновлены.
- [ ] Демо и README согласованы; MSW-сценарии для профильных демо работают.
- [ ] `npm run lint` / `npm run test` для затронутых workspace проходят.

## Проверка (команды)

```bash
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run
cd frontend && npm run lint && npm test -- --run
```

Ручная проверка: `VITE_PROFILE_DEMO_MOCK=true`, маршруты `/demo/surfaces/profiles-widget-profile-detail`, полный `/profiles-widget-demo` или эквивалент.

## Ожидаемый результат в REPORT

- Имена новых экспортов, решение по semver, список удалённых/объединённых md-файлов.
- Схема композиции (кратко), риски и follow-up (например унификация `widget` в телеметрии).

## Человекопонятная история в docs-site

- [ ] По запросу PM; по умолчанию не требуется.
