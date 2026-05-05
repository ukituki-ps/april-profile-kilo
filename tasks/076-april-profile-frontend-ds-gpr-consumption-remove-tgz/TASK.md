# Задача 076 [april-profile] — `frontend/`: потребление DS из GitHub Packages, удаление vendored `.tgz`

## Мета
- **Репозиторий выполнения:** **april-profile** (этот репозиторий).
- **Родитель:** [`tasks/074-phase-8-ds-gpr-and-mobile-shell-unification`](../074-phase-8-ds-gpr-and-mobile-shell-unification/) — **волна A**, шаг 2.
- **Зависит от:** [`075-external-DisignApril-ds-packages-gpr-publish`](../075-external-DisignApril-ds-packages-gpr-publish/) (пакеты в GPR).
- **Связанные документы:** [`frontend/vendor/ds-packs/README.md`](../../frontend/vendor/ds-packs/README.md); [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md); [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md); эпик **048–050**; [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

## Цель
Заменить в `frontend/package.json` (и в `packages/profile-ui`) зависимости **`file:vendor/ds-packs/*.tgz`** на **`npm:@ukituki-ps/april-ui@^…`** / **`npm:@ukituki-ps/april-tokens@^…`** (с сохранением импортов **`@april/ui`** и **`@april/tokens`** через npm aliases), обновить **`package-lock.json`**, удалить бинарные `.tgz` из git, обновить README и каноничные docs/docs-site.

## Входит в объём
- `frontend/package.json`, `frontend/packages/profile-ui/package.json`, lockfile.
- `frontend/vendor/ds-packs/` — удаление архивов из индекса (скрипт `repack-ds-vendor.sh` оставить как **опциональный** офлайн-путь или пометить deprecated в README).
- `frontend/README.md`, `frontend/vendor/ds-packs/README.md`, при необходимости `docs/guides/DESIGN_SYSTEM.md`, `docs/FRONTEND_STRATEGY.md`, зеркало `docs-site/`.
- Проверка: `ds:prepare` при отсутствии `file:` на submodule-пакеты не требует `pnpm build` в DS (уже поддержано скриптом).

## Не входит в объём
- Изменения в **april-worker** — задача **077**.
- Рефакторинг виджетов под mobile shell — задача **079**.

## Технические ограничения
- Локальный и CI `npm ci` требуют **`NODE_AUTH_TOKEN`** (см. `frontend/.npmrc`, `DEPLOYMENT_STRATEGY.md`).
- Секреты не коммитить.

## Критерии готовности (acceptance)
- [ ] `cd frontend && npm ci && npm run lint && npm run test && npm run build` с установленным `NODE_AUTH_TOKEN`.
- [x] В lockfile `@april/ui` / `@april/tokens` резолвятся в **`https://npm.pkg.github.com/...`** (или эквивалент GPR), не `file:vendor/ds-packs`.
- [x] Документация отражает основной поток через GPR.

## Проверка (команды)
```bash
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## Человекопонятная история в docs-site
- [x] Обновить или связать с [`task-story-074-phase-8-ds-gpr-mobile-shell-unification`](../../docs-site/docs/task-story-074-phase-8-ds-gpr-mobile-shell-unification.md).

## Результат в отчёте
[`REPORT.md`](./REPORT.md): список файлов, версии пакетов, ссылка на PR в april-profile.
