# `@april/profile-ui`: мобильный chrome детали и create — `AprilMobileShellBar`, карусель режимов JSON, версии как в ДС

## Мета

| Поле | Значение |
|------|----------|
| **id** | `073-profiles-widget-profile-detail-mobile-shell-toolbar` |
| **ветка (рекомендация)** | `feature/profiles-widget-profile-detail-mobile-shell` |
| **приоритет** | обычный (UX-слой; без смены REST/OpenAPI) |
| **пакет** | `@april/profile-ui`; при необходимости **`@april/ui`** / **DisignApril** (расширение примитивов или документации) |
| **ключевые файлы (ориентир)** | `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.tsx`, при необходимости `EntityTypesDraftJsonEditor.tsx` (или общий тулбар режимов); `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx` (слоты шапки parent sheet/modal); `design-system/DisignApril/packages/ui/src/components/AprilMobileShellBar.tsx`, `aprilMobileShellBarLayout.ts` |
| **нормативные документы** | [`docs/widgets/profile/profiles-widget-profile-detail.md`](../../docs/widgets/profile/profiles-widget-profile-detail.md), [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md), [`design-system/DisignApril/DESIGN_SYSTEM.md`](../../design-system/DisignApril/DESIGN_SYSTEM.md) §8 (mobile, single active context), эталон [`design-system/DisignApril/packages/ui/src/components/CardListColumn.tsx`](../../design-system/DisignApril/packages/ui/src/components/CardListColumn.tsx) (`shellCenterIdle` / листы) |
| **предшественники** | [`tasks/072-profiles-widget-mobile-shell-bottom-sheet/TASK.md`](../072-profiles-widget-mobile-shell-bottom-sheet/TASK.md) (list `mobileLayout`, detail/create в `AprilVaulBottomSheet`, черновик версий в подлисте), [`tasks/070-micro-profiles-grid-modal-detail-header-ds/TASK.md`](../070-micro-profiles-grid-modal-detail-header-ds/TASK.md) (chrome в шапке модалки), [`tasks/058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md`](../058-phase-7-profile-ui-ds-json-profiles-widget-integration/TASK.md) |
| **детальный план** | [`PLAN.md`](./PLAN.md) |

## Цель

На **узком viewport** (`(max-width: 47.99em)`, тот же порог, что в **072**) привести **деталь профиля** и **поток Create profile** в **`ProfilesWidgetProfileDetailCore`** к **тому же UX-языку**, что у списка в **`CardListColumn`** на мобилке:

1. **Основные действия** (отмена/сохранение create, save/edit/delete детали, переключение режимов документа и т.д.) — в **`AprilMobileShellBar`** (нижняя «капсула»: `leading` | `center` | при необходимости поиск отключён **`withSearch={false}`**), а не размазанные по **`AprilModal.headerActions`** / порталу в шапку родительского sheet **как сейчас на мобилке** после 070/072.
2. **Режимы JSON-документа** (Form / Tree / Source / Schema — что реально включено у экземпляра **`DraftJsonEditorToolbar`**) на мобилке — **одна кнопка-карусель** (следующий режим по кругу), с **`aria-label` / tooltip** по аналогии с циклом **`list`/`grid`** в `CardListColumn` (`getNextCardListColumnView`, `cardListColumnViewLabelRu` — можно вынести общий хелпер в пакете или локально, без дублирования длинной логики).
3. **Версии:** по тапу на **иконку версии** открывается **список версий** (предпочтительно **`AprilVaulBottomSheet`**, как сейчас для части сценариев); **в этом режиме в `AprilMobileShellBar` не остаётся** кнопок «другого слоя» — только действия слоя «выбор версии» (например «Назад» / закрыть лист) по норме **«один активный контекст»** из комментария к **`AprilMobileShellBar`**.
4. **Десктоп / широкий viewport:** сохранить текущее поведение (**070**: шапка `AprilModal`, `Select` версий, полный **`DraftJsonEditorToolbar`**) без регрессий.

Публичный API **`ProfilesWidgetProfileDetail`** / типы по возможности **не ломать**; новые пропсы только при необходимости (например форсировать mobile chrome для витрины) — semver и **`REPORT.md`**.

## Контекст для агента

- После **072** на мобилке деталь/create живут в **`AprilVaulBottomSheet`** родителя (**`ProfilesWidgetCore`**), а действия create/режимы документа по-прежнему порталятся в **`gridModalDetailHeaderHostEl`** — это **верхняя** зона, а не нижний **`AprilMobileShellBar`** как у **`CardListColumn`**.
- **`AprilMobileShellBar`** использует **`position: fixed` | `absolute`** и **`APRIL_MOBILE_SHELL_BAR_Z_INDEX`**; контент выше должен иметь **`aprilMobileShellBarContentPaddingBottom()`** — иначе перекрытие. Внутри **vaul**-sheet возможны конфликты z-index с **вложенным** bottom sheet версий — нужна явная матрица в **`PLAN.md`**.
- **`DraftJsonEditorToolbar`** сегодня рендерит несколько сегментов; для карусели потребуется **ветка UI** при `matchesNarrowViewport` (или проп `compactModeCycle` на тулбаре), не ломая wide.

