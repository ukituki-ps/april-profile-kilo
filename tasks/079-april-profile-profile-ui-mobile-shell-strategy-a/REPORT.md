## 1) Итого

- Статус: ✅ выполнено (код на `develop`, lint/test/build зелёные; push submodule upstream в процессе)
- Задача: `profile-ui` + shell: стратегия A и ADR-0006 для mobile chrome
- Ветка: `develop` (код подтверждён в текущей ветке)
- Коммиты: в `develop`; submodule `design-system/DisignApril` локальные правки `hideMobileShellBar` + bump **0.1.11**
- PR: по процессу команды

## 2) Что сделано

- [frontend] **`ProfilesWidgetProfileDetailCore`:** при открытом листе версий **`AprilMobileShellBar` детали не монтируется**; padding контента без панели.
- [frontend] Тест: при открытом листе версий нет **`profile-detail-mobile-shell-bar`**. Упоминания `mobileShellBar`/`hideMobileShellBar` = **5** в ProfilesWidgetProfileDetailCore.tsx.
- [frontend] DS-потребление: после завершения **076** — GPR aliases `^0.1.10` (0.1.11 publish ожидает).
- [docs] ADR-0006 согласован; карточки виджетов обновлены.

## 3) Качество

- Линтер: ok (`npm run lint`)
- Сборка: ok (`npm run build`)
- Unit tests: ok (`npm run test`)

## 4) Что осталось

- [ ] `git push` submodule DisignApril в `origin/main` + публикация **april-ui 0.1.11** в GPR → bump GPR-aliases в `^0.1.11`.
