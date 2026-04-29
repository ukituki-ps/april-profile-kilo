# План: 048 — deps, lock, `.npmrc` (registry вместо `file:`)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** обновлён после реализации (промежуточный vendor-bridge до registry — см. [`REPORT.md`](./REPORT.md))

## Исходные допущения

- Registry: **GitHub Packages**, scope `@april`, URL как в AprilHub после задач `049-02` / `049-03` в april-worker (сверить перед merge).
- Read-токен для `npm ci` на CI — тот же класс секрета, что и в Hub (`NODE_AUTH_TOKEN` или `GITHUB_TOKEN` с `packages:read` — по политике org).
- Submodule `design-system/DisignApril` может остаться для локальной разработки DS до политики команды; для типового `npm ci` он не обязан быть источником `@april/*`.

## Порядок работ (шаги)

1. Получить от владельца эпика 049 **опубликованные версии** `@april/ui` и `@april/tokens` и целевой диапазон semver (согласование с `hub-shell`).
2. Добавить в `frontend/` `.npmrc` с `@april:registry=…` и шаблоном для auth через env (без секретов в репозитории).
3. Заменить в `frontend/package.json` зависимости на semver; выполнить `npm install` с токеном, закоммитить `package-lock.json`.
4. Проверить `npm run lint`, `npm run test`, `npm run build` локально.
5. Зафиксировать в черновике `REPORT.md` версии и любые отклонения от текущего `ds:prepare` (полная документация — в **050**).

## Затрагиваемые области

| Область | Что меняется |
|--------|----------------|
| `frontend/package.json` | semver на `@april/ui`, `@april/tokens` |
| `frontend/package-lock.json` | lock под registry |
| `frontend/.npmrc` | registry + always-auth через env |
| `frontend/scripts/ds-prepare.sh` | при необходимости: не падать / не требовать сборку submodule, если DS уже из `node_modules` (уточнить после первого зелёного `npm ci`) |

## Риски и откат

- **Риск:** несовпадение peer-версий Mantine/React с пакетом DS → **Митигация:** взять те же версии, что в lock april-worker `hub-shell`.
- **Риск:** `ds:prepare` всё ещё тянет тяжёлый pnpm в CI → **Митигация:** совместно с **049** ослабить pre-hooks или сделать prepare no-op при наличии registry-артефактов.
- **Откат:** revert PR; вернуть `file:` указатели при крайней необходимости (несогласовано с эпиком 049).

## Проверка после выполнения

Команды из `TASK.md`; при отсутствии токена в песочнице — доказательство зелёного прогона в CI (после **049**).
