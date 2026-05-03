## 1) Итого

- Статус: ✅ выполнено
- Задача: режим сетки `CardListColumn` в `profiles-widget` — полная ширина списка, детальная карточка в `AprilModal`
- Ветка: `feature/068-profiles-widget-grid-view-detail-modal` (локально; push/PR — по процессу репозитория)
- Коммиты: см. ветку `feature/068-profiles-widget-grid-view-detail-modal` (один коммит с сообщением задачи)
- PR: _(создать вручную)_

## 2) Что сделано

- **[frontend]** В `ProfilesWidgetCore`: управляемый вид `CardListColumn` (`view` / `onViewChange`); синхронизация выбора через `selectedItemId` / `onSelectItem`; при `grid` — колонка списка на всю ширину, правая колонка скрыта, детальная карточка в **`AprilModal`**; открытие модалки при выборе строки или при «Добавить» в сетке (`gridCreateSession` + `requestAnimationFrame` → `openCreate()`); закрытие модалки сбрасывает выбор и вызывает `closeCreate()`; **при входе в `grid`** сбрасываются выделение, сессия создания и `closeCreate()`, плюс «свёрнутость» списка — модалка не открывается сразу после переключения вида; при `created` сбрасывается сессия создания в сетке; клик по карточке: `stopPropagation` + игнор `null` в `onSelectItem` (toggle ДС vs `autoSelectFirst`).
- **[docs]** Обновлены `docs/widgets/profile/profiles-widget.md`, `profiles-widget-profile-detail.md`.
- **[tests]** Расширен мок `CardListColumn`; добавлены сценарии grid/modal/list и Add в сетке.

## 3) Изменённые файлы

- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `docs/widgets/profile/profiles-widget.md`
- `docs/widgets/profile/profiles-widget-profile-detail.md`
- `tasks/068-profiles-widget-grid-view-detail-modal/PLAN.md`
- `tasks/068-profiles-widget-grid-view-detail-modal/REPORT.md`
- `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет

## 5) Проверка качества

- Линтер: ok (`npm run lint -w @april/profile-ui`)
- Unit tests: ok (`npm run test -w @april/profile-ui -- --run`)

Команды (фактически выполненные):

```bash
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run
```

## 6) Деплой

- Не применялся (только frontend/docs в репозитории).

## 7) Риски и ограничения

- При переключении `list` ↔ `grid` монтируется **разный** слот для `ProfilesWidgetProfileDetailCore` (колонка vs модалка) — возможен сброс локального состояния детальной карточки при смене вида.
- Вложенные модалки: внешняя `AprilModal` (детальная карточка) + внутренняя модалка создания в Core — допустимо по текущему UX продукта; при отзывах можно унифицировать.

## 8) Политика (зафиксировано в задаче)

- Модалка детальной карточки: **вариант A** — открыта при `grid` и (`selectedEntityId` **или** сессия «создать из сетки»); закрытие снимает выбор.
- **Semver `@april/profile-ui`**: patch/minor — только поведение сборки, публичные пропсы фасада `ProfilesWidget` не менялись.

## 9) Что осталось

- [ ] PR + merge по политике веток репозитория.
