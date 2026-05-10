## 1) Итого

- Статус: ✅ выполнено (локально: **`npm ci`**, **`lint`**, **`test`**, **`build`** без GPR за счёт `file:` на submodule + правки DS)
- Задача: `profile-ui` + shell: стратегия A и ADR-0006 для mobile chrome
- Ветка: `feature/079-profile-ui-mobile-shell-strategy-a`
- Коммиты: см. `git log` в **april-profile** и в submodule **`design-system/DisignApril`** (два коммита: `hideMobileShellBar`, bump **0.1.11**)
- PR: *(april-profile + push submodule DisignApril в `origin` до обновления указателя в superproject)*

## 2) Что сделано

- [frontend] **`ProfilesWidgetProfileDetailCore`:** при открытом листе версий **`AprilMobileShellBar` детали не монтируется**; padding контента без панели.
- [frontend] Тест: при открытом листе версий нет **`profile-detail-mobile-shell-bar`**.
- [DisignApril / submodule] **`CardListColumn`:** восстановлен проп **`hideMobileShellBar`** (типы и runtime; padding списка согласован). Версия пакета UI в submodule: **0.1.11** (после публикации в GPR — основной поток для **076**).
- [frontend] Потребление DS через **`file:../design-system/DisignApril/packages/{tokens,ui}`**; зависимость **`mantine-vaul`** в shell; **`vite.config.ts`** и **`packages/profile-ui/vitest.config.ts`** — единый React и разрешение `mantine-vaul`/`style.css` без дубликата из pnpm submodule.
- [docs] **`frontend/README.md`** — GPR vs `file:`; **`WIDGET_*`**, карточки виджетов, зеркала **docs-site** (как в предыдущем коммите задачи).

## 3) Изменённые файлы (ключевые)

- `design-system/DisignApril` (submodule): `packages/ui/src/components/CardListColumn.tsx`, `packages/ui/package.json`
- `frontend/package.json`, `frontend/package-lock.json`, `frontend/vite.config.ts`, `frontend/README.md`
- `frontend/packages/profile-ui/package.json`, `frontend/packages/profile-ui/vitest.config.ts`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.tsx` (+ test)
- Доки задачи и контракты (см. предыдущие шаги **079**): `docs/WIDGET_CONTRACTS.md`, чеклист, `docs/widgets/profile/*.md`, `docs-site/...`, `tasks/079-*/{PLAN,TASK}.md`, `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет

## 5) Проверка качества

- Линтер: ok (`npm run lint`)
- Сборка: ok (`npm run build`)
- Unit tests: ok (`npm run test`)

Команды (фактически):

```bash
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## 6) Деплой

- Среда: нет

## 7) Риски и ограничения

- Коммиты в **`design-system/DisignApril`** сделаны **локально**; их нужно **`git push`** в [DisignApril](https://github.com/ukituki-ps/DisignApril) и опубликовать **`@ukituki-ps/april-ui@0.1.11`**, затем вернуть в april-profile aliases **`npm:@ukituki-ps/...`** (задача **076**) и обновить lock под GPR.
- Пока в **april-profile** зафиксирован поток **`file:`** для воспроизводимого **`npm ci`** без токена.

## 8) Что осталось

- [ ] `git push` submodule + публикация **april-ui 0.1.11** в GPR; merge **076** с возвратом GPR-aliases в `frontend/package.json`.
- [ ] PR **april-profile** в `develop`.
