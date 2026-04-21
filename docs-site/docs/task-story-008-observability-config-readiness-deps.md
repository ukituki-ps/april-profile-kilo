---
sidebar_position: 22
---

# 008 — Структурированные логи, `request_id`, readiness от БД/Redis и env-конфиг

## Что поменялось

В этом шаге backend стал лучше наблюдаемым и предсказуемым при запуске:

- добавлен middleware для `X-Request-Id`: если заголовка нет, сервис генерирует его сам и прокидывает в ответ;
- добавлены структурированные HTTP-логи с полями `method`, `path`, `status`, `duration_ms`, `request_id` (и `tenant_id`, когда есть в контексте JWT);
- `GET /readyz` теперь реально проверяет PostgreSQL и Redis (ping) и отдаёт `503`, если зависимость недоступна;
- конфиг расширен обязательными env (`DATABASE_URL`, `REDIS_ADDR` в строгом режиме), а ошибки старта стали явными;
- для dev добавлен явный feature-flag `READYZ_ALLOW_WITHOUT_REDIS=true`, чтобы временно пропускать Redis в readiness.

## Зачем это команде

- Быстрее диагностика инцидентов: любой запрос можно найти в логах по `request_id`.
- Readiness перестал быть "формальным" и показывает реальную готовность сервиса.
- Ошибки конфигурации ловятся на старте, а не во время работы под нагрузкой.
- Контракт readiness синхронизирован в OpenAPI, что упрощает интеграцию и автоматические проверки.

## Границы задачи

Сделано в рамках 008:

- request-id middleware и структурные access-логи;
- readiness от фактических зависимостей (PostgreSQL/Redis);
- валидация env для backend-зависимостей;
- обновления `.env.example`, `docker-compose.yml`, OpenAPI и backend-тестов.

Осознанно оставлено на follow-up:

- экспорт метрик Prometheus (`/metrics`) — отдельная фаза 4.1;
- распределённый трейсинг (OpenTelemetry) — отдельная задача/ADR.

## Как проверить без чтения кода

```bash
go vet ./...
go test ./...
make openapi-lint
make docs-build
```

Ручной smoke:

1. Запустить зависимости: `docker compose --profile db up -d postgres redis`.
2. Поднять сервис с валидными env (`DATABASE_URL`, `REDIS_ADDR`, `KEYCLOAK_*`).
3. Вызвать `GET /readyz` — ожидается `200` и `{"status":"ready",...}`.
4. Остановить Redis или Postgres и снова вызвать `GET /readyz` — ожидается `503` и `{"status":"not_ready",...}`.
5. Вызвать любой endpoint и проверить, что в ответе есть `X-Request-Id`; в логах должна быть запись с тем же `request_id`.

## Официальные артефакты

- Постановка: `tasks/008-phase-1-observability-config-readiness-deps/TASK.md`
- План: `tasks/008-phase-1-observability-config-readiness-deps/PLAN.md`
- Отчёт: `tasks/008-phase-1-observability-config-readiness-deps/REPORT.md`
