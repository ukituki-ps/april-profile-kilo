---
sidebar_position: 20
---

# Задачи на пальцах

Этот раздел нужен как "человеческий журнал прогресса": что именно сделали по каждой задаче, зачем это было нужно бизнесу и как это проверить без чтения кода.

## Как читать раздел

- Для каждой задачи есть отдельная страница с форматом "проблема -> что сделали -> что это дает -> как проверить".
- Технические детали и точные артефакты остаются в `tasks/<id>/TASK.md`, `PLAN.md`, `REPORT.md`.
- В этом разделе описываем только то, что реально сделано и проверено.

## Список

- [000 — Дорожная карта сервиса + интеграция AprilHub](./task-story-000-roadmap)
- [Планирование — дизайн AprilProfile и ADR](./task-story-planning-design-adr)
- [002 — CI/деплой-база: runner, переменные, smoke dev](./task-story-002-ci-secrets-smoke)
- [003 — Гибридная UI-модель и governance](./task-story-003-hybrid-ui-governance)
- [004 — Go-модуль, Atlas и стартовая схема БД](./task-story-004-go-atlas-tenant)
- [005 — JWT Keycloak и `tenant_id` из доверенного контекста](./task-story-005-keycloak-jwt-tenant)
- [006 — `/healthz`, `/readyz` и синхронизация OpenAPI](./task-story-006-health-openapi)
- [007 — Docker-образ backend, ghcr и compose-деплой](./task-story-007-docker-ghcr-compose-deploy)
- [008 — Логи, `request_id`, readiness от БД/Redis и env-конфиг](./task-story-008-observability-config-readiness-deps)
- [009 — Интеграционные тесты с PostgreSQL/Redis и Atlas](./task-story-009-integration-tests-db-redis)
- [010 — Каталог типов сущностей и OpenAPI-контракт](./task-story-010-entity-types-openapi)
- [011 — CRUD сущностей и append-only версии профиля](./task-story-011-entity-crud-versioning)
- [012 — Authority, конфликты и merge дубликатов](./task-story-012-authority-merge-conflicts)
- [013 — ABAC: фильтрация выдачи по сегментам полей](./task-story-013-abac-field-filtering)
- [014 — События профиля: outbox и идемпотентность публикации](./task-story-014-outbox-event-contract)
- [015 — Asynq: воркер, ping и батч outbox](./task-story-015-asynq-outbox-worker)
- [016 — Синк с checkpoint и lag-метрики по источникам](./task-story-016-source-sync-checkpoints-lag)
- [017 — Ретраи и DLQ для фоновых задач (Asynq, outbox, синк)](./task-story-017-async-retries-dlq)
- [018 — Prometheus `/metrics`, логи под Loki, корреляция с Hub](./task-story-018-phase-4-prometheus-metrics-logs-correlation)
- [019 — Grafana / алерты / SLO-draft для Profile в AprilHub (april-worker)](./task-story-019-phase-4-grafana-alerts-slo-hub-coordination)
- [020 — Контракт вызова Profile за Hub BFF (tenant, path-prefix, dev smoke)](./task-story-020-phase-4-profile-contract-behind-hub-bff)
- [022 — Пакет `@april/profile-ui`, OpenAPI-клиент и `onSaveSuccess`](./task-story-022-phase-4-profile-ui-package-openapi-embed)
- [024 — Модель документации виджетов и единый каталог profile -> widgets](./task-story-024-phase-4-widget-docs-operating-model-and-project-ingestion)
- [025 — `ProfilesListWidget`: список профилей и базовый CRUD](./task-story-025-phase-4a-profile-profiles-list-crud-widget)
- [027 — `ProfileInstancesWidget`: список экземпляров профиля и CRUD](./task-story-027-phase-4a-profile-instances-crud-widget)
- [029 — `InstanceHistoryWidget`: история версий экземпляра и diff](./task-story-029-phase-4a-profile-instance-history-widget)
- [031 — `ConflictQueueWidget`: очередь конфликтов и merge дубликатов](./task-story-031-phase-4a-profile-conflicts-merge-admin-ui)
- [032 — AprilHub: хостинг конфликтного UI, RBAC и e2e](./task-story-032-phase-4a-hub-conflicts-merge-host-rbac)
- [034 — AprilHub: релизные гейты smoke/e2e и semver для виджетов 4a](./task-story-034-phase-4a-hub-widget-release-gates-smoke)
- [036 — Подготовка внедрения Sentry в AprilProfile (env, redaction, runbook)](./task-story-036-phase-4b-profile-sentry-rollout-preparation)
- [039 — Отдельный File Service в архитектуре April](./task-story-039-file-service-architecture-docs)
- [040 — Двухколоночный `widget-card` (master-detail + modal create)](./task-story-040-phase-5-widget-card-layout-modernization)
- [041 — Отдельный виджет `Profiles` на базе `widget-card`](./task-story-041-phase-5-widget-card-to-profiles-widget)
- [042 — Production-first baseline для `ProfilesWidget` (`Core + ApiWidget + Facade`)](./task-story-042-phase-6-profiles-widget-production-architecture)
- [043 — API/SDK readiness для server-side списка `ProfilesWidget`](./task-story-043-phase-6-profiles-widget-api-list-contract-and-sdk)
- [044 — Рефактор `ProfilesWidget` в `Core + ApiWidget`](./task-story-044-phase-6-profiles-widget-core-api-refactor)
- [045 — Hardening контракта и Core для `ProfilesWidget` (вариант C)](./task-story-045-phase-6-profiles-widget-contract-and-core-hardening)
- [046 — Provider context, abort и observability hardening для `ProfilesWidget`](./task-story-046-phase-6-profiles-widget-provider-context-abort-observability-hardening)
- [047 — Тестовая матрица и release-gate для `ProfilesWidget` варианта C](./task-story-047-phase-6-profiles-widget-test-matrix-and-release-gate)
- [051 — Рефакторинг UI `ProfilesWidget`: embed, версии, имя](./task-story-051-phase-6-profiles-widget-ui-refactor-embed-and-versions)
- [048–050 — Дизайн-система: vendored tarball’ы, CI под GitHub Packages, документация (эпик Hub 049)](./task-story-048-phase-7-ds-npm-registry-consumption)
- [052 — Ревизии типов: модель БД и миграции](./task-story-052-phase-7-entity-type-revisions-data-model)
- [053 — Ревизии типов: API и OpenAPI](./task-story-053-phase-7-entity-type-revisions-api)
- [054 — Виджет `entity-types-widget` в `@april/profile-ui`](./task-story-054-phase-7-entity-types-widget)

