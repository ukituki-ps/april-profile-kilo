# Задача 050 (фаза 7): документация DS registry, bump UI, регрессия, docs-site

## Мета

- **Репозиторий выполнения:** `april-profile-1` (текущий).
- **Карточка-источник (эпик AprilHub):** [`april-worker/tasks/049-april-ds-registry-consumption-epic/EXTERNAL_APRILPROFILE_TASK.md`](https://github.com/ukituki-ps/april-worker/blob/develop/tasks/049-april-ds-registry-consumption-epic/EXTERNAL_APRILPROFILE_TASK.md).
- **Приоритет:** обычный.
- **ID / ветка:** `050-phase-7-ds-npm-registry-docs-and-release-story`.
- **Связанные документы:** [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md), [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md), [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md).

## Цель

Закрыть **документационную** часть внешней постановки: порядок **bump** версий `@april/ui` / `@april/tokens`, регрессии UI, ссылка на ADR/гайд AprilHub; обновить человекопонятную историю в docs-site; финализировать отчёты для владельца эпика 049.

## Контекст для агента

- Техническая миграция — в **048** и **049**; эта задача — согласованность документации и приёмка «как пользоваться дальше».
- В [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md) сейчас описан поток submodule + `file:` + `ds:prepare` — его нужно привести в соответствие с registry-моделью (и опциональной ролью submodule).
- ADR в april-worker появится в рамках `TASK-049-01` — дать **каноническую ссылку** после merge.

## Входит в объём

- Обновление **`docs/guides/DESIGN_SYSTEM.md`**: registry, `.npmrc`, локальный `npm ci`, связь с AprilHub.
- Краткое обновление **`docs/FRONTEND_STRATEGY.md`** и **`docs/TESTING_STRATEGY.md`** (убрать утверждения, что CI всегда собирает DisignApril через pnpm, если это больше не так).
- Раздел в **`docs/DEPLOYMENT_STRATEGY.md`** или соседний runbook: секреты для pull пакетов, self-hosted runner.
- **Чеклист bump и регрессии UI:** минимум — таблица шагов (обновить версии → `npm ci` → lint/test/build → smoke ключевых экранов / виджетов).
- **Уведомление владельца эпика 049** в april-worker: опубликованные версии + ссылка на PR(ы) в april-profile-1 (в `REPORT.md` зафиксировать факт).

## Не входит в объём

- Реализация publish в DisignApril.
- Изменение кода виджетов (кроме правок импортов/типов, если всплыли при bump — тогда отдельный микро-PR или явный пункт в **048**).

## Технические ограничения

- Секреты не в документах; только имена переменных и ссылки на настройку org.

## Требования к дизайн-системе (для frontend-задач)

- [ ] В документации явно: DS-first и выравнивание версий с Hub.

## Критерии готовности (acceptance)

- [ ] Документирован порядок **bump** версии DS и **регрессии** UI (чеклист или runbook).
- [ ] Зафиксирован минимальный **диапазон semver** или версии, согласованные с AprilHub (таблица / строка в `DESIGN_SYSTEM.md`).
- [ ] Создана страница **`docs-site/docs/task-story-048-phase-7-ds-npm-registry-consumption.md`** (или согласованный slug), обновлён [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md).
- [ ] В папках задач **048**–**050** оформлены актуальные `REPORT.md`; итог эпика можно собрать для зеркалирования в april-worker по запросу владельца.

## Проверка (команды)

```bash
make docs-build
# или: cd docs-site && npm ci && npm run build
```

## Результат в отчёте

[`REPORT.md`](./REPORT.md): список изменённых doc-файлов, ссылка на ADR AprilHub, follow-up если submodule остаётся опциональным.

## Человекопонятная история в docs-site (обязательно)

- [ ] Создана/обновлена страница `docs-site/docs/task-story-048-phase-7-ds-npm-registry-consumption.md` (объединённая история для 048–050: что поменялось, зачем, как проверить без чтения кода).
- [ ] В `docs-site/docs/task-stories-overview.md` добавлена ссылка и статус.
- [ ] В конце страницы — ссылки на `tasks/048-.../TASK.md`, `049-.../TASK.md`, `050-.../TASK.md` и при наличии `PLAN.md` / `REPORT.md`.

## Зависимости

- **Зависит от:** завершения **048** и **049** (документация отражает фактическое поведение CI и зависимостей).
