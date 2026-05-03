# `@april/profile-ui` + `@april/ui`: мобильный `profiles-widget` — `AprilMobileShellBar`, `AprilVaulBottomSheet`, компактный тулбар детали

## Мета

| Поле | Значение |
|------|----------|
| **id** | `072-profiles-widget-mobile-shell-bottom-sheet` |
| **ветка (рекомендация)** | `feature/profiles-widget-mobile-shell-bottom-sheet` |
| **приоритет** | обычный (UX-слой составного виджета; без смены REST/OpenAPI) |
| **пакеты** | `@april/profile-ui`; при необходимости расширение **`@april/ui`** (submodule **DisignApril**) |
| **ключевые файлы (ориентир)** | `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`, `ProfilesWidgetProfileDetailCore.tsx`; `design-system/DisignApril/packages/ui/src/components/CardListColumn.tsx`, `AprilMobileShellBar.tsx`, `AprilVaulBottomSheet.tsx` |
| **нормативные документы** | [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md), [`docs/widgets/profile/profiles-widget-profile-detail.md`](../../docs/widgets/profile/profiles-widget-profile-detail.md), [`design-system/DisignApril/DESIGN_SYSTEM.md`](../../design-system/DisignApril/DESIGN_SYSTEM.md) (§8 mobile, §11 модалки), [`docs/widgets/MASTER_DETAIL_WIDGET_PATTERN.md`](../../docs/widgets/MASTER_DETAIL_WIDGET_PATTERN.md) |
| **предшественники** | [`tasks/068-profiles-widget-grid-view-detail-modal/TASK.md`](../068-profiles-widget-grid-view-detail-modal/TASK.md) (grid + `AprilModal`), [`tasks/069-micro-ds-0-1-9-bump/TASK.md`](../069-micro-ds-0-1-9-bump/TASK.md) (`CardListColumn` mobile), [`tasks/070-micro-profiles-grid-modal-detail-header-ds/TASK.md`](../070-micro-profiles-grid-modal-detail-header-ds/TASK.md) (chrome детали в шапке модалки) |
| **детальный план** | [`PLAN.md`](./PLAN.md) |

## Цель

На **узком viewport** (как у `CardListColumn`: `(max-width: 47.99em)` / порог `sm` Mantine) выровнять **`profiles-widget`** с уже принятым в ДС мобильным паттерном **`CardListColumn`**:

1. **Список профилей** включает мобильный режим колонки (`mobileLayout: 'auto'`), нижняя панель — **`AprilMobileShellBar`**, вспомогательные листы (фильтр и т.д.) — **`AprilVaulBottomSheet`** (как в ДС, без регрессии десктопа при `mobileLayout: 'off'` по умолчанию для чужих встраиваний — см. допущения в [`PLAN.md`](./PLAN.md)).
2. **Деталь профиля** в сценарии «полноширинный список + деталь поверх» (сейчас это ветка **`view === 'grid'`** + `AprilModal` в **`ProfilesWidgetCore`**) на мобилке показывается в **`AprilVaulBottomSheet`** (или эквивалент DS-first из `@april/ui`), а не в центрированной **`AprilModal`**, с согласованным закрытием и сбросом выбора (семантика как у **068**).
3. **Переключение вида списка** (`list` ↔ `grid`) на мобилке — **одна кнопка-цикл** (карусель), доступная в зоне мобильного shell (как `getNextCardListColumnView` в ДС; сейчас цикл в шапке `CardListColumn` на мобилке скрыт).
4. **Тулбар детальной карточки** (`ProfilesWidgetProfileDetailCore`): основные действия укладываются в норму **«один активный контекст»** для нижней панели / шапки листа — в частности **версии**: по нажатию на **иконку версии** открывается **лист со списком версий**; в этом режиме **остальные кнопки панели скрыты** (аналогично тому, как `CardListColumn` подменяет `center` в `AprilMobileShellBar` при открытом фильтре).

