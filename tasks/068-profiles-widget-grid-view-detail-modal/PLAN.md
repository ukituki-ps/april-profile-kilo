# План: `068-profiles-widget-grid-view-detail-modal`

## Шаги

1. **`ProfilesWidgetCore`**
   - Состояние `cardListView: CardListColumnView` + `view` / `onViewChange` у `CardListColumn`.
   - При `view === 'grid'`: `setListCollapsed(false)`; левая колонка на всю ширину (`width/maxWidth 100%`, без `clamp`); корневой ряд без правой колонки.
   - Условный рендер детали: в колонке (`list`, включая узкий rail через `listCollapsed`) vs в **`AprilModal`** (`grid`), `opened = grid && (selectedEntityId || gridCreateSession)`.
   - Закрытие модалки: `closeCreate`, сброс `gridCreateSession`, `selectedEntityId = null`.
   - Add в сетке: `gridCreateSession = true` + `pendingOpenCreate` → `requestAnimationFrame` → `openCreate()`.
2. **Тесты** — расширить мок `CardListColumn`; сценарии grid/modal/list.
3. **Доки** — `docs/widgets/profile/profiles-widget.md`.
4. **`REPORT.md`** — политика, semver, команды.

## Риски

- Смена вида list ↔ grid перемонтирует `ProfilesWidgetProfileDetailCore` (потеря несохранённого при переключении вида).
