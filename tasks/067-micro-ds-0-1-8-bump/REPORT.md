# REPORT — 067 micro: DS 0.1.8

## 1) Итого
- Статус: ✅ выполнено
- Задача: обновить vendored **`@april/ui` / `@april/tokens`** с **0.1.5** до **0.1.8**, submodule **DisignApril** на merge релиза **0.1.8**, синхронизировать peer и оперативные доки; починить Vitest после появления **`mantine-vaul`** с side-effect CSS в цепочке `@april/ui`.
- Ветка: `feature/micro-ds-0-1-8-bump`
- Коммиты: один коммит на ветке (сообщение `chore(frontend): bump DisignApril DS to @april/ui 0.1.8`); актуальный hash — `git log -1 --oneline` на `feature/micro-ds-0-1-8-bump`.
- PR: не создавался (создать в `develop` по политике репо).

## 2) Что сделано
- [frontend] Submodule **`design-system/DisignApril`** переведён на **`ec4ab0e`** (merge PR release **0.1.8**).
- [frontend] **`frontend/scripts/repack-ds-vendor.sh`**: собраны **`april-tokens-0.1.8.tgz`** и **`april-ui-0.1.8.tgz`**; удалены архивы **0.1.5** из `vendor/ds-packs/`.
- [frontend] **`frontend/package.json`**, **`package-lock.json`**, **`packages/profile-ui/package.json`**: зависимости на **`file:…0.1.8.tgz`**, **`peerDependencies` `@april/ui` ≥ 0.1.8**.
- [frontend] Vitest: в **`packages/profile-ui/vitest.config.ts`** и **`vite.config.ts`** добавлен **`test.server.deps.inline`** для **`@april/ui`** и **`mantine-vaul`**, чтобы импорт **`mantine-vaul/dist/style.css`** обрабатывался Vite, а не падал в Node с `ERR_UNKNOWN_FILE_EXTENSION`.
- [docs] Baseline **`@april/ui`** в README пакета, шаблоне changelog и виджет-доках (`entity-types-widget`, `profiles-widget`) поднят до **≥ 0.1.8** / **0.1.8+** там, где описан текущий shell; **`task_list.md`** — строка задачи **067**.
- [tasks] Постановка и отчёт в **`tasks/067-micro-ds-0-1-8-bump/`**.

## 3) Изменённые файлы
- `design-system/DisignApril` (gitlink на `ec4ab0e`)
- `frontend/package.json`, `frontend/package-lock.json`
- `frontend/vite.config.ts`
- `frontend/packages/profile-ui/package.json`, `frontend/packages/profile-ui/README.md`, `frontend/packages/profile-ui/vitest.config.ts`
- `frontend/vendor/ds-packs/april-tokens-0.1.8.tgz`, `april-ui-0.1.8.tgz` (+ удалены `*-0.1.5.tgz`)
- `frontend/vendor/ds-packs/README.md`
- `docs/widgets/profile/entity-types-widget.md`, `profiles-widget.md`
- `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`
- `task_list.md`
- `tasks/067-micro-ds-0-1-8-bump/TASK.md`, `tasks/067-micro-ds-0-1-8-bump/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Обратимость: да — откат submodule на коммит **0.1.5** (`develop` до bump), repack **0.1.5**, восстановить `file:` и lock; убрать `inline` для `mantine-vaul` в конфигах Vitest, если снова не нужен.

## 5) Проверка качества
- Линтер: ok (`npm run lint -w @april/profile-ui`, `npm run lint:app`)
- Сборка: ok (`npm run build -w @april/profile-ui`, `npm run build:app`)
- Unit tests: ok (`npm run test -w @april/profile-ui`, `npm run test:app`)
- Integration tests: не применялись
- E2E / smoke: не запускались

Команды (фактически выполненные):
```bash
sh frontend/scripts/repack-ds-vendor.sh
cd frontend && npm install
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
cd frontend && npm run lint:app && npm run build:app && npm run test:app
```

## 6) Деплой
- Среда: нет
- Образы: не применялось

## 7) Риски и ограничения
- В **0.1.8** цепочка `@april/ui` тянет **`mantine-vaul`** (CSS side-effect); для **Vitest** добавлен **`deps.inline`** — при других раннерах без Vite может понадобиться аналогичная настройка или мок CSS.
- Потребители вне репозитория должны прогнать свои сценарии на **0.1.8**.
- Указатель submodule может оставаться в **detached HEAD** на merge-коммите релиза.

## 8) Что осталось
- [x] Закоммитить изменения (включая **gitlink** submodule и бинарные `.tgz`) в **`feature/micro-ds-0-1-8-bump`** (актуальный hash — `git log -1 --oneline` на ветке).
- [ ] Открыть PR в **`develop`**.
- [ ] Задача **048**: при переходе на registry поднять опубликованные пакеты и инструкции до **0.1.8** (частично отражено в `vendor/ds-packs/README.md`).
