## 1) Итого

- Статус: выполнено
- Задача: мобильный chrome детали/create — `AprilMobileShellBar`, карусель режимов JSON, версии
- Ветка: `feature/profiles-widget-profile-detail-mobile-shell`
- Коммиты: см. `git log -1 --oneline` на ветке `feature/profiles-widget-profile-detail-mobile-shell`
- PR: не создавался (локальная реализация в репозитории)

## 2) Что сделано

- [frontend] В **`ProfilesWidgetProfileDetailCore`** на **`(max-width: 47.99em)`** добавлена нижняя **`AprilMobileShellBar`** (`position="absolute"`, `withSearch={false}`): действия детали, карусель режимов документа, create (leading cancel + center cycle + create). Прокрутка контента с **`aprilMobileShellBarContentPaddingBottom()`**. Портал в **`gridModalDetailHeaderHostEl`** для действий детали/create на узком экране **отключён**; шапка родительского **`AprilModal` / `AprilVaulBottomSheet`** остаётся с заголовком и системным close без действий в `headerActions`.
- [frontend] В **`DraftJsonEditorToolbar`** добавлены пропсы **`modeControlVariant`** (`segmented` | `cycle`) и **`cycleActionForMobileShell`** (стили кнопки под teal shell).
- [frontend] Лист версий: **`AprilVaulBottomSheet`** с **`zIndex` / `overlayZIndex`** выше **`APRIL_MOBILE_SHELL_BAR_Z_INDEX`**, чтобы лист был поверх нижней панели детали. В режиме листа **center** shell — только закрытие листа (норма «один активный контекст»).
- [docs] Обновлены **`docs/widgets/profile/profiles-widget-profile-detail.md`** и **`docs/widgets/profile/profiles-widget.md`**.
- [semver] **`@april/profile-ui`**: **0.4.1 → 0.4.2** (UX без смены публичных пропсов виджета).

## 3) Изменённые файлы

- `frontend/packages/profile-ui/package.json`
- `frontend/packages/profile-ui/src/components/EntityTypesDraftJsonEditor.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidget.test.tsx`
- `docs/widgets/profile/profiles-widget-profile-detail.md`
- `docs/widgets/profile/profiles-widget.md`
- `task_list.md`
- `tasks/073-profiles-widget-profile-detail-mobile-shell-toolbar/PLAN.md`
- `tasks/073-profiles-widget-profile-detail-mobile-shell-toolbar/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да (revert PR)

## 5) Проверка качества

- Линтер: ok (`npm run lint -w @april/profile-ui`)
- Unit tests: ok (`npm run test -w @april/profile-ui -- --run`)

Команды (фактически выполненные):

```bash
cd /home/ukituki/april-profile-1/frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run
```

## 6) Деплой

- Среда: нет
- Согласовано с: не применялось

## 7) Риски и ограничения

| Тема | Решение |
|------|---------|
| **z-index** | Лист версий: `APRIL_MOBILE_SHELL_BAR_Z_INDEX + 40` / `+39`. Панель детали: **`APRIL_MOBILE_SHELL_BAR_Z_INDEX`** (по умолчанию у `AprilMobileShellBar`). Родительский detail sheet в **`ProfilesWidgetCore`**: `APRIL_MOBILE_BOTTOM_SHEET_Z_INDEX + 10` — нижняя панель детали остаётся **внутри** контекста sheet; глобально лист версий с большим z-index перекрывает shell при открытии. |
| **Два vaul** | Вложенный лист версий поверх контента детали; smoke: нет «мёртвых» кликов по кнопке закрытия в shell в режиме версий. |
| **Standalone узкий** | Версии остаются **`Select`** под заголовком; shell — действия и карусель режимов (без дублирования Select в shell). |

## 8) Что осталось

- [ ] PR в `develop` и ручной smoke на демо **`profiles-widget`** / **`profiles-widget-profile-detail`** при сужении окна (create, деталь, версии, цикл режимов).
