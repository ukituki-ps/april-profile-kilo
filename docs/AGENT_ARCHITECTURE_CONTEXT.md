# Архитектурный контекст для агента

## Стек (фиксировано)

- **Backend**: Go, REST, modular monolith
- **Workflow Engine**: Temporal (Go SDK, Workflow as Code)
- **Frontend**: React + TypeScript + Vite
- **UI Kit**: Mantine; дизайн-система April — пакеты **`@april/tokens`**, **`@april/ui`** ([DisignApril](https://github.com/ukituki-ps/DisignApril) как **git submodule** `design-system/DisignApril`, прикладной shell в **`frontend/`**, см. [`guides/DESIGN_SYSTEM.md`](./guides/DESIGN_SYSTEM.md))
- **Process Editor**: React Flow (`@xyflow/react`)
- **IAM**: Keycloak (RBAC источник ролей/прав)
- **DB**: PostgreSQL 17
- **Queue**: Redis + Asynq
- **Notifications**: собственный микросервис AprilNflow (Go + React Flow)
- **Observability**: Promtail + Loki + Grafana, Prometheus + Sentry runtime telemetry — в экосистеме April **общий централизованный контур** задаётся **AprilHub** (репозиторий [april-worker](https://github.com/ukituki-ps/april-worker): `infra/observability/`, runbook'и в `docs/`). Точка входа в контракты и пути к конфигам — [`OBSERVABILITY_INDEX.md` в april-worker](https://github.com/ukituki-ps/april-worker/blob/develop/docs/guides/OBSERVABILITY_INDEX.md). Сервис в april-profile экспортирует `GET /metrics` (Prometheus), пишет JSON в stdout и использует Sentry как incident-layer по модели [`ERROR_TELEMETRY_MODEL.md`](./ERROR_TELEMETRY_MODEL.md); **полный observability-стек в этот репозиторий не копируется**.
- **Нагрузочное тестирование**: k6 (сценарии API, baseline; детали в [`./TESTING_STRATEGY.md`](./TESTING_STRATEGY.md))
- **Documentation**: Structurizr (C4 Model) + Docusaurus + ADR + OpenAPI
- **Infra**: Debian 13, Docker Compose, Nginx reverse proxy

Граница: **один репозиторий = один сервис**; внутри репозитория допустим **модульный монолит** (не путать с «микросервисом на каждый модуль»).

## Продукт (AprilProfile)

Этот репозиторий — **AprilProfile**: централизованное версионируемое хранилище **профилей сущностей** расширяемых типов (не только HR), с мультитенантностью, REST и событиями. Инварианты и границы с экосистемой — в [`DESIGN_AprilProfile.md`](./DESIGN_AprilProfile.md); существенные решения — в [`adr/`](./adr/) (ADR-0002, ADR-0003). C4 (контекст и контейнеры) — [`structurizr/workspace.dsl`](../structurizr/workspace.dsl). Фронтенд (AprilHub, админка, пакеты UI) — [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md).

Версии инструментов и образов — в [`guides/VERSIONS.md`](./guides/VERSIONS.md). Форк репозитория под новый сервис — [`guides/FORK_AND_CUSTOMIZE.md`](./guides/FORK_AND_CUSTOMIZE.md).
