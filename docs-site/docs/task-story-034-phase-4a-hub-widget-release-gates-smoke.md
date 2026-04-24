---
sidebar_position: 46
---

# 034 — AprilHub: релизные гейты, smoke/e2e и semver для виджетов 4a (исполнение в AprilHub)

Статус: политика release gate и проверка semver для `@april/profile-ui` зафиксированы в репозитории **`april-worker`** (AprilHub); человекопонятное описание — на этой странице.

## Зачем это бизнесу

Перед выкладкой Hub нужно предсказуемо знать, что критичные сценарии профиля (карточка, список, экземпляры, история, конфликты) не сломаны интеграцией с BFF и Keycloak, а обновления npm-пакета виджетов не принесут скрытый breaking change без отдельного PR и миграции.

## Какие проверки теперь обязательны перед релизом

1. **Весь P0 quality gate CI AprilHub** (блокирует merge в `main`/`develop`): совместимость OpenAPI, линт OpenAPI + сборка docs, `go test` hub-bff, lint/unit/build hub-shell, **скрипт semver** для `@april/profile-ui` (если пакет объявлен в `package.json`; иначе успешный пропуск), runtime smoke `smoke-aprilhub.sh`, k6 baseline.
2. **Перед промоутом релиза** рекомендуется локально выполнить **Playwright**-набор из `hub-shell/tests/e2e/smoke.spec.ts` через `./scripts/run-playwright-aprilhub.sh` (полный compose + сценарии виджетов 4a). На GitHub тот же набор крутится в **nightly** workflow testing extensions.

Подробная таблица шагов и ссылки на jobs: runbook **`april-worker`** → `docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md`.

## Если упали smoke или e2e

1. Не мержить в защищённые ветки без явного согласования ответственного за платформу.
2. Снять артефакты CI (smoke/k6/playwright), воспроизвести командой локально.
3. На уже выкатанном dev — откат образов по политике деплоя AprilHub (`DEPLOYMENT_STRATEGY.md` в `april-worker`).

## Semver

После `npm ci` в CI hub-shell выполняется `node scripts/check-april-profile-ui-semver.mjs`: при подключении пакета из registry проверяются lockfile, допустимый **major** (по умолчанию `1`, переопределение `APRIL_PROFILE_UI_ALLOWED_MAJOR`) и диапазон `^…`. Правила версий виджета — в `docs/VERSIONING_AND_COMPATIBILITY.md` этого репозитория.

## Ссылки

- `tasks/034-phase-4a-hub-widget-release-gates-smoke/TASK.md`
- `tasks/034-phase-4a-hub-widget-release-gates-smoke/REPORT.md`
- `tasks/030-aprilhub-execute-external-task-034-april-profile-1/REPORT.md` в репозитории `april-worker`
