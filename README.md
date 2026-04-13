# april_template

**Шаблон репозитория** для микросервисов экосистемы **April** (документация Docusaurus, OpenAPI, Structurizr, Docker Compose, CI, сценарий деплоя). Прикладной backend/frontend добавляется по мере разработки.

Один форк или копия репозитория = **один сервис** в экосистеме; внутри репозитория backend по умолчанию описывается как **модульный монолит** (см. [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md)), а не как «один микросервис на каждый пакет».

## Как использовать

1. Создайте новый репозиторий на GitHub (**Settings → General → Template repository**, если нужен именно шаблон) или скопируйте этот каталог.
2. Выполните подстановки по [`docs/guides/FORK_AND_CUSTOMIZE.md`](docs/guides/FORK_AND_CUSTOMIZE.md) и [`docs/guides/PROJECT_DEFAULTS.md`](docs/guides/PROJECT_DEFAULTS.md).
3. Зафиксируйте стек в [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md) и ведите задачи в [`tasks/`](tasks/README.md).

Примеры микросервисов на базе этого шаблона (отдельные репозитории): **aprilWflow**, **aprilNflow**, **aprilHHflow**. На машине разработчика они могут лежать рядом, например `~/april_template`, `~/aprilWflow`, `~/aprilNflow`, `~/aprilHHflow`.

## Быстрый старт

1. `cp .env.example .env` при необходимости.
2. `make docs-build`, `make openapi-lint`.
3. `make compose-up` после сборки статики — см. [`docs-site/docs/getting-started.md`](docs-site/docs/getting-started.md).

**CI:** `.github/workflows/ci.yml` — проверки на PR/push; деплой на dev — `.github/workflows/dev-deploy.yml` (self-hosted runner, см. `docs/DEPLOYMENT_STRATEGY.md`).

## Документация

| Документ | Содержание |
| -------- | ---------- |
| [`docs/guides/FORK_AND_CUSTOMIZE.md`](docs/guides/FORK_AND_CUSTOMIZE.md) | Чеклист при копировании шаблона |
| [`docs/guides/PROJECT_DEFAULTS.md`](docs/guides/PROJECT_DEFAULTS.md) | Плейсхолдеры хоста, путей, labels |
| [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md) | Стек и границы |
| [`docs/DEPLOYMENT_STRATEGY.md`](docs/DEPLOYMENT_STRATEGY.md) | Деплой на dev |
| [`docs/guides/DESIGN_SYSTEM.md`](docs/guides/DESIGN_SYSTEM.md) | Дизайн-система April (`@april/tokens`, `@april/ui`) |
| [`openapi/openapi.yaml`](openapi/openapi.yaml) | OpenAPI 3.1 |

## Лицензия

См. [`LICENSE`](LICENSE): шаблон **MIT** с плейсхолдерами — замените год и правообладателя под свой проект или выберите другую лицензию.
