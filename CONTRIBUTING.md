# Участие в разработке

Кратко: что запускать локально в зависимости от задачи. Стек и границы — [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md); версии инструментов — [`docs/guides/VERSIONS.md`](docs/guides/VERSIONS.md).

## Только документация и OpenAPI

Подходит для правок в `docs/`, `docs-site/`, `openapi/`, `structurizr/`.

```bash
make openapi-lint
make docs-build
cd docs-site && npm run serve   # опционально: просмотр собранной статики
```

## Документация в Docker (Nginx + Swagger UI + Structurizr Lite)

После `make docs-build` поднимаете compose из корня репозитория:

```bash
make compose-up
# или: docker compose up -d
```

URL по умолчанию — в [`docs-site/docs/getting-started.md`](docs-site/docs/getting-started.md) и `.env.example`.

## Форк шаблона под другой сервис

Чеклист замен имён, хостов и CI — [`docs/guides/FORK_AND_CUSTOMIZE.md`](docs/guides/FORK_AND_CUSTOMIZE.md).

## Задачи и отчёты для агентов

Правила в [`docs/AGENT_MASTER_PROMPT.md`](docs/AGENT_MASTER_PROMPT.md), список работ — [`task_list.md`](task_list.md), папки задач — [`tasks/README.md`](tasks/README.md).
