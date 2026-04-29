---
sidebar_position: 248
---

# 048–050 — дизайн-система из registry (эпик AprilHub 049)

## Проблема

Раньше `@april/ui` и `@april/tokens` подключались через **`file:`** на каталоги в **git submodule** DisignApril и обязательный **`pnpm build`** в submodule при каждом `npm ci` / сборке. На стендах и в CI это давало класс сбоев: исходники обновили, а **собранный `dist` в submodule устарел** — белый экран и ошибки вида «нет named export». Источник runtime для браузера не был однозначно зафиксирован в lockfile так же, как у пакетов из registry.

## Что сделали

1. **048** — зависимости DS в `frontend/` переведены на **зафиксированные tarball’ы** в `frontend/vendor/ds-packs/` (версия **0.1.0**); в `frontend/.npmrc` заготовлены (пока закомментированные) строки для **GitHub Packages**; `ds:prepare` **не** гоняет тяжёлый `pnpm build` в submodule, если нет `file:` на `packages/ui|tokens` в `package.json` (ассеты showcase по-прежнему копируются при наличии submodule). Добавлен скрипт `frontend/scripts/repack-ds-vendor.sh` для обновления архивов после изменений в DisignApril.

2. **049** — в GitHub Actions для шагов с `npm ci` в `frontend/` заданы **`NODE_AUTH_TOKEN`** (`APRIL_NPM_READ_TOKEN` или `GITHUB_TOKEN`) и **`permissions: packages: read`**, чтобы после перехода на registry установка `@april/*` не ломалась.

3. **050** (этот документ) — обновлены **`docs/guides/DESIGN_SYSTEM.md`**, **`docs/FRONTEND_STRATEGY.md`**, **`docs/DEPLOYMENT_STRATEGY.md`**, **`docs/TESTING_STRATEGY.md`**, **`docs/AGENT_ARCHITECTURE_CONTEXT.md`** и зеркало **`docs-site/docs/frontend-strategy.md`**: описаны текущая модель, чеклист bump/регрессии, секреты CI и ссылка на эпик в april-worker.

## Что это даёт

- **Предсказуемый CI и стенды:** `npm ci` не зависит от того, успели ли на машине пересобрать submodule после `git pull`.
- **Готовность к одной линии версий с AprilHub:** после публикации `@april/*` в GitHub Packages останется раскомментировать `.npmrc`, выставить semver как в `hub-shell` и убрать vendored tarball’ы.
- **Меньше «магии» у разработчика:** порядок bump и smoke зафиксирован в `DESIGN_SYSTEM.md`.

## Как проверить без чтения кода

```bash
cd frontend && npm ci && npm run lint && npm run test && npm run build
make docs-build
```

Ожидаемый результат: команды завершаются без ошибок.

## Ссылки на артефакты

- [Задача 048 — deps, lock, vendor, ds:prepare](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/048-phase-7-ds-npm-registry-deps-lock-npmrc/TASK.md) · [PLAN](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/048-phase-7-ds-npm-registry-deps-lock-npmrc/PLAN.md) · [REPORT](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/048-phase-7-ds-npm-registry-deps-lock-npmrc/REPORT.md)
- [Задача 049 — CI workflows](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/049-phase-7-ds-npm-registry-ci-workflows/TASK.md) · [PLAN](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/049-phase-7-ds-npm-registry-ci-workflows/PLAN.md) · [REPORT](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/049-phase-7-ds-npm-registry-ci-workflows/REPORT.md)
- [Задача 050 — документация](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/050-phase-7-ds-npm-registry-docs-and-release-story/TASK.md) · [PLAN](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/050-phase-7-ds-npm-registry-docs-and-release-story/PLAN.md) · [REPORT](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/050-phase-7-ds-npm-registry-docs-and-release-story/REPORT.md)
- Эпик AprilHub: [EXTERNAL_APRILPROFILE_TASK.md в april-worker](https://github.com/ukituki-ps/april-worker/blob/develop/tasks/049-april-ds-registry-consumption-epic/EXTERNAL_APRILPROFILE_TASK.md)
- ADR по дистрибуции DS в экосистеме: после merge в april-worker — каталог [`docs/architecture/`](https://github.com/ukituki-ps/april-worker/tree/develop/docs/architecture) (задача `049-01` эпика)

## Уведомление владельцу эпика 049 (april-worker)

Итог по AprilProfile: vendored **0.1.0**, CI с `NODE_AUTH_TOKEN` / `packages:read`, документация обновлена (этот раздел и каноничные `docs/`). После публикации `@april/ui` и `@april/tokens` в GitHub Packages — сообщить опубликованные версии для синхронизации с `hub-shell` и снятия vendored пути в april-profile-1.
