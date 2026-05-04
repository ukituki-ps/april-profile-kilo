# Задача 077 [april-worker, внешнее исполнение] — `hub-shell`: DS из GitHub Packages вместо `file:` на submodule

## Мета
- **Репозиторий выполнения:** **[april-worker](https://github.com/ukituki-ps/april-worker)** (не april-profile). Каталог **`hub-shell/`**.
- **Постановка в april-profile:** якорь эпика **074**; PR и merge — команда april-worker.
- **Родитель:** [`tasks/074-phase-8-ds-gpr-and-mobile-shell-unification`](../074-phase-8-ds-gpr-and-mobile-shell-unification/) — **волна A**, шаг 3.
- **Зависит от:** [`075-external-DisignApril-ds-packages-gpr-publish`](../075-external-DisignApril-ds-packages-gpr-publish/); желательно merge [`076-april-profile-frontend-ds-gpr-consumption-remove-tgz`](../076-april-profile-frontend-ds-gpr-consumption-remove-tgz/) для выравнивания версии lock.
- **Связанные файлы (в april-worker):** [`hub-shell/package.json`](https://github.com/ukituki-ps/april-worker/blob/develop/hub-shell/package.json), [`hub-shell/scripts/ds-prepare.sh`](https://github.com/ukituki-ps/april-worker/blob/develop/hub-shell/scripts/ds-prepare.sh), [`.github/workflows/ci.yml`](https://github.com/ukituki-ps/april-worker/blob/develop/.github/workflows/ci.yml).

## Цель
`hub-shell` устанавливает **`@april/ui`** и **`@april/tokens`** из **GitHub Packages** (`npm:@ukituki-ps/...`), как april-profile после **076**, без обязательной сборки всего монорепо DisignApril при каждом `npm ci`. Скрипт **`ds:prepare`** не должен перезаписывать `node_modules` из registry тяжёлой синхронизацией `dist` из submodule, если зависимости уже с registry.

## Входит в объём
- `hub-shell/package.json` + lock; при необходимости **`hub-shell/.npmrc`** (scope `@ukituki-ps`).
- Условная логика в `ds-prepare.sh`: при отсутствии `file:` на `../design-system/DisignApril/packages/{ui,tokens}` — пропуск `pnpm install && pnpm build` в корне DS и пропуск `sync_design_system_package_dist` (или эквивалент по согласованию с командой worker).
- CI: `NODE_AUTH_TOKEN` + `packages: read` на шагах `npm ci` для hub-shell.

## Не входит в объём
- Bump **`vendor/april-profile`** — отдельный PR по необходимости после **076**.
- E2e mobile chrome — задача **080**.

## Критерии готовности (acceptance)
- [ ] `cd hub-shell && npm ci && npm run lint && npm run test && npm run build` с токеном GPR.
- [ ] Lock резолвит `@april/ui` из GPR, не из `file:../design-system/...`.

## Результат в отчёте
[`REPORT.md`](./REPORT.md) в этой папке: ссылка на PR в april-worker, краткое описание изменений `ds-prepare`.

## Человекопонятная история в docs-site
- [ ] Опционально: ссылка из [`task-story-074`](../../docs-site/docs/task-story-074-phase-8-ds-gpr-mobile-shell-unification.md).
