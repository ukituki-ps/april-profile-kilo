---
sidebar_position: 2
---

# Быстрый старт (документация)

Команды выполняются из **корня репозитория** (где лежат `Makefile` и `docker-compose.yml`).

## Сборка сайта (Docusaurus)

```bash
make docs-build
# или: cd docs-site && npm ci && npm run build
```

Статика появляется в `docs-site/build/`.

## Локальный просмотр статики

```bash
cd docs-site && npm run serve
```

## Docker Compose: Nginx + OpenAPI + Swagger UI + Structurizr Lite

1. Соберите статику Docusaurus (`make docs-build`).
2. Поднимите стек:

```bash
docker compose up -d
```

Удобная альтернатива: **`make compose-up`** — собирает Docusaurus и поднимает Compose за один шаг. Если вызывать только `docker compose up` без предварительной сборки, `docs-site/build` может быть пустым.

По умолчанию (см. `.env.example`):

| URL | Назначение |
|-----|------------|
| http://localhost:8080/ | Собранный Docusaurus |
| http://localhost:8080/openapi/openapi.yaml | Спецификация OpenAPI сервиса (YAML) |
| http://localhost:8080/openapi/mail-gateway-openapi.yaml | Internal Mail Gateway API (внутренний REST над SMTP) |
| http://localhost:8080/swagger/ | Swagger UI (читает спецификацию с того же хоста) |
| http://localhost:8091/ | Structurizr Lite (модель C4 из `structurizr/workspace.dsl`) |

Structurizr вынесен на отдельный порт: веб-приложение Lite плохо переносит префикс за обратным прокси; отдельный порт зафиксирован как согласованный вариант bootstrap.

## Проверка OpenAPI

```bash
make openapi-lint
```

## Проверка Compose

```bash
make compose-config
```
