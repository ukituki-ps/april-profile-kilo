# REPORT: 070-micro-profiles-grid-modal-detail-header-ds

## Что изменено

- **`frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`**
  - Для grid-модалки в `AprilModal` добавлены `headerActions`: пустой `span` с ref-хостом для портала тулбара детальной карточки **или** кнопок **Create profile** (как слот под DS-паттерн `headerActions` рядом с close). Слот монтируется при любом `gridProfileModalOpened` (профиль или создать).
  - Заголовок модалки: приоритет строки из детальной карточки (`displayName` из документа / списка), иначе `listPrimaryLabel` по строке списка; при смене режима/сбросе выбора оверрайд сбрасывается.
  - В `ProfilesWidgetProfileDetailCore` передаются `hostGridProfileModalChrome`, `gridModalDetailHeaderHostEl`, `onHostGridModalDetailTitleChange`.

- **`frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.tsx`**
  - Тулбар детальной карточки (версия, режимы JSON, edit/save/delete) вынесен в `profileDetailToolbar` (`useMemo`).
  - При `hostGridProfileModalChrome` тулбар ренерится через **`createPortal`** в узел из `headerActions` родителя — визуально одна линия с кнопкой закрытия, как у **Create profile** с `headerActions`.
  - В этом режиме блок с **`Title` (имя профиля) в теле** не показывается; имя остаётся в заголовке модалки. В list (не модалка) прежний блок с `Title` + тулбар без изменений.
  - Поток **Create profile** в grid (`embedCreateFlowInline`): Cancel / Create убраны из тела карточки, монтируются через `createPortal` в тот же `headerActions`-хост родительской модалки.
  - `onSelectVersion` обёрнут в `useCallback` для предсказуемых зависимостей мемоизации тулбара.

## Проверки

| Команда | Результат |
|---------|-----------|
| `cd frontend/packages/profile-ui && npm test -- --run ProfilesWidgetCore.test.tsx ProfilesWidgetProfileDetailCore.test.tsx` | OK (14 tests) |
| `cd frontend/packages/profile-ui && npm run lint` (`tsc --noEmit`) | OK |

## Риски / ограничения

- Портал в DOM-узел заголовка модалки зависит от порядка монтирования Mantine `Modal`: при первом открытии возможен кадр без тулбара, пока не сработает ref на `span` (обычно один layout-проход).
- При очень узком окне тулбар в `headerActions` с `flexWrap: "wrap"` может переноситься на вторую строку внутри полосы заголовка; close остаётся в одной строке с первой линией блока заголовка Mantine (ограничение разметки модалки).

## Follow-up

- При желании полностью запретить перенос тулбара в шапке — сузить контролы (`compact` для toolbars) или вынести часть в overflow-меню (отдельная задача).
