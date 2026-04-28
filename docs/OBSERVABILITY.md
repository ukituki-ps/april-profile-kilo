# Наблюдаемость AprilProfile (Prometheus, логи, AprilHub)

Сервис вписывается в **централизованный контур AprilHub** (репозиторий [april-worker](https://github.com/ukituki-ps/april-worker)): полный стек Grafana/Prometheus/Loki **не** копируется в этот репозиторий; здесь — только экспорт метрик и формат логов. Индекс документации Hub: [OBSERVABILITY_INDEX.md](https://github.com/ukituki-ps/april-worker/blob/develop/docs/guides/OBSERVABILITY_INDEX.md).

Архитектура error telemetry для AprilProfile (слои Sentry/Loki/Prometheus, корреляция и redaction) описана отдельно: [`docs/ERROR_TELEMETRY_MODEL.md`](./ERROR_TELEMETRY_MODEL.md).

## Prometheus: `GET /metrics`

- Эндпоинт **`GET /metrics`** на **том же** TCP-порту, что и REST (`HTTP_LISTEN_ADDR`, по умолчанию `:8080`). Отдельный metrics-only порт не требуется.
- Формат ответа — **Prometheus text exposition** (`Content-Type: text/plain; version=0.0.4; …`).
- **OpenAPI:** маршрут `/metrics` в публичную спецификацию **не** включён (операционный контракт, не доменный API).

### Имена метрик (namespace `april_profile`)

| Метрика | Тип | Лейблы | Назначение |
|--------|-----|--------|------------|
| `april_profile_http_requests_total` | counter | `method`, `route`, `status` | Число HTTP-запросов. `route` — шаблон маршрута из `net/http` (Go 1.22+), например `GET /v1/entities/{entityID}`; без сырого `entity_id` в имени метрики. |
| `april_profile_http_request_duration_seconds` | histogram | те же | Длительность запроса, секунды. |

Дополнительно на стандартном registry клиента Prometheus уже есть **runtime/process** метрики (`go_*`, `process_*`).

Кардинальность: в лейблы **не** попадают `tenant_id`, UUID сущностей, `requestId` / `correlationId`.

### Регистрация target в Hub (scrape)

В april-worker job **`aprilhub_dynamic_targets`** и file SD `infra/observability/overlays/targets/*.yml` задают `targets: ["<host>:<port>"]` без пути — scrape идёт на **`/metrics`** этого порта.

Для центрального Prometheus (см. [DEPLOYMENT_STRATEGY.md в april-worker](https://github.com/ukituki-ps/april-worker/blob/develop/docs/DEPLOYMENT_STRATEGY.md)) scraper должен достучаться до **`OBS_STAND_HOST:OBS_METRICS_PORT`**. Для AprilProfile это **тот же порт**, что и HTTP API (часто опубликованный порт контейнера backend, например `BACKEND_HTTP_PORT` в compose на хосте, или внутренняя сеть до `:8080`). Если `/metrics` доступен **только** через HTTPS ingress с нестандартным путём, шаблон `host:port` без доработки scrape в april-worker может не подойти — зафиксируйте отклонение в отчёте задачи и согласуйте follow-up в Hub.

Политика доступа к `/metrics` (сеть, allowlist) — на стороне владельца стенда; в april-worker обязательного sidecar-auth для scrape не зафиксировано.

## Логи (stdout, JSON)

- Приложение `april-profile` выставляет **`slog`** с **`JSONHandler` на stdout** при старте (`internal/app/run.go`).
- Строка одного HTTP-запроса (middleware после ответа): поля **`requestId`**, **`correlationId`** (camelCase), плюс `method`, `path`, `status`, `duration_ms`, при наличии в контексте — `tenant_id`.
- Заголовки запроса/ответа: **`X-Request-Id`**, **`X-Correlation-Id`**. Если клиент не прислал — сервис генерирует значения и возвращает их в ответе.
- Тело **ошибок JSON API** по-прежнему использует ключ **`request_id`** (контракт OpenAPI) — это не имена полей в строках лога Hub.

### Loki / Promtail

В onboarding Hub для логов рекомендованы **labels** уровня `job`, `stand`, `host`, `service`, `container`, `stream`. **`requestId` / `correlationId` / `userId` в labels Loki поднимать нельзя** (высокая кардинальность) — эти поля остаются **в JSON-теле** строки; поиск в LogQL через фильтры по содержимому (`|=`), а не через отдельный label на каждый запрос.

## Проверка без Grafana

```bash
curl -sS "http://127.0.0.1:8080/metrics" | head -n 30
```

После запроса к API в логах контейнера должны быть JSON-строки с `requestId` и `correlationId`.

## Sentry runtime telemetry

Runtime-интеграция Sentry для AprilProfile подключена в backend и frontend-контуре:

- **Backend (`cmd/april-profile`)**:
  - инициализация через `internal/telemetry/sentry.go` и `internal/app/run.go`;
  - HTTP panic-capture (middleware Sentry) и capture `5xx` через `withRequestLogging`;
  - теги события: `service=april-profile`, `requestId`, `correlationId`, `http.status_code`;
  - redaction в `BeforeSend`: удаляются `Authorization`/`Cookie`, убирается query-string URL, не отправляются сырые request body.
- **Frontend (`frontend/src`)**:
  - инициализация SDK в `src/sentry.ts` из `VITE_SENTRY_*` переменных;
  - события ошибок виджетов (`save_failed`) отправляются через `onObservability` callbacks и содержат `request_id`/`correlation_id`/`api_request_id`;
  - в `beforeSend` убираются auth/cookie заголовки и query-string URL.

### Контракт корреляции с AprilHub

- `requestId` и `correlationId` остаются основными связующими полями между Sentry, JSON-логами (Loki) и метриками.
- `api_request_id` из ответа backend дополнительно сохраняется в telemetry-событиях frontend-виджетов.
- Для incident triage дополнительно обязательны поля `tenant`, `route`, `module/widget` и `service=april-profile` (см. `ERROR_TELEMETRY_MODEL.md`).
- Политика redaction и rollout-последовательность поддерживаются runbook-ом:
  `docs/runbooks/APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md`.
- Пошаговый incident flow (`Sentry -> Loki/Grafana -> root cause`) описан в:
  `docs/runbooks/APRILPROFILE_ERROR_TELEMETRY_TRIAGE.md`.

## Связанные задачи

- Реализация: [`tasks/018-phase-4-prometheus-metrics-logs-correlation/`](../tasks/018-phase-4-prometheus-metrics-logs-correlation/TASK.md).
- Дашборды и SLO в Hub: [`tasks/019-phase-4-grafana-alerts-slo-hub-coordination/`](../tasks/019-phase-4-grafana-alerts-slo-hub-coordination/). После merge в april-worker: дашборд Grafana **AprilProfile Service Overview** (UID `april-profile-service-overview`), правила `aprilprofile-alerts.yml`, runbook `docs/runbooks/APRILPROFILE_SLO_DRAFT.md` — см. [PR #28](https://github.com/ukituki-ps/april-worker/pull/28).
- Подготовка Sentry для AprilProfile: [`tasks/036-phase-4b-profile-sentry-rollout-preparation/`](../tasks/036-phase-4b-profile-sentry-rollout-preparation/TASK.md).
- Runtime внедрение Sentry/error telemetry: [`tasks/037-phase-4c-execute-external-task-038-april-work/`](../tasks/037-phase-4c-execute-external-task-038-april-work/TASK.md).
- Архитектура и документация error telemetry (external task 039): [`tasks/038-phase-4d-execute-external-task-039-april-work/`](../tasks/038-phase-4d-execute-external-task-039-april-work/TASK.md).