Публичные контракты **`ProfilesWidget`** / **`ProfilesWidgetProps`** и **`ProfilesWidgetProfileDetail`** по возможности **не ломать**; новые пропсы только при необходимости и с обоснованием в `REPORT.md` (semver).

## Контекст для агента

- Сейчас **`ProfilesWidgetCore`** не передаёт в **`CardListColumn`** проп **`mobileLayout`** → по умолчанию **`off`**: на телефоне список ведёт себя как на десктопе, деталь в grid остаётся в **`AprilModal`**.
- В **`CardListColumn`** уже реализованы **`AprilMobileShellBar`**, **`AprilVaulBottomSheet`** для filter/sort/add, принудительный **grid-chrome** на мобилке и одноколоночная сетка; цикл **`list`/`grid`** в шапке отключён при **`isMobile`**.
- **`ProfilesWidgetProfileDetailCore`** собирает плотный **`profileDetailToolbar`** (в т.ч. `Select` версий, `DraftJsonEditorToolbar`, save/edit/delete); для grid+modal действия частично выносятся в **`AprilModal.headerActions`** через **`hostGridProfileModalChrome`** и портал — на мобилке нужен **параллельный** сценарий (sheet + shell / подлист версий).

## Входит в объём

### Список (`ProfilesWidgetCore` + `CardListColumn`)

- Включить для встроенного **`CardListColumn`** режим **`mobileLayout="auto"`** (или согласованный контролируемый проп с дефолтом `auto`, если хосту нужен `off` в iframe — зафиксировать в `PLAN.md` / типах).
- Согласовать **layout master–detail на узком экране**: при **`mobileLayout`** у колонки ДС визуально всегда grid-chrome; **`ProfilesWidgetCore`** не должен оставлять узкую левую колонку + правую деталь одновременно в конфликтующем виде (явная политика: например на narrow всегда трактовать поток как **«список на ширину + деталь в sheet»** при выборе, независимо от `cardListView`, **или** форсировать `grid` на breakpoint — выбрать один вариант в `PLAN.md` и покрыть тестом).
- **Цикл вида `list`/`grid` на мобилке:** реализовать отображение одной кнопки (иконка следующего вида + `aria-label`, семантика как у **`CycleViewIcon`** / **`getNextCardListColumnView`**). Допустимые пути: (а) расширение **`CardListColumn`** в **DisignApril** (предпочтительно для переиспользования); (б) узкоспециальный слой только в **`ProfilesWidgetCore`** — только с обоснованием в `REPORT.md`, если правки ДС откладываются.

### Деталь вместо центрированной модалки на мобилке

- При **`gridProfileModalOpened`** и узком viewport: рендер **`ProfilesWidgetProfileDetailCore`** в **`AprilVaulBottomSheet`** (или документированный аналог из `@april/ui`), с заголовком, закрытием по жесту/кнопке и **сохранением семантики 068** (сброс выбора, `closeCreate`, отмена «сессии создания» в сетке).
- Портал действий **`hostGridProfileModalChrome`**: для sheet задать **эквивалент слота** (шапка sheet или фиксированная зона над контентом), чтобы не дублировать заголовок и не ломать **070** на десктопе.
- **Стек листов:** фильтр списка (из `CardListColumn`) + деталь профиля — зафиксировать **z-index / порядок закрытия** и поведение **назад** в `REPORT.md`.

### Версии и тулбар детали

- Режим **«список версий»**: по тапу на **иконку версии** открывается bottom sheet (или тот же контейнер с подменой контента) со **списком выбора версии**; в этом режиме **скрыть** прочие действия панели (редактирование, сегменты JSON-редактора в bar — по согласованной матрице в `PLAN.md`).
- После выбора версии — вернуться к основному набору действий; loading/error — безопасные сообщения (как сейчас).

### Тесты

