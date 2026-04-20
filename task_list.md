# Список задач

Используйте чекбоксы по мере выполнения. Шаблон репозитория — заведите первую задачу из [`tasks/_template/`](./tasks/_template/) после копирования.

## Инициализация

- [ ] **Фаза 0 (часть 1)** — плейсхолдеры, OIDC/gateway/runner, связь с AprilHub в доках — [`tasks/001-phase-0-placeholders-oidc-runner-hub-docs/`](tasks/001-phase-0-placeholders-oidc-runner-hub-docs/) ([`TASK.md`](tasks/001-phase-0-placeholders-oidc-runner-hub-docs/TASK.md)); зависимостей нет (родитель: [`tasks/000-full-service-aprilhub-roadmap/PLAN.md`](tasks/000-full-service-aprilhub-roadmap/PLAN.md) «Фаза 0», блок «Сначала»).
- [x] **Фаза 0 (часть 2)** — branch protection, секреты CI (`SUBMODULES_TOKEN` и др.), `APRIL_DEPLOY_ROOT`, smoke на dev — [`tasks/002-phase-0-branch-ci-secrets-smoke-deploy/`](tasks/002-phase-0-branch-ci-secrets-smoke-deploy/) ([`TASK.md`](tasks/002-phase-0-branch-ci-secrets-smoke-deploy/TASK.md), [`REPORT.md`](tasks/002-phase-0-branch-ci-secrets-smoke-deploy/REPORT.md)); **зависит от:** завершения [`001-phase-0-placeholders-oidc-runner-hub-docs`](tasks/001-phase-0-placeholders-oidc-runner-hub-docs/).

## Планирование

- [x] Гибридная UI-модель и governance-артефакты (Host + Widgets + API/BFF-first) — [`tasks/003-hybrid-ui-integration-governance/`](tasks/003-hybrid-ui-integration-governance/) ([`TASK.md`](tasks/003-hybrid-ui-integration-governance/TASK.md), [`REPORT.md`](tasks/003-hybrid-ui-integration-governance/REPORT.md))
- [x] Дизайн модуля и ADR по AprilProfile — [`docs/DESIGN_AprilProfile.md`](docs/DESIGN_AprilProfile.md), [`docs/adr/0002-april-profile-scope-and-multitenancy.md`](docs/adr/0002-april-profile-scope-and-multitenancy.md), [`docs/adr/0003-april-profile-data-model-policies.md`](docs/adr/0003-april-profile-data-model-policies.md)
- [x] Дорожная карта рабочего сервиса + интеграция AprilHub — [`tasks/000-full-service-aprilhub-roadmap/`](tasks/000-full-service-aprilhub-roadmap/) ([`TASK.md`](tasks/000-full-service-aprilhub-roadmap/TASK.md), [`PLAN.md`](tasks/000-full-service-aprilhub-roadmap/PLAN.md))

## Разработка

- [ ] …

## Идеи на потом (backlog)

- …