## Входит в объём

### Интеграция `AprilMobileShellBar` в деталь + create (узкий экран)

- Определить **единый контейнер** для тела детали/create с `position: 'relative'` и высотой `fill`, внутри которого:
  - прокручиваемый контент (карточка, форма create, редактор);
  - **`AprilMobileShellBar`** с `position="absolute"` (или согласованно с ДС), `withSearch={false}` если поиск не нужен;
  - корректный **`padding-bottom`** у scroll-area по **`aprilMobileShellBarContentPaddingBottom()`**.
- **Create (embed + narrow):** перенести **`createProfileHeaderIconButtons`**, цикл режимов create и связанные действия из портала шапки в **`center` / `leading`** shell; шапку родительского **`AprilVaulBottomSheet`** при mobile-create по продуктовому решению **упростить** (только заголовок + системный close) или оставить минимальный дубль — зафиксировать в **`PLAN.md`** и в **`profiles-widget-profile-detail.md`**.
- **Деталь (narrow + `hostGridProfileModalChrome`):** то же для **`profileDetailToolbar`**: основные действия в shell; согласовать с уже сделанным листом **версий** (не два независимых «центра» конфликтующих по UX).

### Карусель режимов JSON (`DraftJsonEditorToolbar` / обёртка)

- На узком экране заменить **группу сегментов** на **одну `ActionIcon`** (или кнопку в стиле ghost shell), цикл по разрешённым режимам в порядке, согласованном с продуктом (например Form → Tree → Source → Schema → Form).
- Сохранить **`hideModeToolbar`** для встраивания в шапку там, где широкий chrome ещё использует полный тулбар.
- **a11y:** осмысленный **`aria-label`**, при необходимости **`Tooltip`**.

### Версии (узкий экран)

- Унифицировать поведение с **паттерном `CardListColumn`**: при открытом листе версий **`center`** shell содержит **только** действия этого слоя (закрыть / назад); остальные слоты пустые или скрыты.
- Убедиться, что **z-index** листа версий **выше** shell детали, но **ниже** или согласован с системными слоями vaul (без «мёртвых» кликов).

### Тесты

- Расширить **`ProfilesWidgetProfileDetailCore.test.tsx`**: мок **`AprilMobileShellBar`** при необходимости; сценарии narrow — create shell, цикл режима (если вынесено в test id), версии + пустой center при открытом листе.
- Регрессия **`ProfilesWidgetCore.test.tsx`** / **`ProfilesWidget.test.tsx`** на wide.

### Документация

- Обновить **`docs/widgets/profile/profiles-widget-profile-detail.md`**: раздел mobile — shell bar, карусель, версии; граница standalone vs встроенная сборка.
- Краткая отсылка в **`profiles-widget.md`** при изменении контракта шапки parent sheet.

## Не входит в объём

- Рефакторинг **`CardListColumn`** (кроме переиспользования API/констант без ломки).
- Смена **`ProfilesDataProvider`**, OpenAPI, телеметрии.
- Полная переработка **`EntityTypesDraftJsonEditor`** вне тулбара режимов (достаточно тулбара + отступов).

## Технические ограничения

- **DS-first:** `AprilMobileShellBar`, `AprilVaulBottomSheet`, константы из `aprilMobileShellBarLayout`.
- Не дублировать второй экземпляр **`ProfilesWidgetProfileDetailCore`**; менять композицию и пропсы.

## Требования к дизайн-системе (frontend)

- [ ] Сверка с **`AprilMobileShellBar`** (слоты, z-index, `withSearch`).
- [ ] При нехватке API — зафиксировать в **`REPORT.md`** и минимальное расширение ДС при согласовании.

## AGENT_MASTER_PROMPT compliance

- [ ] [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md)
- [ ] [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) при затрагивании колбэков

## Acceptance criteria

- [ ] На **узком** экране в демо **profiles-widget** / **profiles-widget-profile-detail**: основные действия детали и **create** доступны через **`AprilMobileShellBar`**, а не только через шапку модалки/sheet.
- [ ] Режимы документа на узком экране переключаются **одной кнопкой-каруселью** с доступным именем.
- [ ] Версии: тап по иконке → лист; в режиме листа **в shell нет** посторонних кнопок слоя детали; после выбора — возврат к полному набору shell.
- [ ] На **широком** экране поведение **070** / текущей детали **без регрессий** по тестам.
- [ ] `cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run` — зелёные.
- [ ] Обновлены доки виджета; заполнен **`REPORT.md`**.

## Проверка (команды)

```bash
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run
```

Ручная проверка: `VITE_PROFILE_DEMO_MOCK=true npm run dev` — поверхности **`profiles-widget`**, **`profiles-widget-profile-detail`**, сужение окна: create, деталь, версии, режимы документа.

## Ожидаемый результат в `REPORT.md`

- Скриншоты опционально; обязательно: матрица z-index, решение по шапке parent sheet, список файлов, semver **`@april/profile-ui`**, риски (два vaul + shell).

## Человекопонятная история в docs-site

- [ ] По запросу PM; по умолчанию достаточно `docs/widgets/profile/`.