## Быстрый статус

| Задача | Статус | Где детали | Ключевой эффект |
|---|---|---|---|
| 000 roadmap | ✅ | [000](./task-story-000-roadmap) | Зафиксирован порядок фаз и зависимостей |
| Планирование (дизайн + ADR) | ✅ | [Планирование](./task-story-planning-design-adr) | Архитектурные решения формализованы до кода |
| 002 CI/dev smoke | ✅ | [002](./task-story-002-ci-secrets-smoke) | Рабочий контур деплоя и инфраструктурного smoke |
| 003 hybrid UI governance | ✅ | [003](./task-story-003-hybrid-ui-governance) | Единые правила Host/Widget/API-BFF интеграции |
| 004 Go + Atlas + tenant schema | ✅ | [004](./task-story-004-go-atlas-tenant) | Базовый backend-фундамент и миграции |
| 005 JWT + trusted tenant context | ✅ | [005](./task-story-005-keycloak-jwt-tenant) | `tenant_id` только из валидного JWT |
| 006 health + readiness + OpenAPI sync | ✅ | [006](./task-story-006-health-openapi) | Появились публичные `/healthz` и `/readyz`, контракт синхронизирован |
| 007 docker + ghcr + compose deploy | ✅ | [007](./task-story-007-docker-ghcr-compose-deploy) | Backend собирается в образ и разворачивается по SHA через compose |
| 008 logs + request_id + dependency readiness | ✅ | [008](./task-story-008-observability-config-readiness-deps) | Логи структурированы, readiness зависит от БД/Redis, env валидируется при старте |
| 009 integration tests (Postgres/Redis/Atlas) | ✅ | [009](./task-story-009-integration-tests-db-redis) | Интеграционный контур проверяет миграции и readiness на реальных контейнерах |
| 010 entity types catalog + OpenAPI | ✅ | [010](./task-story-010-entity-types-openapi) | Появился каталог типов с `draft/published` и публикацией схем |
| 011 entity CRUD + append-only versioning | ✅ | [011](./task-story-011-entity-crud-versioning) | Реализован базовый CRUD профилей с history current/by-version и external mappings |
| 012 authority + conflicts + merge audit | ✅ | [012](./task-story-012-authority-merge-conflicts) | Очередь конфликтов, ручной resolve, merge дубликатов с аудитом и админ-API |
| 013 ABAC field filtering on read | ✅ | [013](./task-story-013-abac-field-filtering) | GET профиля: выдача `document` по сегментам и realm-ролям JWT (`ABAC_SEGMENT_ACCESS_JSON`) |
| 014 outbox + event contract + idempotent publish | ✅ | [014](./task-story-014-outbox-event-contract) | Таблица `profile_outbox`, событие ADR-0003 в транзакции с новой версией профиля |
| 015 Asynq worker + ping + outbox batch | ✅ | [015](./task-story-015-asynq-outbox-worker) | Фоновый `april-worker`, ping в Redis, батч `pending` → `published` через заглушку Publisher |
| 016 source sync checkpoint + lag metrics | ✅ | [016](./task-story-016-source-sync-checkpoints-lag) | Появились checkpoint по tenant/source, идемпотентный sync-batch и метрика `april_profile_source_sync_lag_seconds` |
| 017 async retries + DLQ | ✅ | [017](./task-story-017-async-retries-dlq) | Ретраи Asynq и per-row outbox, DLQ в БД (`failed`), backoff и интеграционные тесты |
| 018 Prometheus + логи + корреляция | ✅ | [018](./task-story-018-phase-4-prometheus-metrics-logs-correlation) | `GET /metrics`, JSON-логи, `X-Request-Id` / `X-Correlation-Id`, поля `requestId` / `correlationId` |
| 019 Grafana + алерты + SLO (Hub) | ✅ | [019](./task-story-019-phase-4-grafana-alerts-slo-hub-coordination) | Дашборд/алерты/SLO-draft в april-worker ([PR #28](https://github.com/ukituki-ps/april-worker/pull/28)); метрики остаются из 018 |
| 020 BFF-контракт Profile за Hub | ✅ | [020](./task-story-020-phase-4-profile-contract-behind-hub-bff) | Зафиксирован путь `/admin/profile/api/v1/...`, trusted headers, tenant только из JWT и локальный reverse-proxy smoke |
| 022 UI-пакет и OpenAPI-клиент | ✅ | [022](./task-story-022-phase-4-profile-ui-package-openapi-embed) | Добавлен `@april/profile-ui`, generated client, виджет с `onSaveSuccess` и локальный embed-demo |
| 024 модель документации виджетов | ✅ | [024](./task-story-024-phase-4-widget-docs-operating-model-and-project-ingestion) | Единая схема `profile -> widgets -> version/status`, каталог карточек и синхронизация docs/docs-site через чеклисты |
| 025 ProfilesListWidget + CRUD | ✅ | [025](./task-story-025-phase-4a-profile-profiles-list-crud-widget) | Добавлен виджет списка профилей с search/filter/pagination, CRUD и безопасной обработкой `401/403/409` |
| 027 ProfileInstancesWidget + CRUD | ✅ | [027](./task-story-027-phase-4a-profile-instances-crud-widget) | Добавлен виджет списка экземпляров в контексте `profileId`, CRUD и ABAC UX (`hidden/readonly/denied`) |
| 029 InstanceHistoryWidget + version diff | ✅ | [029](./task-story-029-phase-4a-profile-instance-history-widget) | Добавлен виджет истории версий экземпляра с таймлайном, просмотром снапшота и diff против previous/current |
| 031 ConflictQueueWidget + resolve/merge admin UI | ✅ | [031](./task-story-031-phase-4a-profile-conflicts-merge-admin-ui) | Очередь конфликтов authority с фильтрами, resolve и merge с подтверждением, UX для `401/403/409` и аудит-сводка после успеха |
| 032 Hub host conflicts + RBAC + e2e | ✅ | [032](./task-story-032-phase-4a-hub-conflicts-merge-host-rbac) | Маршрут и host-экран в AprilHub, BFF-вызовы admin API, Playwright (позитив/негатив), dev-пользователи Keycloak |
| 034 Hub release gates 4a widgets | ✅ | [034](./task-story-034-phase-4a-hub-widget-release-gates-smoke) | Документированный P0 gate + semver-скрипт в CI hub-shell, runbook rollback; Playwright — nightly/ручной прогон перед релизом |
| 036 Sentry rollout preparation (AprilProfile) | ✅ | [036](./task-story-036-phase-4b-profile-sentry-rollout-preparation) | Зафиксированы env-переменные, redaction/filtering policy, runbook rollout/rollback и cross-repo contract перед runtime внедрением |
| 039 File Service architecture docs | ✅ | [039](./task-story-039-file-service-architecture-docs) | В архитектуре закреплён отдельный `AprilFile`; границы с `AprilProfile` описаны в каноничных docs и docs-site |
| 040 widget-card layout modernization | ✅ | [040](./task-story-040-phase-5-widget-card-layout-modernization) | `ProfilesListWidget` переведён в 25/75 master-detail: `CardListColumn` слева, карточка справа, create через модалку, обновлены тесты |
| 041 Profiles widget extraction | ✅ | [041](./task-story-041-phase-5-widget-card-to-profiles-widget) | Из `widget-card` выделен продуктовый `ProfilesWidget` с отдельным экспортом, демо-маршрутом и обратной совместимостью через alias |
| 042 Profiles widget production-first baseline | ✅ | [042](./task-story-042-phase-6-profiles-widget-production-architecture) | Зафиксирован архитектурный hard-gate (`Core + ApiWidget + Facade`), provider-контракт и запрет demo-first anti-patterns для задач 043/044 |
| 043 Profiles widget API/SDK readiness | ✅ | [043](./task-story-043-phase-6-profiles-widget-api-list-contract-and-sdk) | Добавлен server-side list контракт (`search/filter/cursor/sort`), backend-реализация и regenerated SDK как gate для задачи 044 |
| 044 Profiles widget core/api refactor | ✅ | [044](./task-story-044-phase-6-profiles-widget-core-api-refactor) | `ProfilesWidget` переведён на архитектуру `Core + ApiWidget`, `entityIds` удалён из публичного контракта, демо и тесты мигрированы на server-side data flow |
| 045 Profiles widget contract/core hardening | ✅ | [045](./task-story-045-phase-6-profiles-widget-contract-and-core-hardening) | Контракт варианта C доведён до кода: `initialSort`/`autoSelectFirst`/`onOpenEntity`/`onError.code`, update передаёт `expectedVersion`, docs и тесты синхронизированы |
| 046 Profiles widget provider/abort/observability hardening | ✅ | [046](./task-story-046-phase-6-profiles-widget-provider-context-abort-observability-hardening) | `ProviderContext` стандартизирован, list/details запросы реально отменяются, убрана глобальная мутация OpenAPI runtime, добавлены transport telemetry события |
| 047 Profiles widget test matrix + release gate | ✅ | [047](./task-story-047-phase-6-profiles-widget-test-matrix-and-release-gate) | Зафиксирован обязательный release-gate variant C, добавлены provider integration tests и блокирующие критерии релиза в testing/release docs |
| 048–050 DS npm registry (Hub epic 049) | ✅ | [048–050](./task-story-048-phase-7-ds-npm-registry-consumption) | Vendored `@april/*` 0.1.0, CI `NODE_AUTH_TOKEN`, обновлены DESIGN_SYSTEM / DEPLOYMENT / TESTING и человекопонятная история |
| 051 Profiles widget embed UI + versions | ✅ | [051](./task-story-051-phase-6-profiles-widget-ui-refactor-embed-and-versions) | Flex-layout для хоста, версии и имя в UI, Select типов, иконки действий, расширение `ProfilesDataProvider` |
| 052 Entity type revisions (data model) | ✅ | [052](./task-story-052-phase-7-entity-type-revisions-data-model) | Семейства типов, immutable ревизии схемы, привязка `entities` к ревизии; миграции Atlas и ADR-0005 |
| 053 Entity type revisions (API) | ✅ | [053](./task-story-053-phase-7-entity-type-revisions-api) | OpenAPI + Go: каталог, draft/publish, ревизии, single/batch upgrade профилей; SDK |
| 054 `entity-types-widget` UI | ✅ | [054](./task-story-054-phase-7-entity-types-widget) | Production-first виджет Core+Api+facade, DS, telemetry, handoff подготовлен в репозитории |
| 055 Contracts + docs-site + Hub handoff docs | ✅ | [контракты](/docs/widget-contracts) §9, [handoff](https://github.com/ukituki-ps/april-profile/blob/develop/docs/integration/entity-types-widget-hub-handoff.md), отчёт `tasks/055-phase-7-entity-types-contract-docs-hub-handoff/REPORT.md` | Синхронизация `WIDGET_CONTRACTS` / чеклистов / каталога; три story-страницы 052–054; финальный handoff Hub/BFF |
