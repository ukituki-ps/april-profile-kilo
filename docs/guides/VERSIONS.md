---
sidebar_position: 3
---

# Версии инструментов и зависимостей

Сводка для команды и агентов; **источник истины** для языков и пакетов — файлы манифестов в репозитории (`docs-site/package.json`, `frontend/package.json`, git submodule `design-system/DisignApril`, в будущем `go.mod`). Обновляйте эту таблицу при осознанном повышении major-версий.

| Компонент | Версия / диапазон | Где зафиксировано |
| --------- | ------------------- | ----------------- |
| Node.js | >= 18 (рекомендуется 20.x LTS для CI) | `docs-site/package.json` → `engines.node` |
| Docusaurus | 3.7.0 | `docs-site/package.json` → `@docusaurus/*` |
| React / React DOM | ^19.0.0 | `docs-site/package.json` |
| TypeScript | ~5.6.2 | `docs-site/package.json` |
| Redocly CLI | 1.25.0 | `Makefile` → цель `openapi-lint` |
| OpenAPI spec | 3.1.0 | `openapi/openapi.yaml` |
| Nginx (доки) | 1.27-alpine | `docker-compose.yml` |
| Swagger UI | v5.17.14 | `docker-compose.yml` |
| Structurizr Lite | 2024.03.03 | `docker-compose.yml` |
| Debian | 13 | целевой хост dev (`docs/AGENT_ARCHITECTURE_CONTEXT.md`) |
| PostgreSQL | 17 | целевой стек (`docs/AGENT_ARCHITECTURE_CONTEXT.md`) |
| Docker Compose | v2 | `docs/DEPLOYMENT_STRATEGY.md` |
| April Design System (`@april/tokens`, `@april/ui`) | submodule + `file:` в `frontend/` или semver в registry | [DisignApril](https://github.com/ukituki-ps/DisignApril) → `packages/*/package.json`; см. [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |
| pnpm (для `ds:prepare` в submodule) | как в DisignApril | `corepack enable`; lockfile submodule |
| Go | 1.24.x (см. `go.mod`, CI) | `go.mod` |
| Atlas CLI (миграции) | образ `arigaio/atlas:0.32.0` | `Makefile` → `ATLAS_IMAGE`, каталог `atlas/migrations/` |

### Backend / frontend приложения

Версии **Go** и образа **Atlas** для миграций — в таблице выше; при добавлении Temporal SDK и др. расширьте строки или зафиксируйте выгрузку из CI.
