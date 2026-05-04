# План: мобильный `profiles-widget` — shell, bottom sheet, компактный тулбар детали

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-05-03
- **Статус плана:** согласован / выполнен (см. `REPORT.md`)

## Исходные допущения

- Порог «мобилки» для ДС и для ветвления **`AprilModal` vs `AprilVaulBottomSheet`** в **`ProfilesWidgetCore`** согласовать с **`CardListColumn`**: по умолчанию **`(max-width: 47.99em)`** (`useMediaQuery` в ДС) — один источник истины, без расхождения на ±1px между колонкой и Core.
- Для встраивания в узкий iframe витрины допускается проп **`ProfilesWidget`** вида `cardListColumnMobileLayout?: 'off' | 'auto' | 'on'` с дефолтом **`auto`**, чтобы сохранить прежнее поведение там, где нужен «десктопный» вид (если продукт подтвердит — иначе дефолт только `auto` и регрессии проверить по демо).
- **`AprilVaulBottomSheet`** в vendored **`@april/ui`** уже доступен (как в `CardListColumn`); при отсутствии нужного API (например `headerActions`) — зафиксировать обход в `REPORT.md` или вынести micro-задачу на ДС.

## Порядок работ (шаги)

1. **Инвентаризация и контракт поведения**
   - Зафиксировать матрицу: viewport × `cardListView` × `selectedEntityId` × `gridCreateSession`.
   - Решить: на narrow при `cardListView === 'list'` форсировать переход в полноширинный поток (**рекомендуется**: не оставлять двухколоночный master–detail с «мобильной» колонкой, которая визуально grid-only).

2. **DisignApril `CardListColumn` (опционально, предпочтительно)**
   - Добавить отображение **цикла вида** (`list`/`grid`) в **`AprilMobileShellBar`** (например в **`shellCenterIdle`** рядом с filter/sort/add), управляемое пропом вроде **`withMobileViewCycle?: boolean`** (дефолт `true` при `mobileLayout !== 'off'` **или** всегда `true` на mobile — обсудить обратную совместимость).
   - Прогнать витрину/сторибук ДС при наличии; линт пакета `ui` в submodule.

3. **`ProfilesWidgetCore`**
   - Прокинуть **`mobileLayout="auto"`** (или из нового пропа виджета).
   - Ввести **`useMediaQuery`** (или общий хук) для ветки **modal vs sheet** при `gridProfileModalOpened`.
   - Заменить **`AprilModal`** на **`AprilVaulBottomSheet`** на narrow с теми же детьми **`renderProfileDetail()`**, сохранив один инстанс логики / `ref` где возможно.
   - Синхронизировать **`handleGridProfileModalClose`** с жестом закрытия sheet (vaul `onOpenChange` / `onClose` — по API компонента).
   - Обновить привязку **`gridModalDetailHeaderHostEl`**: для sheet — слот шапки или отдельный `Box` «под шапкой», не ломая **070** на wide.

4. **`ProfilesWidgetProfileDetailCore`**
   - Ввести флаг контекста **`mobileDetailChrome`** (или переиспользовать/расширить **`hostGridProfileModalChrome`**) для ветвления: компактная панель, **иконка версии**, открытие **`AprilVaulBottomSheet`** со списком версий (`ScrollArea` + кнопки/строки), **скрытие** остального тулбара в режиме выбора версии.
   - Убедиться, что **`onSelectVersion`** и загрузка снапшотов не дублируют запросы при быстром открытии/закрытии.

5. **Тесты**
   - Мок **`@mantine/hooks` `useMediaQuery`** в **`ProfilesWidgetCore.test.tsx`** для стабильного narrow/wide.
   - Сценарии: wide → modal; narrow → sheet; закрытие сбрасывает выбор; filter sheet колонки не конфликтует с detail sheet (минимум: порядок z-index / оба не открыты одновременно по UX-правилу).

6. **Документация и отчёт**
   - Правки в **`profiles-widget.md`**, **`profiles-widget-profile-detail.md`**.
   - **`REPORT.md`**: решения, semver, follow-up (например полная мобильная адаптация **`DraftJsonEditorToolbar`**).

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Submodule **DisignApril** (`@april/ui`) | Опционально: `CardListColumn` — цикл вида в mobile shell |
| **`@april/profile-ui`** | `ProfilesWidgetCore`, `ProfilesWidgetProfileDetailCore`, тесты |
| **Документация** | `docs/widgets/profile/*.md` |
| Backend / OpenAPI | не затрагивается |

## Риски и откат

| Риск | Митигация |
|------|-----------|
| Два **vaul**-оверлея одновременно (фильтр + деталь) | Не открывать второй без закрытия первого; документировать; при необходимости общий «sheet stack» в Core |
| Расхождение breakpoint между Core и `CardListColumn` | Один хук/константа порога; вынести в `@april/ui` позже |
| Регресс **070** (header actions) | Отдельные ветки wide/narrow; снимок тестов modal header |
| Рост сложности `ProfilesWidgetProfileDetailCore` | Вынести мобильный тулбар в дочерний компонент в том же пакете |

**Откат:** revert PR; при bump ДС — откат submodule + lock.

## Проверка после выполнения

- Команды из **`TASK.md`**.
- Ручной смок: демо `profiles-widget`, narrow, grid, list, фильтр, деталь, версии, create.

## Примечания

- Связь с **071** (entity-types master–detail): общий UX-паттерн, но код не обязан объединяться в одной задаче.
- Обновления плана: дата — кратко что изменилось в scope.
