# REPORT — 060 micro: DS 0.1.6

## 1) Итого

- Статус: ✅ выполнено
- Задача: bump vendored `@april/ui` / `@april/tokens` до **0.1.6**, синхронизация submodule, peer и документация
- Ветка: `feature/task-059-phase-7-profiles-widget-rjsf-document-form` (рабочая ветка на момент выполнения)
- Коммиты: один коммит `chore(frontend): bump @april/ui and @april/tokens to 0.1.6` на текущей ветке (см. `git log -1`)
- PR: не создавался

## 2) Что сделано

- [frontend] Submodule **`design-system/DisignApril`** переведён на merge-коммит релиза **0.1.6** (`46e3218`).
- [frontend] Скрипт **`frontend/scripts/repack-ds-vendor.sh`**: пересобраны **`april-tokens-0.1.6.tgz`** и **`april-ui-0.1.6.tgz`**; удалены архивы **0.1.5**.
- [frontend] **`frontend/package.json`**, **`package-lock.json`**, **`packages/profile-ui/package.json`**: зависимости и **`peerDependencies`** на **`>=0.1.6`** / `file:…0.1.6.tgz`.
- [docs] Спеки виджетов (`profiles-widget`, `entity-types-widget`), **`profile-ui/README`**, **`vendor/ds-packs/README`**, шаблон changelog; **`task_list.md`** — строка **060**; в **`tasks/059-…/TASK.md`** обновлён нижний предел версии DS для согласованности с shell.

## 3) Изменённые файлы

- `design-system/DisignApril` (указатель submodule)
- `frontend/package.json`, `frontend/package-lock.json`
- `frontend/vendor/ds-packs/april-tokens-0.1.6.tgz`, `april-ui-0.1.6.tgz` (+ удалены `*-0.1.5.tgz`)
- `frontend/vendor/ds-packs/README.md`
- `frontend/packages/profile-ui/package.json`, `frontend/packages/profile-ui/README.md`
- `docs/widgets/profile/profiles-widget.md`, `docs/widgets/profile/entity-types-widget.md`
- `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`
- `task_list.md`
- `tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md`
- `tasks/060-micro-ds-0-1-6-bump/TASK.md`, `tasks/060-micro-ds-0-1-6-bump/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да — откат submodule на **0.1.5**, `repack` + восстановление зависимостей **0.1.5** в `package.json` / lock

## 5) Проверка качества

- Линтер: ok (`cd frontend && npm run lint`)
- Сборка: ok (`npm run build`)
- Unit tests: ok (`npm run test`)
- Integration tests: не применялись (Go не затрагивался)
- E2E / smoke: не запускались

Команды (фактически выполненные):

```bash
sh frontend/scripts/repack-ds-vendor.sh
cd frontend && npm install
cd frontend && rm -rf node_modules packages/profile-ui/node_modules && npm ci
cd frontend && npm run lint && npm run test && npm run build
```

## 6) Деплой

- Не применялось (только зависимости фронта и доки)

## 7) Риски и ограничения

- Любые **breaking** изменения между **0.1.5** и **0.1.6** в DS могут проявиться у потребителей вне этого репо; здесь регрессий по lint/test/build не выявлено.
- Указатель submodule в **detached HEAD** на конкретном merge; для разработки внутри DS лучше позже переключить submodule на **`main`**, когда он устойчиво указывает на **0.1.6**.

## 8) Что осталось

- [ ] При желании: выровнять **`design-system/DisignApril`** на **`origin/main`** после того, как локальная ветка разработчика следует за `main` с **0.1.6** по умолчанию.
- [ ] Задача **048**: при переходе на registry поднять опубликованные пакеты до **0.1.6** в инструкциях (частично отражено в `vendor/ds-packs/README.md`).
