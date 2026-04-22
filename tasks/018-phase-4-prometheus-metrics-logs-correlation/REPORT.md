## 1) Итого

- Статус: ✅ выполнено
- Задача: Фаза 4.1 (часть 1) — Prometheus `GET /metrics`, логи под Promtail/Loki, корреляция с AprilHub
- Ветка: `feature/phase-4-prometheus-metrics-logs-correlation`
- Коммиты: см. `git log --oneline` на ветке `feature/phase-4-prometheus-metrics-logs-correlation` (один коммит с сообщением, начинающимся на `feat(observability):`)
- PR: не создавался (создать из ветки в GitHub по политике репозитория)

## 2) Что сделано

- **[backend]** Публичный `GET /metrics` на общем HTTP-сервере; счётчик `april_profile_http_requests_total` и гистограмма `april_profile_http_request_duration_seconds` с лейблами `method`, `route` (шаблон `net/http`), `status`; регистрация один раз через `sync.Once` на `prometheus.DefaultRegisterer` (Go/process уже в client_golang).
- **[backend]** Middleware `X-Correlation-Id` (генерация и ответ); в access-log поля **`requestId`** и **`correlationId`** (camelCase); заголовок **`X-Request-Id`** без изменения контракта.
- **[backend]** `cmd/april-profile` через `internal/app`: **JSON**-логи на stdout (`slog.NewJSONHandler`).
- **[docs]** Новый `docs/OBSERVABILITY.md` (namespace, лейблы, scrape `OBS_STAND_HOST:OBS_METRICS_PORT`, правило Loki по labels); строка в таблице README.
- **[docs-site]** Страница «на пальцах» и обновление `task-stories-overview.md`.
- **[process]** `PLAN.md`, обновлены критерии в `TASK.md`, `task_list.md`.

## 3) Изменённые файлы

- `internal/httpapi/metrics.go` (новый)
- `internal/httpapi/server.go`
- `internal/httpapi/server_test.go`
- `internal/app/run.go`
- `docs/OBSERVABILITY.md` (новый)
- `README.md`
- `tasks/018-phase-4-prometheus-metrics-logs-correlation/TASK.md`
- `tasks/018-phase-4-prometheus-metrics-logs-correlation/PLAN.md` (новый)
- `tasks/018-phase-4-prometheus-metrics-logs-correlation/REPORT.md` (новый)
- `docs-site/docs/task-story-018-phase-4-prometheus-metrics-logs-correlation.md` (новый)
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Какие таблицы/индексы изменены: —
- Обратимость: да (revert PR)

## 5) Проверка качества

- Линтер: ok (`go vet ./...`)
- Сборка: ok (`make docs-build`)
- Unit tests: ok (`go test ./...`)
- Integration tests: ok (`go test -tags=integration ./internal/integrationtest/...`)
- E2E / smoke: не запускался (деплой в задаче не требовался)

Команды (фактически выполненные):

```bash
gofmt -w internal/httpapi/metrics.go internal/httpapi/server.go internal/httpapi/server_test.go internal/app/run.go
go vet ./...
go test ./...
go test -tags=integration ./internal/integrationtest/...
make openapi-lint
make docs-build
```

## 6) Деплой

- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не проверялось на стенде
- Rollback: нет

## 7) Риски и ограничения

- **`/metrics` без отдельной авторизации** — как в постановке april-worker: политику сети/access решать на стенде.
- **Корреляция лог ↔ метрики:** в Prometheus-лейблы `requestId` не выносились (кардинальность); связка — по времени и поиску в Loki по полю в теле лога.
- **OpenAPI:** поле `request_id` в JSON ошибок API сохранено; в логах — `requestId` по контракту Hub (задокументировано в `docs/OBSERVABILITY.md`, отклонение от единого ключа в теле ошибок осознанное).
- **Контракт april-worker:** приняты один порт HTTP + `GET /metrics`, JSON stdout, заголовки и camelCase в логах, namespace `april_profile_*`, правило по labels Loki. По scrape: для типичного compose/dev достаточно `host:port`; если на стенде только ingress `:443` без прямого порта к процессу — нужен внутренний scrape или доработка конфига в april-worker (см. `TASK.md`).

## 8) Что осталось

- [ ] Задача **019** в april-worker: дашборды Grafana, алерты, черновик SLO.
- [ ] После деплоя на стенд: регистрация target (`register-stand-target.sh` или эквивалент) в `overlays/targets/*.yml` в april-worker при необходимости отдельным PR в Hub.
