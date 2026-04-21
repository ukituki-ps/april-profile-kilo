# April Profile

**AprilProfile** — микросервис **централизованных версионируемых профилей сущностей** в экосистеме **April** (полиморфная модель: персонал, оргединицы, клиенты, проекты, договоры и др.; см. [`docs/DESIGN_AprilProfile.md`](docs/DESIGN_AprilProfile.md)). Репозиторий ведёт документацию Docusaurus, OpenAPI, Structurizr, Docker Compose, CI и сценарий деплоя. **Дизайн-система April** подключена через git submodule и минимальный shell в **`frontend/`** (см. [`docs/guides/DESIGN_SYSTEM.md`](docs/guides/DESIGN_SYSTEM.md)); прикладной backend добавляется по мере разработки.

Репозиторий создан из шаблона [april_template](https://github.com/ukituki-ps/april_template). Граница: **один репозиторий = один сервис**; внутри допустим **модульный монолит** (см. [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md)).

## Общая инфраструктура (AprilHub)

Микросервисы экосистемы April **подключаются к общему инфраструктурному контуру AprilHub** (наблюдаемость, процессы onboarding на стенды и связанные практики). Каноничное описание и артефакты — в репозитории [april-worker](https://github.com/ukituki-ps/april-worker). В репозитории отдельного сервиса достаточно интеграции (метрики, логи, регистрация targets) по runbook'ам оттуда; **полный стек observability не копируется** в каждый репозиторий без отдельного архитектурного решения. Чеклист — в [`docs/guides/FORK_AND_CUSTOMIZE.md`](docs/guides/FORK_AND_CUSTOMIZE.md#8-общая-инфраструктура-aprilhub).

## Разработка

1. Пройти оставшиеся подстановки по [`docs/guides/FORK_AND_CUSTOMIZE.md`](docs/guides/FORK_AND_CUSTOMIZE.md) и [`docs/guides/PROJECT_DEFAULTS.md`](docs/guides/PROJECT_DEFAULTS.md) (хосты, деплой, при необходимости переименование в OpenAPI/Docusaurus).
2. Вести стек и продукт в [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md), дизайн модуля в [`docs/DESIGN_AprilProfile.md`](docs/DESIGN_AprilProfile.md), фронтенд и Hub в [`docs/FRONTEND_STRATEGY.md`](docs/FRONTEND_STRATEGY.md), гибрид UI (Host / Widget / API–BFF) и контракты в [`docs/WIDGET_CONTRACTS.md`](docs/WIDGET_CONTRACTS.md) и [`docs/DECISION_MATRIX_UI_INTEGRATION.md`](docs/DECISION_MATRIX_UI_INTEGRATION.md), ADR в [`docs/adr/`](docs/adr/) и задачи в [`tasks/`](tasks/README.md).

**Репозиторий:** [github.com/ukituki-ps/april-profile](https://github.com/ukituki-ps/april-profile)

## Быстрый старт

1. Клон с submodule: `git clone --recurse-submodules <url>` или после clone: `git submodule update --init --recursive`.
2. `cp .env.example .env` при необходимости.
3. `make docs-build`, `make openapi-lint`, `make frontend-build` (сборка DisignApril + SPA в `frontend/`).
4. Backend (Go): `make go-vet`, `make go-build`; миграции БД — `make migrate-validate`, при поднятой PostgreSQL и `DATABASE_URL` — `make migrate-apply` (Atlas в Docker, см. [`docs/guides/VERSIONS.md`](docs/guides/VERSIONS.md)). Интеграционные тесты с контейнерами БД/Redis: `make integration-test` (требуется Docker).
5. **JWT Keycloak (backend):** для `go run ./cmd/april-profile` задайте в окружении `KEYCLOAK_JWKS_URL`, `KEYCLOAK_ISSUER`, `KEYCLOAK_AUDIENCE` (см. [`.env.example`](.env.example) и [`docs/keycloak-stand-coordinates.md`](docs/keycloak-stand-coordinates.md)). Идентификатор тенанта для защищённых маршрутов берётся из claim access token (по умолчанию имя claim — `tenant_id`, см. `KEYCLOAK_TENANT_CLAIM`), не из query или body. Обзор правил — [`docs/auth-jwt-keycloak-adapted.md`](docs/auth-jwt-keycloak-adapted.md).
6. `make compose-up` после сборки статики — см. [`docs-site/docs/getting-started.md`](docs-site/docs/getting-started.md).

**CI:** `.github/workflows/ci.yml` — OpenAPI (в т.ч. обратная совместимость через `scripts/check-openapi-compat.sh`), lint OpenAPI, сборка Docusaurus, **Go** (`go vet`, `go build`), **Atlas** (`migrate validate`), **frontend** (DS + shell); `.github/workflows/bootstrap-ci.yml` — облегчённый прогон для `feature/*` / `fix/*` (доки + compose + Go + Atlas + frontend). Деплой на dev — `.github/workflows/dev-deploy.yml` (self-hosted runner, см. `docs/DEPLOYMENT_STRATEGY.md`). Подробнее — [`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md).

**Процесс и стенд:** merge в `develop` — через PR; **branch protection** и секреты/переменные GitHub — чеклисты в [`docs/DEPLOYMENT_STRATEGY.md`](docs/DEPLOYMENT_STRATEGY.md) (§1a, §3). **Smoke после деплоя** на dev — §9 того же документа (фаза 0: инфраструктура и HTTP-доки; после появления API — health и сценарии из [`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md)).

**Приватный submodule DisignApril:** в GitHub → **Settings → Secrets and variables → Actions** задан секрет **`SUBMODULES_TOKEN`** (PAT с `Contents: Read` на `ukituki-ps/DisignApril`). Workflows передают его в `actions/checkout` для `git submodule`; если секрет не задан, используется `github.token` (достаточно для публичного submodule). Для форков скопируйте секрет или замените submodule на свой источник.

## Документация

| Документ | Содержание |
| -------- | ---------- |
| [`structurizr/workspace.dsl`](structurizr/workspace.dsl) | C4 (Structurizr Lite): контекст и контейнеры AprilProfile |
| [`docs/DESIGN_AprilProfile.md`](docs/DESIGN_AprilProfile.md) | Дизайн модуля: назначение, границы, мультитенантность, модель данных |
| [`docs/FRONTEND_STRATEGY.md`](docs/FRONTEND_STRATEGY.md) | Фронтенд: три модели интеграции UI, AprilHub, контракты, чеклист |
| [`docs/ui-integration-governance.md`](docs-site/docs/ui-integration-governance.md) (на сайте: раздел «Гибридная интеграция UI») | Индекс: контракты виджетов, матрица решений, версионирование, чеклисты, observability |
| [`docs/WIDGET_CONTRACTS.md`](docs/WIDGET_CONTRACTS.md) | HostContext / Widget Props / Events v1 |
| [`docs/adr/`](docs/adr/) | ADR (в т.ч. 0002–0004: продукт AprilProfile и гибрид UI) |
| [`docs/guides/FORK_AND_CUSTOMIZE.md`](docs/guides/FORK_AND_CUSTOMIZE.md) | Чеклист при копировании шаблона |
| [`docs/guides/PROJECT_DEFAULTS.md`](docs/guides/PROJECT_DEFAULTS.md) | Плейсхолдеры хоста, путей, labels |
| [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md) | Стек и границы |
| [`docs/DEPLOYMENT_STRATEGY.md`](docs/DEPLOYMENT_STRATEGY.md) | Деплой на dev |
| [`docs/guides/DESIGN_SYSTEM.md`](docs/guides/DESIGN_SYSTEM.md) | Дизайн-система April (`@april/tokens`, `@april/ui`) |
| [`openapi/openapi.yaml`](openapi/openapi.yaml) | OpenAPI 3.1 |
| [`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md) | Уровни тестов и связь с CI |

## Лицензия

См. [`LICENSE`](LICENSE): шаблон **MIT** с плейсхолдерами — замените год и правообладателя под свой проект или выберите другую лицензию.
