# REPORT — 066 micro: DS 0.1.7

## 1) Итого
- Статус: ✅ выполнено
- Задача: обновить vendored **`@april/ui` / `@april/tokens`** до **0.1.7**, submodule **DisignApril** на merge релиза **0.1.7**, синхронизировать peer и оперативные доки.
- Ветка: укажите фактическую `feature/*` при коммите (агент не создавал ветку).
- Коммиты: не фиксировались в этом сеансе.
- PR: не создавался.

## 2) Что сделано
- [frontend] Submodule **`design-system/DisignApril`** переведён на **`a670d77`** (merge PR release **0.1.7**).
- [frontend] **`frontend/scripts/repack-ds-vendor.sh`**: собраны **`april-tokens-0.1.7.tgz`** и **`april-ui-0.1.7.tgz`**; удалены архивы **0.1.6**.
- [frontend] **`frontend/package.json`**, **`package-lock.json`**, **`packages/profile-ui/package.json`**: зависимости на **`file:…0.1.7.tgz`**, **`peerDependencies` `@april/ui` ≥ 0.1.7**.
- [docs] Baseline **`@april/ui`** в README пакета, шаблоне changelog и виджет-доках поднят до **≥ 0.1.7** там, где описан текущий shell; **`task_list.md`** — строка задачи **066**.
- [tasks] Постановка и отчёт в **`tasks/066-micro-ds-0-1-7-bump/`**.

## 3) Изменённые файлы
- `design-system/DisignApril` (gitlink на `a670d77`)
- `frontend/package.json`, `frontend/package-lock.json`
- `frontend/packages/profile-ui/package.json`, `frontend/packages/profile-ui/README.md`
- `frontend/vendor/ds-packs/april-tokens-0.1.7.tgz`, `april-ui-0.1.7.tgz` (+ удалены `*-0.1.6.tgz`)
- `frontend/vendor/ds-packs/README.md`
- `docs/widgets/profile/profiles-widget.md`, `profiles-widget-profile-detail.md`, `entity-types-widget.md`, `entity-types-widget-schema-admin.md`
- `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`
- `tasks/059-phase-7-profiles-widget-rjsf-document-form/TASK.md` (ссылка на минимальную версию shell)
- `task_list.md`
- `tasks/066-micro-ds-0-1-7-bump/TASK.md`, `tasks/066-micro-ds-0-1-7-bump/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Обратимость: да — откат submodule на **0.1.6**, repack **0.1.6**, восстановить `file:` и lock как в коммите до bump.

## 5) Проверка качества
- Линтер: ok (`npm run lint -w @april/profile-ui`, `npm run lint:app`)
- Сборка: ok (`npm run build -w @april/profile-ui`, `npm run build:app`)
- Unit tests: ok (`npm run test -w @april/profile-ui`, `npm run test:app`)
- Integration tests: не применялись (не затронут backend)
- E2E / smoke: не запускались

Команды (фактически выполненные):
```bash
sh frontend/scripts/repack-ds-vendor.sh
cd frontend && npm install
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
cd frontend && npm run lint:app && npm run build:app
cd frontend && npm run test:app
```

## 6) Деплой
- Среда: нет
- Образы: не применялось

## 7) Риски и ограничения
- В **0.1.7** в DS добавлены новые публичные примитивы (например **`AprilModal`**); регрессий по текущим тестам не выявлено, но потребители вне репо должны проверить свои сценарии.
- Указатель submodule может оставаться в **detached HEAD** на merge-коммите; для разработки внутри DS при необходимости переключайтесь на **`origin/main`**.

## 8) Что осталось
- [ ] Закоммитить изменения (включая **gitlink** submodule и бинарные `.tgz`) в **`feature/*`**, PR по политике репо.
- [ ] Задача **048**: при переходе на registry поднять опубликованные пакеты и инструкции до **0.1.7** (частично отражено в `vendor/ds-packs/README.md`).
