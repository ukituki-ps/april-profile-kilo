## 1) Итого

- Статус: ⚠️ частично (код и доки в репозитории готовы; **`npm ci` в этой среде без `NODE_AUTH_TOKEN` для GPR не выполнялся** — см. §5)
- Задача: `profile-ui` + shell: стратегия A и ADR-0006 для mobile chrome
- Ветка: `feature/079-profile-ui-mobile-shell-strategy-a`
- Коммиты: см. `git log -1` на ветке (после squash один коммит с сообщением про task **079**)
- PR: *(создать в GitHub после push)*

## 2) Что сделано

- [frontend] **`ProfilesWidgetProfileDetailCore`:** при открытом вложенном **`AprilVaulBottomSheet`** со списком версий **`AprilMobileShellBar` детали не монтируется**; убрана параллельная капсула «только закрыть лист» под листом. Отступ снизу контента (`aprilMobileShellBarContentPaddingBottom`) не применяется, пока открыт лист версий (нет нижней панели).
- [frontend] Зафиксировано в тесте: при открытом листе версий **`profile-detail-mobile-shell-bar`** отсутствует в DOM.
- [frontend] Зависимости shell: **`@ukituki-ps/april-tokens` / `@ukituki-ps/april-ui` ^0.1.10** в `frontend/package.json` и lockfile (релиз по **078** / DS-015); devDependency **`@april/profile-ui`** — тот же диапазон для `npm:@ukituki-ps/april-ui`.
- [docs] **`WIDGET_CONTRACTS.md`** §8.6, **`WIDGET_INTEGRATION_CHECKLIST.md`**, карточки **`profiles-widget.md`**, **`profiles-widget-profile-detail.md`** — вложенный лист версий и стек панелей; зеркала в **`docs-site/docs/`** (`widget-contracts`, `widget-integration-checklist`, **`task-story-074`**).
- [задача] **`PLAN.md`** — уточнение базы **078** и выполненных шагов.

## 3) Изменённые файлы

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/packages/profile-ui/package.json`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.test.tsx`
- `docs/WIDGET_CONTRACTS.md`
- `docs/WIDGET_INTEGRATION_CHECKLIST.md`
- `docs/widgets/profile/profiles-widget.md`
- `docs/widgets/profile/profiles-widget-profile-detail.md`
- `docs-site/docs/widget-contracts.md`
- `docs-site/docs/widget-integration-checklist.md`
- `docs-site/docs/task-story-074-phase-8-ds-gpr-mobile-shell-unification.md`
- `tasks/079-april-profile-profile-ui-mobile-shell-strategy-a/PLAN.md`
- `tasks/079-april-profile-profile-ui-mobile-shell-strategy-a/TASK.md`
- `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет

## 5) Проверка качества

- Линтер: не запускался (нет `node_modules` после `npm ci`)
- Сборка: не запускалась
- Unit tests: не запускались

Команды (ожидаются у разработчика с **`NODE_AUTH_TOKEN`** для GitHub Packages):

```bash
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## 6) Деплой

- Среда: нет (не требовалось задачей)

## 7) Риски и ограничения

- **Lockfile** обновлён на **0.1.10** без фактической загрузки пакетов в этой среде: после `npm ci` npm пересчитает метаданные при необходимости; при расхождении с опубликованным **0.1.10** выполните `npm install` и закоммитьте lock.
- Проп **`leading`** у `AprilMobileShellBar` в DS (закрытие верхнего слоя) в этом PR **не** добавлялся: для листа версий достаточно шапки **`AprilVaulBottomSheet`**; сценарий «Назад» до intent host по-прежнему через закрытие внешнего sheet/modal в **`ProfilesWidgetCore`**.
- **`onRequestCloseMobileOverlay`** в текущем публичном API **`AprilVaulBottomSheet`** в DisignApril (main) **не** найден; уточнение контракта — только после появления в DS.

## 8) Что осталось

- [ ] Прогон **`npm ci` + lint + test + build** с GPR-токеном и зелёный CI.
- [ ] PR в `develop` с test plan: узкий viewport → деталь → Versions → убедиться, что одна нижняя зона контроля (только лист); закрыть лист → снова видна **`AprilMobileShellBar`** детали; список профилей по-прежнему с **`hideMobileShellBar`** при открытой детали в Vaul (**072**).