- Расширить **`ProfilesWidgetCore.test.tsx`** (мок **`useMediaQuery`** / проп `mobileLayout="on"` у мока `CardListColumn`, если нужно): сценарии открытия детали на narrow, закрытие, create-flow в grid на mobile.
- Точечные тесты **`ProfilesWidgetProfileDetailCore`** для ветки версий / shell, если логика выносится в чистые хелперы — по усмотрению исполнителя.

### Документация

- Обновить **`docs/widgets/profile/profiles-widget.md`**: раздел про grid — на мобилке **sheet** вместо **`AprilModal`** (десктоп без изменений или явное исключение).
- Обновить **`docs/widgets/profile/profiles-widget-profile-detail.md`**: мобильный тулбар / версии / ограничения standalone vs составная сборка.

## Не входит в объём

- Смена REST/OpenAPI, **`ProfilesDataProvider`**, семантики телеметрии — только если неизбежно; по умолчанию **без** изменений.
- Полный редизайн **`DraftJsonEditorToolbar`** и всех сегментов документа на мобилке (достаточно минимально согласованного поведения + follow-up в `REPORT.md`).
- Обязательная страница **docs-site** `task-story-*` — по политике PM; по умолчанию достаточно `docs/widgets/profile/` (как в **068**).

## Технические ограничения

- **DS-first**: приоритет **`AprilVaulBottomSheet`**, **`AprilMobileShellBar`**, существующие примитивы `@april/ui`; Mantine-only — только с обоснованием в `REPORT.md`.
- Не дублировать крупные куски детальной карточки — переиспользовать **`ProfilesWidgetProfileDetailCore`**; вынос UI — через пропсы / композицию / узкие ветки `isMobile`.
- Не коммитить секреты; публичный API пакета — осознанный semver.

## Требования к дизайн-системе (frontend)

- [ ] Сверка с **`CardListColumn`** (mobile), **`AprilMobileShellBar`** (§ «single active context»), **`AprilVaulBottomSheet`**.
- [ ] При изменении **DisignApril**: отдельный коммит/подзадача в `REPORT.md`, bump **`@april/ui`** при публикации tarball в репо (micro-задача или явный подпункт — по политике команды).

## AGENT_MASTER_PROMPT compliance

- [ ] Прочитан [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md).
- [ ] Согласованность с [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) и observability (без новых обязательных событий без согласования).

## Acceptance criteria

- [ ] На узком viewport в демо **`profiles-widget`**: список использует мобильный паттерн **`CardListColumn`** (`mobileLayout` не `off`), фильтр открывается в **bottom sheet**, деталь в grid-flow открывается в **sheet**, а не в **`AprilModal`**.
- [ ] На десктопе (широкий viewport): поведение **068** сохранено (grid + **`AprilModal`**, master–detail в list без нежелательных регрессий).
- [ ] Переключение **`list`/`grid`** доступно на мобилке **одной кнопкой** (цикл), с доступным именем / `aria-label`.
- [ ] Версии: сценарий «иконка → список версий → прочие действия скрыты → выбор → возврат» реализован и не ломает сохранение / исторические версии.
- [ ] `cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run` — зелёные (или уточнённые в `PLAN.md` поднаборы).
- [ ] Обновлены **`profiles-widget.md`** и **`profiles-widget-profile-detail.md`**; заполнен **`REPORT.md`**.

## Проверка (команды)

```bash
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run
```

Ручная проверка: `VITE_PROFILE_DEMO_MOCK=true npm run dev` — демо **`profiles-widget`**, сужение окна ниже порога `sm`, grid, выбор карточки, фильтр, версии, создание профиля.

## Ожидаемый результат в `REPORT.md`

- Политика layout на narrow (`list` vs принудительный `grid`).
- Решение по расширению **DisignApril** vs только **profile-ui**.
- Список файлов, результаты команд, риски (два sheet, фокус, a11y), semver **`@april/profile-ui`**.

## Человекопонятная история в docs-site

- [ ] По запросу PM; по умолчанию не требуется (достаточно `docs/widgets/profile/`).
