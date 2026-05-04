## 1) Итого

- Статус: выполнено
- Задача: мобильный `profiles-widget` — `AprilMobileShellBar`, `AprilVaulBottomSheet`, компактный тулбар детали (версии)
- Ветка: `feature/profiles-widget-mobile-shell-bottom-sheet` (рекомендация из `TASK.md`; merge через PR)
- Коммиты: последний на ветке `feature/profiles-widget-mobile-shell-bottom-sheet` (`git log -1`); submodule **DisignApril**: `400f61a` (ветка `wip/072-card-list-column-mobile-view-cycle`)
- PR: не создавался из среды агента

## 2) Что сделано

- **[design-system / DisignApril]** В `CardListColumn`: проп **`withMobileViewCycle`** (по умолчанию `true`); на мобильном layout в **`AprilMobileShellBar`** добавлена кнопка цикла **list ↔ grid** с теми же `aria-label`, что и на десктопе; иконки цикла поддерживают размер `size` для shell.
- **[frontend / `@april/profile-ui`]** `ProfilesWidgetCore`: порог узкого экрана **`(max-width: 47.99em)`** через **`useMediaQuery`**; **`mobileLayout="auto"`** на `CardListColumn` и опциональный проп **`cardListColumnMobileLayout`**; на узком экране — одноколоночный список, деталь в **`AprilVaulBottomSheet`** вместо **`AprilModal`** для сценария grid и для **list + выбор**; скрытый mount детали для **`openCreate()`** в list без выбора; z-index sheet выше дефолтного листа фильтра.
- **`ProfilesWidgetProfileDetailCore`**: при **`hostGridProfileModalChrome`** и узком viewport — выбор версии через иконку и **`AprilVaulBottomSheet`** со списком; при открытом листе версий портал тулбара в шапку пустой (остальные кнопки скрыты).
- **Тесты:** обновлены моки `@april/ui` / `@mantine/hooks` в **`ProfilesWidgetCore`**, **`ProfilesWidgetProfileDetailCore`**, **`ProfilesWidget`**; добавлены сценарии narrow + sheet и версии.
- **Документация:** `docs/widgets/profile/profiles-widget.md`, `profiles-widget-profile-detail.md`.
- **Vendored DS:** пересобраны **`frontend/vendor/ds-packs/april-ui-0.1.9.tgz`** (и tokens) скриптом **`frontend/scripts/repack-ds-vendor.sh`** после правок submodule.

## 3) Изменённые файлы

- `design-system/DisignApril/packages/ui/src/components/CardListColumn.tsx`
- `frontend/vendor/ds-packs/april-ui-0.1.9.tgz`, `april-tokens-0.1.9.tgz` (пересборка)
- `frontend/packages/profile-ui/package.json` (версия **0.4.1**)
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidget.test.tsx`
- `docs/widgets/profile/profiles-widget.md`
- `docs/widgets/profile/profiles-widget-profile-detail.md`
- `tasks/072-profiles-widget-mobile-shell-bottom-sheet/PLAN.md` (статус плана)
- `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да (revert PR / прежний tarball при необходимости)

## 5) Проверка качества

- Линтер `profile-ui`: ok (`tsc --noEmit`)
- Unit tests `profile-ui`: ok (`vitest run --run`)

Команды:

```bash
cd /home/ukituki/april-profile-1/frontend && bash scripts/repack-ds-vendor.sh
cd /home/ukituki/april-profile-1/frontend && npm install
cd /home/ukituki/april-profile-1/frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run
```

## 6) Деплой

- Не выполнялся (задача frontend-only).

## 7) Риски и ограничения

- Два **bottom sheet** (фильтр списка + деталь профиля + лист версий): z-index детали и версий поднят относительно дефолта; одновременное открытие двух продуктовых sheet по-прежнему возможно — при необходимости ввести единый стек на стороне хоста.
- **`withMobileViewCycle`** по умолчанию `true`: потребители `CardListColumn` с `mobileLayout !== 'off'` получают новую кнопку в shell; отключение — **`withMobileViewCycle={false}`**.
- Полная мобильная компоновка **`DraftJsonEditorToolbar`** (отдельные листы для режимов документа) не делалась — follow-up.

## 8) Что осталось

- [ ] Ручной смок в браузере: сужение окна, grid/list, фильтр, деталь, версии, create.
- [ ] PR и merge по политике репозитория.

## 9) Дополнение (после первого merge / по отзыву)

- **Create на узком экране:** ранее при `list`+narrow кнопка «Добавить» вызывала `openCreate()` без открытия profile sheet → **`AprilModal`**. Исправление: `e40ca2e` — сессия `gridCreateSession`+`pendingGridOpenCreate` и на narrow в list, `embedCreateFlowInline={gridCreateSession && !selectedEntityId}`, overlay `narrowListCreateOverlay`, `hostGridProfileModalChrome` при create-only в sheet.
