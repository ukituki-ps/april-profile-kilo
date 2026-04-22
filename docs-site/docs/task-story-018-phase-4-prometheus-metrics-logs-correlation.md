---
sidebar_position: 32
---

# 018 — Prometheus `/metrics`, логи под Loki, корреляция с AprilHub

## Что поменялось

- Появился публичный **`GET /metrics`**: отдаёт метрики в формате Prometheus на **том же порту**, что и REST (как в hub-bff в april-worker).
- Добавлены счётчик и гистограмма **`april_profile_http_*`** по методу, шаблону маршрута и коду ответа (без UUID в имени метрики).
- В каждом ответе — заголовки **`X-Request-Id`** и **`X-Correlation-Id`** (если клиент не прислал — сервис генерирует).
- В **логах** одной строки на запрос — поля **`requestId`** и **`correlationId`** (camelCase), как рекомендовано для выравнивания с Hub.
- Процесс `april-profile` пишет **структурные логи в JSON** на stdout — удобно для **Promtail → Loki**.

## Зачем это нужно

Центральный Prometheus и Loki в экосистеме April **не заходят внутрь** каждого репозитория с полным стеком: сервис только **отдаёт контракт** — метрики по HTTP и предсказуемые поля в логах. Тогда команда эксплуатации на стенде может зарегистрировать target в april-worker и искать логи по `requestId` без Grafana на первом шаге.

## Границы задачи

**Сделано:** экспорт метрик, корреляция заголовков/логов, документация в репозитории.

**Не входило:** дашборды Grafana, алерты, SLO — это задача **019** в Hub; регистрация YAML-target в репозитории april-worker — отдельным PR/runbook на стороне стенда.

## Как проверить без чтения кода

```bash
go vet ./...
go test ./...
make openapi-lint
make docs-build
```

После `docker compose` или `go run` с рабочим `HTTP_LISTEN_ADDR`:

```bash
curl -sS "http://127.0.0.1:8080/metrics" | head
```

В логах контейнера или терминала — JSON с ключами `requestId` и `correlationId`.

## Контракт с AprilHub

Кратко зафиксировано в `docs/OBSERVABILITY.md`: scrape `host:port` → `/metrics`, переменные `OBS_STAND_HOST:OBS_METRICS_PORT` (для Profile = порт API), правило не поднимать идентификаторы запроса в **labels** Loki.

## Официальные артефакты

- Постановка: `tasks/018-phase-4-prometheus-metrics-logs-correlation/TASK.md`
- План: `tasks/018-phase-4-prometheus-metrics-logs-correlation/PLAN.md`
- Отчёт: `tasks/018-phase-4-prometheus-metrics-logs-correlation/REPORT.md`
