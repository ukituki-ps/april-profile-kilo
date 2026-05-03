# `@april/profile-ui`: режим сетки `CardListColumn` — полная ширина списка и деталь профиля в модальном окне

## Мета

- **ID / ветка:** `068-profiles-widget-grid-view-detail-modal` / `develop` (работа в `feature/*`, merge через PR)
- **Приоритет:** обычный (UX-слой составного виджета, без смены REST/OpenAPI)
- **Связанные документы и код:**
  - [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md)
  - [`docs/widgets/profile/profiles-widget-profile-detail.md`](../../docs/widgets/profile/profiles-widget-profile-detail.md)
  - [`design-system/DisignApril/DESIGN_SYSTEM.md`](../../design-system/DisignApril/DESIGN_SYSTEM.md) — §13 Card List Column (виды `list` / `grid` / `collapsed`; полноэкранная сетка как отдельное действие продукта)
  - Реализация: [`frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`](../../frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx), [`ProfilesWidgetProfileDetailCore.tsx`](../../frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.tsx)
  - Предшественники: [`tasks/040-phase-5-widget-card-layout-modernization/TASK.md`](../040-phase-5-widget-card-layout-modernization/TASK.md), [`tasks/065-profiles-widget-split-detail-composition/TASK.md`](../065-profiles-widget-split-detail-composition/TASK.md), [`tasks/066-micro-ds-0-1-7-bump/TASK.md`](../066-micro-ds-0-1-7-bump/TASK.md) (DS с видами колонки)

## Цель

В составном виджете **`profiles-widget`** (`ProfilesWidget` → `ProfilesApiWidget` → **`ProfilesWidgetCore`**) при переключении левой колонки **`CardListColumn`** в вид **`grid`**:

1. **Список** занимает **100% ширины** области виджета (родительский flex-ряд не оставляет узкую «полоску» с `clamp(280px, 30vw, 420px)` как сейчас для режимов списка).
2. **Правая колонка** с **`ProfilesWidgetProfileDetailCore`** в этом режиме **не отображается** в master-detail строке.
3. **Деталь профиля** (тот же `ProfilesWidgetProfileDetailCore`: просмотр, версии, документ, создание через ref) показывается в **модальном окне** (оверлей поверх сетки), а не справа от списка.

При видах **`list`** и **`collapsed`** (и при любой политике для **`collapsed`**, согласованной в PR) поведение остаётся **как сейчас**: двухколоночный master–detail, текущие пропсы детали и `detailRef` для `openCreate()`.

## Контекст для агента

- Сейчас `ProfilesWidgetCore` **не** передаёт в `CardListColumn` управляемые `view` / `onViewChange`; вид переключается только внутри ДС по умолчанию. Внешняя обёртка списка задаёт **фиксированную ширину** левой колонки, из‑за чего даже при внутреннем `grid` у `CardListColumn` (`paperWidth: 100%`) список визуально остаётся узким.
- `CardListColumn` из `@april/ui` экспортирует тип вида `CardListColumnView` (`'list' | 'grid' | 'collapsed'`). Для синхронизации с layout виджета нужен **controlled** `view` + `onViewChange` (или эквивалентная подписка, если в версии DS появится иной API — зафиксировать в `REPORT.md`).
- Документация ДС: в режиме `grid` колонка уже **100% родителя**; «полноэкранный viewport» в витрине DS — отдельная обёртка (`CardListColumnSection`); в рамках **этой** задачи fullscreen viewport **не** обязателен, только **100% ширины виджета** под список.

## Входит в объём

### Поведение и layout

- Завести состояние вида колонки, например `cardListView: CardListColumnView`, с начальным значением `'list'` (или согласовать с `defaultView` ДС).
- Прокинуть в `CardListColumn`: `view={cardListView}`, `onViewChange={…}`.
- Условная вёрстка корневого `Box` (строка list + detail):
  - **`cardListView === 'grid'`:** одна колонка на всю ширину; стили обёртки списка: `width: '100%'`, `maxWidth: '100%'`, `flex: '1 1 auto'`, `minWidth: 0`; убрать/не применять `clamp(280px, 30vw, 420px)` и `maxWidth: 44%` для этой ветки.
  - **Иначе:** сохранить текущее поведение ширины левой колонки и правой `flex: 1` с деталью.
- Взаимодействие с **`listCollapsed`** (узкий rail / expand по `aria-label` на кнопках ДС): явно описать в PR и в `REPORT.md`:
  - рекомендуемый вариант: при переходе в **`grid`** сбрасывать «свёрнутость списка» в развёрнутое состояние (если применимо), чтобы не комбинировать два узких режима;
  - либо задокументировать запрет / приоритет (grid побеждает).

### Модалка с деталью

- Один экземпляр **`ProfilesWidgetProfileDetailCore`** с тем же `ref`, пропами (`entityId`, `listItem`, колбэки `onAction`, `onError`, …), что и сейчас для правой колонки, **либо** два монтирования с общим состоянием — предпочтительно **один** инстанс, чтобы не дублировать подписки и эффекты (например условный рендер «в колонке vs в модалке» с переносом DOM или портал — на усмотрение исполнителя; итог: одна логика детали).
- Условие показа модалки (зафиксировать одно и реализовать согласованно):
  - **Вариант A (рекомендуется):** `cardListView === 'grid'` и **`selectedEntityId !== null`** — модалка открыта; закрытие по крестику/Escape/клику вне — **`selectedEntityId := null`** (и при необходимости вызов существующих колбэков, не ломая `onOpenEntity`).
  - **Вариант B:** отдельный флаг `detailModalOpen` + сохранение выбора при закрытии — только если явно обосновано и покрыто тестами.
