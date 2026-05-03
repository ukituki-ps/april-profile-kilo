# Frontend: демо `profiles-widget-profile-detail` — только правая колонка (карточка + документ), MSW

## Мета

- **ID / ветка:** `064-frontend-profiles-surface-detail-column-only` / `develop` (работа в `feature/*`, merge через PR)
- **Приоритет:** обычный
- **Связанные файлы:** [`docs/widgets/profile/profiles-widget-profile-detail.md`](../../docs/widgets/profile/profiles-widget-profile-detail.md), [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md), [`frontend/src/widgetDemos/surfaceDemos/SurfaceDocDemoPages.tsx`](../../frontend/src/widgetDemos/surfaceDemos/SurfaceDocDemoPages.tsx), [`frontend/src/App.tsx`](../../frontend/src/App.tsx), [`frontend/src/mocks/handlers.ts`](../../frontend/src/mocks/handlers.ts) (или актуальный путь MSW), [`frontend/README.md`](../../frontend/README.md), пакет [`frontend/packages/profile-ui/`](../../frontend/packages/profile-ui/) (`ProfilesWidget` и внутренняя раскладка master–detail)

## Цель

Маршрут **`/demo/surfaces/profiles-widget-profile-detail`** (локально `http://localhost:5174/demo/surfaces/profiles-widget-profile-detail`) должен показывать **только поверхность карточки профиля и JSON-документа** (правая колонка по спеке), **без** левого списка. Данные — **обязательно моковые**: тот же контур, что у текущих демо (`VITE_PROFILE_DEMO_MOCK=true`, MSW / существующие handlers), без обязательности реального BFF.

## Контекст

Сейчас `ProfilesWidgetProfileDetailSurfaceDemoPage` монтирует тот же `ProfilesSurfaceBody`, что и список — полный `ProfilesWidget`; в `SurfaceDocDemoChrome` это прямо объяснено как временное ограничение пакета. Задача — устранить расхождение между **документацией поверхности** (только правая колонка) и **фактическим UI демо** по этому URL.

## Scope

### Входит в объём

- По URL **`/demo/surfaces/profiles-widget-profile-detail`** пользователь видит **только** UI детальной карточки (версии, имя, сегменты документа Form/Tree/Source/Schema по спеке, действия), **без** `CardListColumn` / списка сущностей слева.
- **Моки обязательны:** страница должна работать в режиме демо-стенда с MSW (или эквивалентом проекта); сценарий проверки в `REPORT.md` — с **`VITE_PROFILE_DEMO_MOCK=true`** (или как зафиксировано в `frontend` для профильных демо).
- После загрузки страницы детальная карточка **не пустая**: предусмотреть предвыбор сущности (например уже есть `autoSelectFirst` на полном виджете — для режима «только детальная карточка» обеспечить эквивалент: начальный `entityId`, первая запись из мок-листа, или явный fixture в MSW).
- Обновить текст **`SurfaceDocDemoChrome`** для этой страницы: убрать/заменить формулировку «полный виджет, смотрите правую колонку», если она перестаёт быть правдой.
- Обновить **`frontend/README.md`** (таблица демо-маршрутов), при необходимости — **`WidgetDemoPages.tsx`** описание ссылки, чтобы не вводить в заблуждение.

### Не входит в объём

- Изменение контракта OpenAPI, BFF, прод-хоста Hub.
- Обязательная новая страница **docs-site** (`task-story-*`): только если отдельно попросят PM/доки; по умолчанию достаточно `frontend/README.md` и спеки при необходимости одной фразы-ссылки.
- Рефакторинг **`/demo/surfaces/profiles-widget-list`** и прочих surface-роутов, кроме минимального переиспользования общих частей (хост-контекст, MSW).
- Смена URL демо: путь **`/demo/surfaces/profiles-widget-profile-detail`** сохраняется (обратная совместимость для закладок и README).

## Технические ограничения

- **DS-first:** не собирать дубль карточки на «голом» Mantine, если детальная карточка уже собрана из компонентов `@april/profile-ui` / `@april/ui`; предпочтительно вынести/прокинуть режим из пакета или переиспользовать внутренний layout.
- Публичный API пакета: новый проп / подкомпонент / режим раскладки — **допустим**, если это минимально чистый способ; избегать дублирования логики провайдера и мутаций.
- Не коммитить секреты; токены в демо — как в существующих страницах.

## AGENT_MASTER_PROMPT compliance checklist

- [x] Прочитан [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md).
- [x] Согласованность с [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) и спекой [`profiles-widget-profile-detail.md`](../../docs/widgets/profile/profiles-widget-profile-detail.md) (поведение карточки не «обрезано» функционально относительно полного виджета, кроме намеренно скрытого списка).
- [x] Нет регрессии для полного `ProfilesWidget` на остальных маршрутах.

## Acceptance criteria

- [x] Открытие `http://localhost:5174/demo/surfaces/profiles-widget-profile-detail` при включённых моках показывает **только** правую колонку (нет левого списка профилей).
- [x] Видны и работают (в пределах моков) сценарии детальной карточки: версии, имя, редактор документа / сегменты согласно текущей реализации виджета.
- [x] Моковые данные используются так же, как на соседних демо (MSW + переменная окружения демо, задокументировано в `REPORT.md`).
- [x] `npm run lint` / проверки workspace для затронутых пакетов проходят (минимум: затронутые `frontend` и `@april/profile-ui`, если менялся пакет).
- [x] При наличии тестов маршрутов (`App.test.tsx` и др.) — обновить или добавить проверку, что маршрут ведёт на страницу без полного master–detail (по возможности без хрупкого снапшота всего DOM).

## Проверка (команды)

```bash
cd frontend && npm run lint
# при изменении пакета:
cd frontend && npm run lint -w @april/profile-ui
# при наличии unit-тестов для роутера/страницы:
cd frontend && npm test
```

Ручная проверка: dev-сервер, маршрут выше, **`VITE_PROFILE_DEMO_MOCK=true`**.

## Ожидаемый результат в REPORT

- Список изменённых файлов и краткая суть (как достигнут режим «только детальная карточка»).
- Команды проверки и результат.
- Риски (например дублирование разметки vs новый публичный API), follow-up (если позже вынести отдельный npm-entry «только детальная карточка» для хоста).

## Человекопонятная история в docs-site

- [ ] Не требуется по умолчанию (см. Scope). Если делается — страница `docs-site/docs/task-story-064-….md` + строка в `task-stories-overview.md`.
