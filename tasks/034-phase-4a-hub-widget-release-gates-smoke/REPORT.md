# Отчёт: задача 034 — релизные гейты AprilHub для виджетов 4a

## Итог

- **Статус:** выполнено в репозитории **AprilHub** (`april-worker`).
- **Дублирование отчёта:** да — зеркало в `april-worker/tasks/030-aprilhub-execute-external-task-034-april-profile-1/REPORT.md`.

## Что сделано по acceptance `TASK.md`

1. **Обязательный release-gate** для виджетов 4a задокументирован в `april-worker/docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md` (таблица P0 CI, соответствие сценариям Playwright в `smoke.spec.ts`, ссылка на triage и деплой-откат).
2. **Semver в процессе релиза Hub:** скрипт `hub-shell/scripts/check-april-profile-ui-semver.mjs`, npm-скрипт `check:profile-ui-semver`, шаг в job `hub-shell` в `.github/workflows/ci.yml`; при отсутствии `@april/profile-ui` в зависимостях — безопасный no-op (текущая модель со встроенными хост-виджетами).
3. **Rollback / mitigation** и порядок при падении smoke/e2e — в том же runbook; перекрёстные ссылки в `docs/TESTING_STRATEGY.md` и `README.md` AprilHub.
4. **docs-site (обязательный блок постановки):** страница `docs-site/docs/task-story-034-phase-4a-hub-widget-release-gates-smoke.md`, обновлены `task-stories-overview.md`.

## Ссылки на изменения

- Репозиторий исполнения: https://github.com/ukituki-ps/april-worker — ветка `feature/030-external-034-release-gates`, основной коммит изменений `a1bbabe` (см. также `git log` на ветке); PR создаётся вручную.

## Риски и follow-up

- Playwright на PR в self-hosted CI не включали (вес compose); перед релизом полагаться на nightly + локальный `./scripts/run-playwright-aprilhub.sh`.
- После публикации `@april/profile-ui` в registry — добавить зависимость в `hub-shell/package.json` и закоммитить lockfile; скрипт начнёт enforce major/range.