- Создание по «плюсу» в сетке: `onAddItem` → `detailRef.current?.openCreate()` должно **открывать модалку** с потоком создания (если при варианте A нет выбранной сущности — модалка открывается для create-only; уточнить совместимость с текущим API `ProfilesWidgetProfileDetailHandle` и при необходимости расширить только внутри пакета без ломания публичных типов).
- Модальное окно: **DS-first** — предпочтительно **`AprilModal`** из `@april/ui` с заголовком по выбранному профилю или нейтральным «Профиль» / «Создание»; размер (`size` / `fullScreen` / `w` / `h`) — достаточно для скролла длинной детали и JSON; действия в шапке по §11 `DESIGN_SYSTEM.md` DisignApril. Если `AprilModal` не покрывает сценарий — Mantine `Modal` + обоснование в `REPORT.md`.

### Переходы между видами

- При **`onViewChange` → `list`** (или `collapsed`): закрыть модалку (если открыта), снова показать правую колонку; **`selectedEntityId`** не обнулять без отдельного решения продукта (удобно: выбор сохраняется, деталь снова в колонке).
- При входе в **`grid`** с уже выбранной строкой: либо сразу открыть модалку (вариант A), либо показать только сетку до клика — **выбрать один вариант в PR** и отразить в доках.

### Тесты

- Обновить / дополнить [`ProfilesWidgetCore.test.tsx`](../../frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx) (и при необходимости мок `CardListColumn`): сценарий «вид grid → нет правой колонки / есть модалка», «переключение обратно в list → деталь в колонке», «openCreate в grid».
- Регрессия существующих сценариев list + detail.

### Документация

- Обновить [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md): раздел master–detail — описать режим **сетки** (полная ширина, деталь в модалке, закрытие/выбор).
- При необходимости краткая отсылка в [`profiles-widget-profile-detail.md`](../../docs/widgets/profile/profiles-widget-profile-detail.md) (что в составной сборке деталь может монтироваться в модалке — без смены публичного контракта standalone-виджета, если контракт не меняется).

## Не входит в объём

- Изменение **`CardListColumn`** в submodule **DisignApril** (кроме bump версии, если понадобится для багфикса — отдельная micro-задача).
- Полноэкранный viewport уровня `position: fixed; inset: 0` как в `CardListColumnSection` витрины ДС.
- Смена REST/OpenAPI, провайдера `ProfilesDataProvider`, семантики телеметрии (`widget` / имена событий) — только если неизбежно; по умолчанию **без** изменений.
- Обязательная страница **docs-site** `task-story-*` — по политике PM; по умолчанию достаточно `docs/widgets/` (как в **065**).

## Технические ограничения

- **DS-first**; не дублировать крупные куски UI детали — переиспользовать **`ProfilesWidgetProfileDetailCore`**.
- Не коммитить секреты; не ломать публичный API **`ProfilesWidget`** / **`ProfilesWidgetProps`** без semver и записи в `REPORT.md` (ожидается **minor** или **patch**, если только внутренняя композиция Core).

## Требования к дизайн-системе (frontend)

- [ ] Проверены паттерны: `CardListColumn` (`view` / `onViewChange`), `AprilModal` (или Mantine с обоснованием).
- [ ] Модалка доступна с клавиатуры (Escape, фокус), не ломает существующие `data-testid` детали (`profiles-widget-detail-column` и др.) — при переносе в модалку **сохранить** стабильные селекторы для тестов или обновить тесты осознанно (перечислить в `REPORT.md`).

## AGENT_MASTER_PROMPT compliance checklist

- [ ] Прочитан [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md).
- [ ] Согласованность с [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) и observability (без новых обязательных событий, если не согласовано иначе).

## Acceptance criteria

- [ ] При **`view === 'grid'`** у колонки списка: список на **100%** ширины области виджета; правая колонка детали **скрыта**.
- [ ] В этом режиме деталь доступна в **модалке** (выбор строки и/или создание — по выбранной в PR политике).
- [ ] При **`list`** / **`collapsed`**: прежний двухколоночный layout и поведение детали без регрессий по ключевым сценариям тестов.
- [ ] `npm run lint -w @april/profile-ui` и `npm run test -w @april/profile-ui -- --run` проходят.
- [ ] Обновлены **`profiles-widget.md`** (и при необходимости профиль детали).

## Проверка (команды)

```bash
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run
```

Ручная проверка: `VITE_PROFILE_DEMO_MOCK=true npm run dev` — демо поверхности **`profiles-widget`**, переключение вида колонки в сетку, выбор карточки, создание, возврат в список.

## Ожидаемый результат в REPORT

- Выбранная политика открытия/закрытия модалки (A/B), поведение `listCollapsed` в `grid`.
- Использованный компонент модалки (`AprilModal` vs Mantine).
- Список затронутых файлов и решение по semver `@april/profile-ui`.

## Человекопонятная история в docs-site

- [ ] По запросу PM; по умолчанию не требуется (достаточно `docs/widgets/profile/profiles-widget.md`).
