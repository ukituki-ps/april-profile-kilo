# April Profile — Agent Context

## Язык общения

ВСЕГДА отвечай на русском языке: сообщения в чат, комментарии, commit messages,报告和 планов. Исключение: имена файлов, переменные, ошибки — оставляй как есть.

## Before starting a task

1. Read `README.md` — product overview and quick start
2. Read `task_list.md` — current priorities and boundaries
3. Read `docs/AGENT_ARCHITECTURE_CONTEXT.md` — fixed stack and decision boundaries
4. Read `docs/DEPLOYMENT_STRATEGY.md` — merge policy, deploy workflow

## Fixed Stack

**Backend:** Go, REST, modular monolith, Temporal (Go SDK, Workflow as Code)
**Frontend:** React + TypeScript + Vite, Mantine, @april/ui (design-system from DisignApril)
**Process Editor:** React Flow (`@xyflow/react`)
**IAM:** Keycloak (RBAC — source of roles and permissions)
**DB:** PostgreSQL 17, Redis + Asynq (queue)
**Observability:** Promtail + Loki + Grafana, Prometheus, Sentry (via AprilHub in april-worker)
**Infra:** Debian 13, Docker Compose, Nginx reverse proxy
**Documentation:** Structurizr (C4), Docusaurus, ADR, OpenAPI

Do not replace these technologies without explicit request.

## Project Structure

- `cmd/april-profile/` — Go main (API server)
- `cmd/april-worker/` — Go main (Asynq worker)
- `internal/` — domain, services, handlers
- `frontend/` — React shell + @april/profile-ui package
- `frontend/packages/profile-ui/` — UI components
- `design-system/DisignApril/` — git submodule (DS source, @april/ui, @april/tokens)
- `docs/` — architecture, ADR, deployment, testing strategy
- `tasks/` — task folders (`NNN-slug/`) with TASK.md, PLAN.md, REPORT.md
- `openapi/` — OpenAPI 3.1 spec

## Code Conventions

### Go
- Run `gofmt` / `goimports` before commit
- Explicit error handling (`fmt.Errorf` with `%w` or project convention)
- `context.Context` as first argument where established
- Public API: short Go-style comments starting with symbol name
- Interfaces on consumer side; mocks/fakes for test dependencies
- REST: consistent HTTP statuses, OpenAPI contracts when maintained

### Temporal
- Workflow and Activity idiomatic to Go SDK; workflow determinism, side effects in activity
- Version workflows on changes per Temporal docs and repo practice

### TypeScript / React (Vite)
- Strict TypeScript as in project `tsconfig`
- Functional components and hooks
- UI: Mantine; flows: React Flow as established in the module
- Naming: consistency with existing folders (`components`, `features`, etc.)
- Accessibility and semantics per product requirements

### DS-First Policy
1. Check available components in `@april/ui` (DisignApril) before building custom UI
2. If a suitable DS component exists — use it, don't rebuild on raw Mantine
3. Custom UI allowed only when DS lacks needed API/behavior — document reason and trade-off in TASK.md and REPORT.md

### Comments
- Comment non-obvious code: invariants, integration constraints (Keycloak, queues)
- No commented-out dead code — use version control
- Language: follow existing codebase convention (Russian or English per module)
- UX text by default in Russian unless task specifies otherwise

### Security
- Secrets never in code; RBAC through Keycloak with server-side checks
- Don't weaken checks for local debugging without explicit request

## Git Workflow

- Do not push directly to protected branches (`main`, `develop`)
- Work in `feature/*` or `fix/*` branches
- Merge via PR with clear commit messages, test plan, and risks

## Task Execution

1. Check `task_list.md` before starting new work
2. Only take tasks with completed dependencies
3. Mark task as in-progress on start, done on completion
4. For non-trivial tasks: create `PLAN.md` per `docs/AGENT_PLAN_TEMPLATE.md`
5. Deliver end-to-end: analysis → code → tests → docs (if relevant) → commit
6. Run relevant tests before closing a task (see Testing below)
7. Final report per `docs/AGENT_REPORT_TEMPLATE.md` saved as `tasks/<NNN-slug>/REPORT.md`
8. Large tasks: break into subtasks if estimate exceeds a few hours

## Testing & Build Commands

```bash
# Go
make go-vet
make go-build
make migrate-validate
make migrate-apply        # with running PostgreSQL + DATABASE_URL
make integration-test     # requires Docker (Testcontainers)
make openapi-lint

# Frontend
make frontend-build       # DisignApril bundle + SPA
make frontend-lint        # TypeScript check + lint
make frontend-test        # Vitest + RTL tests (frontend/)

# Full stack
make compose-up           # after frontend/build docs
make compose-down
```

## Deployment

Follow `docs/DEPLOYMENT_STRATEGY.md`:
- Merge to `develop` via PR
- Images by git SHA in ghcr.io
- Dev server: `/opt/april`
- `images.env` update, migration order, then `docker compose up`
- Health check on internal port (`/healthz` if available)
- Rollback per DEPLOYMENT_STRATEGY; document failure reason in REPORT.md

## Documentation

- Stack and boundaries: `docs/AGENT_ARCHITECTURE_CONTEXT.md`
- Product design: `docs/DESIGN_AprilProfile.md`
- Frontend strategy: `docs/FRONTEND_STRATEGY.md`
- Widget contracts: `docs/WIDGET_CONTRACTS.md`
- ADR: `docs/adr/`
- OpenAPI: `openapi/openapi.yaml`
- C4 diagram: `structurizr/workspace.dsl`
- Testing: `docs/TESTING_STRATEGY.md`
- Deployment: `docs/DEPLOYMENT_STRATEGY.md`
- DS integration: `docs/guides/DESIGN_SYSTEM.md`
- Observability: `docs/OBSERVABILITY.md`

## Incident Triage

For debugging errors (Sentry, API failures): read `docs/AGENT_ERROR_TRIAGE_PROMPT.md`
Correlate: Sentry → Loki → Prometheus, follow before/after checklists.