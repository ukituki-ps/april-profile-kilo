# Задача: Фаза 4.1 (часть 1) — Prometheus `GET /metrics`, логи под Promtail/Loki, корреляция `request_id`

## Мета
- **ID / ветка:** (например `feat/phase-4-prometheus-metrics`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4**, подраздел **4.1 Платформа**, блок **«Сначала»** (метрики Prometheus, логи для Promtail/Loki, корреляция `request_id`).
- **Связанные подзадачи:** логически после [`008-phase-1-observability-config-readiness-deps`](../008-phase-1-observability-config-readiness-deps/) (структурные логи и `request_id`); перед [`019-phase-4-grafana-alerts-slo-hub-coordination`](../019-phase-4-grafana-alerts-slo-hub-coordination/). Связь с [`020-phase-4-profile-contract-behind-hub-bff`](../020-phase-4-profile-contract-behind-hub-bff/) — только косвенно (общий dev-контур).
- **Связанные документы:** [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md), [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- **AprilHub (контракт, согласовано с april-worker):** см. раздел ниже и ссылки на [april-worker](https://github.com/ukituki-ps/april-worker.git).

## Цель
В репозитории AprilProfile появляется **экспорт метрик Prometheus** на `GET /metrics`, логи остаются/дополняются так, чтобы их **удобно собирать Promtail → Loki**, а **`request_id`** однозначно связывает HTTP-запрос, лог-строки и (где применимо) метки/лейблы метрик — в соответствии с блоком «Сначала» фазы 4.1 в родительском [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).

## Контекст для агента
- Подраздел **4.1**, **«Сначала»** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Полный стек Grafana/Prometheus в этом репозитории **не** разворачивается — только **контракт экспорта** и полей логов под контур AprilHub ([`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md)).

## Контракт AprilHub / april-worker (зафиксировано для реализации)

Репозиторий Hub: [april-worker](https://github.com/ukituki-ps/april-worker.git). Индекс документации: [OBSERVABILITY_INDEX.md](https://github.com/ukituki-ps/april-worker/blob/develop/docs/guides/OBSERVABILITY_INDEX.md).

### Prometheus (scrape на dev)

- Один job **`aprilhub_dynamic_targets`**; targets через **file service discovery**: `infra/observability/overlays/targets/*.yml`, корневой конфиг: [`prometheus.yml`](https://github.com/ukituki-ps/april-worker/blob/develop/infra/observability/config/prometheus/prometheus.yml).
- В каждом target-файле задаются **labels:** `env`, `host`, `stand`, `service` и список **`targets`** вида `host:port` **без пути** (scrape идёт на стандартный путь, т.е. **`/metrics`** на том порту).
- **`instance`** вручную в YAML не задаётся — Prometheus выставляет из target (`host:port`). Отдельного label «команда» в контракте нет.
- Регистрация стенда: [`infra/observability/scripts/register-stand-target.sh`](https://github.com/ukituki-ps/april-worker/blob/develop/infra/observability/scripts/register-stand-target.sh) → файл `overlays/targets/<stand>-<service>.yml` с теми же четырьмя labels и `targets: ["<host>:<metrics_port>"]`. Пример в [OBSERVABILITY_STACK_ONBOARDING.md](https://github.com/ukituki-ps/april-worker/blob/develop/docs/runbooks/OBSERVABILITY_STACK_ONBOARDING.md) (стр. порядка ~14–22 в runbook).
- **Порт:** контракт **`http://<host>:<port>/metrics`**; отдельный metrics-only порт **не обязателен** — как в hub-bff, порт может совпадать с HTTP API (**`GET /metrics` на том же сервере**, что и REST).
- **Доступность для central Prometheus:** по [DEPLOYMENT_STRATEGY.md в april-worker](https://github.com/ukituki-ps/april-worker/blob/develop/docs/DEPLOYMENT_STRATEGY.md) scraper должен достучаться до **`OBS_STAND_HOST:OBS_METRICS_PORT`** (часто опубликованный порт контейнера / внутренняя сеть, не обязательно публичный URL за Nginx). Если `/metrics` доступен **только** через ingress `:443` с путём, текущий шаблон `host:port` **сам по себе** это не описывает — нужны либо **внутренний** scrape-адрес до процесса/порта, либо **расширение** scrape-конфига в april-worker (`metrics_path` / прокси на стороне observability); в репозитории april-worker это **не зафиксировано как единый стандарт** — любое отклонение от `host:port` → `/metrics` описать в **`REPORT.md`** (и при необходимости завести follow-up в april-worker).
- **Auth / allowlist для `/metrics`:** в репозитории april-worker **нет** задокументированных обязательных правил «только внутренняя сеть» или sidecar-auth для scrape; итоговую политику безопасности согласовать с владельцем стенда.

### Логи → Promtail → Loki

- **Корреляция с HTTP (как в hub-bff):** в логах — поля **`correlationId`** и **`requestId`** (camelCase); заголовки **`X-Correlation-Id`** и **`X-Request-Id`**; при отсутствии — генерация; ответ дополняется теми же заголовками (см. [metadata.go в hub-bff](https://github.com/ukituki-ps/april-worker/blob/develop/hub-bff/internal/http/metadata.go)). Для выравнивания с Hub **рекомендуется** те же имена полей в JSON-логах и те же заголовки в middleware; если в april-profile остаётся иной ключ (например snake_case в теле лога), явно зафиксировать в **`REPORT.md`** и в доке сервиса. Поле **`request_id` в теле ошибок OpenAPI** — про контракт API, не про имена полей в логах hub-bff.
- **Формат:** stdout/stderr, предпочтительно **JSON** ([infra/observability/README.md](https://github.com/ukituki-ps/april-worker/blob/develop/infra/observability/README.md), onboarding). Явного списка обязательных полей (`level`, `time`, …) в гайдах нет — достаточно структурированных ключей без PII.
- **Loki labels:** рекомендуемый набор в onboarding — `job`, `stand`, `host`, `service`, `container`, `stream`; часть выставляет Promtail/Docker, `stand`/`host` — remote agent из env. **Запрещено** использовать **`requestId` / `correlationId` / `userId` как Loki labels** — держать в **теле** лога и искать через `|=` в LogQL (кардинальность).

### Имена метрик (Prometheus)

- Отдельного внутреннего «metric naming guide» в april-worker для сторонних сервисов не выделено; **паттерн hub-bff:** namespace Prometheus **`hub_bff`** → метрики вида `hub_bff_http_requests_total` ([metrics.go](https://github.com/ukituki-ps/april-worker/blob/develop/hub-bff/internal/observability/metrics.go)). **Выравнивающий вариант для AprilProfile:** свой namespace (например **`april_profile`**), **без** динамических id в labels; учитывать кардинальность (в hub-bff в labels попадает в т.ч. `path`).

### Доп. ссылки (для `REPORT.md` и задачи 019)

- [OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md](https://github.com/ukituki-ps/april-worker/blob/develop/docs/guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md)
- [OBSERVABILITY_STACK_DEPLOY.md](https://github.com/ukituki-ps/april-worker/blob/develop/docs/runbooks/OBSERVABILITY_STACK_DEPLOY.md)
- [OBSERVABILITY_AGENT_PLAYBOOK.md](https://github.com/ukituki-ps/april-worker/blob/develop/docs/guides/OBSERVABILITY_AGENT_PLAYBOOK.md)
- [promtail.yml](https://github.com/ukituki-ps/april-worker/blob/develop/infra/observability/config/promtail/promtail.yml), каталог [agents/promtail](https://github.com/ukituki-ps/april-worker/tree/develop/infra/observability/agents/promtail)
- Baseline по hub-bff: [`tasks/006-hub-observability-operability/`](https://github.com/ukituki-ps/april-worker/tree/develop/tasks/006-hub-observability-operability) (`REPORT.md`, `RUNBOOK.md`), код [`observability.go`](https://github.com/ukituki-ps/april-worker/blob/develop/hub-bff/internal/http/observability.go)
- Auto-onboarding из деплоя: раздел **Auto-observability onboarding** в [DEPLOYMENT_STRATEGY.md](https://github.com/ukituki-ps/april-worker/blob/develop/docs/DEPLOYMENT_STRATEGY.md)

## Входит в объём
- HTTP-эндпоинт **`GET /metrics`** в формате Prometheus на **том же HTTP-сервере**, что и API (согласовано с april-worker: отдельный metrics-порт не требуется), стандартный registry или минимальный набор (process/go + HTTP при наличии middleware); **namespace метрик** — по паттерну hub-bff (например `april_profile_*`).
- Документирование **имён метрик**, кардинальности лейблов и **схемы логов** (README или `docs/`): соответствие scrape через **`aprilhub_dynamic_targets`** + `targets/*.yml` и правилам Loki выше.
- **Заголовки и поля корреляции:** проброс/генерация **`X-Request-Id`** и **`X-Correlation-Id`**; в JSON-логах — **`requestId`** / **`correlationId`** (camelCase), либо явное отклонение в `REPORT.md`.
- Регистрация маршрута в **OpenAPI** только если публичный контракт это предполагает (часто `/metrics` **вне** публичного OpenAPI — тогда явно описать в доке репозитория).

## Не входит в объём
- Дашборды Grafana, алерты, черновик SLO — задача [`019-phase-4-grafana-alerts-slo-hub-coordination`](../019-phase-4-grafana-alerts-slo-hub-coordination/) (**AprilHub** и согласование).
- Распределённый трейсинг (OpenTelemetry) — отдельная задача/ADR.
- Изменения в репозитории **april-worker** — только через отдельные задачи с пометкой AprilHub.

## Заглушки и внешние зависимости
- **До появления записи в `overlays/targets/*.yml` на стороне april-worker:** метрики проверяются локально/`curl` к `host:port/metrics`; отсутствие merge в Hub **не** блокирует merge в april-profile, если CI зелёный. После деплоя — onboarding через `register-stand-target.sh` или эквивалент по runbook Hub.
- **Mock:** при отсутствии Prometheus в compose april-profile — достаточно unit/integration теста, что эндпоинт отдаёт text exposition и `200 OK`.

## Технические ограничения
- Стек: Go modular monolith, REST — без смены ключевых технологий.
- **Atlas** для схемы БД — в этой задаче миграции **не обязательны**, если не добавляются новые таблицы под метрики (обычно не нужны).
- **Keycloak:** не логировать JWT целиком; tenant — только из доверенного контекста (наследие фазы 1).
- Секреты — только через env ([`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)).

## Критерии готовности (acceptance)
- [ ] `GET /metrics` на том же `host:port`, что и API, отдаёт валидный **Prometheus text exposition** (тест или скрипт).
- [ ] В доке репозитория указаны: **namespace метрик** (например `april_profile`), ожидаемые лейблы без высокой кардинальности, и как central Prometheus достучится до **`OBS_STAND_HOST:OBS_METRICS_PORT`** (или зафиксировано отклонение / необходимость доработки scrape в april-worker).
- [ ] Логи — **JSON** в stdout; корреляция с HTTP через **`X-Request-Id` / `X-Correlation-Id`** и поля **`requestId` / `correlationId`** в теле лога **или** явное отклонение и причина в `REPORT.md`.
- [ ] Учтено правило Loki: **не** поднимать `requestId` / `correlationId` / `userId` в **labels** Loki.
- [ ] `go vet ./...`, `go test ./...` зелёные; при изменении `openapi/openapi.yaml` — `make openapi-lint` и совместимость по политике CI.

## Проверка (команды)
```bash
go vet ./...
go test ./...

make openapi-lint
make docs-build

# Локально после compose up:
# curl -sS http://localhost:<port>/metrics | head
```

## Результат в отчёте
Список метрик и лейблов; пример `curl` к `http://<host>:<port>/metrics`; ссылка на PR; **блок «приняли / отклонили от контракта april-worker»** (например только ingress без прямого `:port` для Prometheus — и что делать дальше); follow-up для задачи **019** (дашборды в Hub) и при необходимости PR в april-worker для target/scrape.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана страница `docs-site/docs/task-story-018-phase-4-prometheus-metrics-logs-correlation.md`.
- [ ] В `docs-site/docs/task-stories-overview.md` добавлены пункт и строка статуса по задаче 018.
- [ ] На простом языке: зачем `/metrics` для AprilHub, что даёт команда эксплуатации, как проверить без Grafana.
- [ ] В конце страницы — ссылки на `tasks/018-phase-4-prometheus-metrics-logs-correlation/TASK.md`, `REPORT.md`.
