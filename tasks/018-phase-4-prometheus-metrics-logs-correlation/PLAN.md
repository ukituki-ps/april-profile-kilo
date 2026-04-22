# План: Prometheus `/metrics`, логи под Loki, корреляция с Hub

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-22
- **Статус плана:** согласован с выполнением

## Исходные допущения

- Контракт scrape и логов — как в `TASK.md` (april-worker, hub-bff).
- `github.com/prometheus/client_golang` уже в зависимостях; `DefaultRegisterer` уже содержит Go/process collectors.
- Ошибки API остаются с полем `request_id` в JSON тела (OpenAPI).

## Порядок работ (шаги)

1. HTTP-метрики (`april_profile_http_*`) + `GET /metrics` через `promhttp` на существующем mux.
2. Middleware корреляции `X-Correlation-Id` + поля лога `requestId` / `correlationId`.
3. JSON `slog` в `app.Run` для stdout.
4. Документация `docs/OBSERVABILITY.md`, docs-site, отчёт, обновление `task_list.md`.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | `internal/httpapi/metrics.go`, `server.go`, `server_test.go`, `internal/app/run.go` |
| БД / Atlas | нет |
| Инфра / Compose | нет |
| Документация / OpenAPI | `docs/OBSERVABILITY.md`, README, docs-site; OpenAPI без `/metrics` |

## Риски и откат

- **Риск:** дублирование регистрации Prometheus collectors → **Митигация:** не регистрировать Go/process повторно; HTTP-метрики через `sync.Once`.
- **Риск:** высокая кардинальность `route` → **Митигация:** использовать `r.Pattern`, иначе `unknown`.
- Откат: revert PR.

## Проверка после выполнения

- `go vet ./...`, `go test ./...`, `go test -tags=integration ./internal/integrationtest/...`
- `make openapi-lint`, `make docs-build`

## Примечания

- Связано с [`019-phase-4-grafana-alerts-slo-hub-coordination`](../019-phase-4-grafana-alerts-slo-hub-coordination/).
