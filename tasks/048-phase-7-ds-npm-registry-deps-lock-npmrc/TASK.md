# Задача 048 (фаза 7): `@april/ui` / `@april/tokens` из npm registry — зависимости, lock, `.npmrc`

## Мета

- **Репозиторий выполнения:** `april-profile-1` (текущий).
- **Карточка-источник (эпик AprilHub):** [`april-worker/tasks/049-april-ds-registry-consumption-epic/EXTERNAL_APRILPROFILE_TASK.md`](https://github.com/ukituki-ps/april-worker/blob/develop/tasks/049-april-ds-registry-consumption-epic/EXTERNAL_APRILPROFILE_TASK.md) (локальный путь: соседний клон `../april-worker/...`).
- **Приоритет:** обычный.
- **ID / ветка:** `048-phase-7-ds-npm-registry-deps-lock-npmrc`.
- **Связанные документы:** [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md), [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md), план эпика в april-worker [`tasks/049-april-ds-registry-consumption-epic/PLAN.md`](https://github.com/ukituki-ps/april-worker/blob/develop/tasks/049-april-ds-registry-consumption-epic/PLAN.md).

## Цель

Заменить в корневом workspace `frontend/` зависимости **`@april/ui`** и **`@april/tokens`** с `file:../design-system/DisignApril/...` на **semver из того же приватного registry**, что и AprilHub (GitHub Packages для scope `@april`), с зафиксированными версиями в lockfile.

## Контекст для агента

- Сейчас: [`frontend/package.json`](../../frontend/package.json) — `file:` на submodule; [`frontend/scripts/ds-prepare.sh`](../../frontend/scripts/ds-prepare.sh) — `pnpm install` + `build` в submodule, копирование ассетов showcase.
- **Блокер:** в registry должны быть опубликованы `@april/ui` и `@april/tokens` (задача DisignApril по эпику 049; см. `EXTERNAL_DISIGNAPRIL_TASK.md` в том же каталоге эпика). До первой опубликованной версии задачу 048 нельзя закрыть по критериям «зелёный `npm ci` без `file:`».
- Согласовать **конкретные версии или диапазон semver** с владельцем эпика 049 / AprilHub (`hub-shell`), чтобы не расходиться с Hub по минору (см. критерии внешней постановки).

## Входит в объём

- `frontend/package.json`: semver на `@april/ui`, `@april/tokens` (без `file:` на DS).
- `frontend/package-lock.json`: воспроизводимый lock после `npm install` с доступом к registry.
- `frontend/.npmrc` (или согласованное место): `@april:registry=…`, `always-auth` через env-переменные **без** коммита токенов.
- При необходимости — минимальная правка `ds:prepare` / `pre*` скриптов, чтобы типовой CI не требовал сборки submodule для установки зависимостей (детали — в [`PLAN.md`](./PLAN.md) и в задаче **049** для полного CI-контура).

## Не входит в объём

- Изменение API backend AprilProfile.
- Публикация пакетов в DisignApril (внешний репозиторий).
- Полная правка всех workflow и Docker (задача **049**).
- Итоговая пользовательская документация и страница docs-site (задача **050**).

## Технические ограничения

- Стек и DS-first: [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md), [`docs/AGENT_TASK_TEMPLATE.md`](../../docs/AGENT_TASK_TEMPLATE.md).
- Секреты только через GitHub Secrets / env на runner; значения токенов не в git.
- Миграции БД не требуются.

## Требования к дизайн-системе (для frontend-задач)

- [ ] Проверено, что выбранные версии `@april/ui` покрывают текущие импорты в `frontend/` и `packages/profile-ui` (при сомнении — smoke вручную).
- [ ] После перехода импорты остаются на публичном API DS; кастомный UI не вводится.
- [ ] Тесты и линт обновлены только если меняется способ резолва зависимостей (без редизайна).

## Критерии готовности (acceptance)

- [ ] В `frontend/package.json` нет `file:` на `@april/ui` / `@april/tokens`.
- [ ] `npm ci` в каталоге `frontend/` проходит в окружении с настроенным read-доступом к registry (локально или в CI после задачи **049**).
- [ ] `npm run build` (фактические скрипты репозитория) проходит с зависимостями из lock.
- [ ] Зафиксированы согласованные версии или диапазоны с AprilHub (строка в `REPORT.md` или в комментарии к PR).

## Проверка (команды)

```bash
cd frontend
npm ci
npm run lint
npm run test
npm run build
```

## Результат в отчёте

[`REPORT.md`](./REPORT.md): перечень файлов, опубликованные версии пакетов, отличия от прежнего `file:`-потока, риски; уведомление владельца эпика 049 в april-worker о готовности артефактов (после полного закрытия цепочки 048–050).

## Человекопонятная история в docs-site (обязательно)

- [ ] Объединённая страница по результатам эпика потребления DS — в задаче [`050`](../050-phase-7-ds-npm-registry-docs-and-release-story/TASK.md) (одна история на сквозной результат 048–050).

## Зависимости

- **Зависит от:** публикации `@april/ui` и `@april/tokens` в registry (DisignApril / эпик 049).
- **Блокирует:** по смыслу — задачу **049** (CI без рабочих semver-зависимостей не имеет смысла); фактически 048 и 049 могут идти одним PR при согласовании.
