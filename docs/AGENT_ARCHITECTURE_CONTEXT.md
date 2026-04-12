# Архитектурный контекст для агента

## Стек (фиксировано)

- **Backend**: Go, REST, modular monolith
- **Workflow Engine**: Temporal (Go SDK, Workflow as Code)
- **Frontend**: React + TypeScript + Vite
- **UI Kit**: Mantine
- **Process Editor**: React Flow (`@xyflow/react`)
- **IAM**: Keycloak (RBAC источник ролей/прав)
- **DB**: PostgreSQL 17
- **Queue**: Redis + Asynq
- **Notifications**: Novu
- **Observability**: Promtail + Loki + Grafana, Prometheus
- **Нагрузочное тестирование**: k6 (сценарии API, baseline; детали в `TESTING_STRATEGY.md`)
- **Documentation**: Structurizr (C4 Model) + Docusaurus + ADR + OpenAPI
- **Infra**: Debian 13, Docker Compose, Nginx reverse proxy

Версии инструментов и образов — в [`guides/VERSIONS.md`](./guides/VERSIONS.md). Форк репозитория под новый сервис — [`guides/FORK_AND_CUSTOMIZE.md`](./guides/FORK_AND_CUSTOMIZE.md).

