# Задача: Фаза 4.1 (часть 2) — дашборды, алерты и черновик SLO с командой AprilHub

## Мета
- **Репозиторий выполнения:** **AprilHub** — [`april-worker`](https://github.com/ukituki-ps/april-worker) (не AprilProfile). Задача заведена в **april-profile** как тикет-якорь для агента/команды; реализация — PR в **april-worker** (и связанных infra-репозиториях по практике Hub).
- **ID / ветка:** (в april-worker, например `feat/april-profile-observability-dashboards`)
- **Приоритет:** обычный
- **Родительская дорожная карта (контекст продукта):** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4**, подраздел **4.1 Платформа**, блок **«Затем»** (дашборды и алерты согласованы с командой Hub; черновик SLO).
- **Связанные подзадачи:** **зависит от** завершения [`018-phase-4-prometheus-metrics-logs-correlation`](../018-phase-4-prometheus-metrics-logs-correlation/) в AprilProfile (метрики и лог-поля существуют на dev). Опционально параллельно с [`020-phase-4-profile-contract-behind-hub-bff`](../020-phase-4-profile-contract-behind-hub-bff/) нет жёсткой блокировки, но для осмысленных панелей нужен **задеплоенный** профиль-сервис.
- **Связанные документы:** [OBSERVABILITY_INDEX.md в april-worker](https://github.com/ukituki-ps/april-worker/blob/develop/docs/guides/OBSERVABILITY_INDEX.md); контракт scrape/логов — в [`018`](../018-phase-4-prometheus-metrics-logs-correlation/TASK.md) (раздел «Контракт AprilHub / april-worker»); [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) в april-profile.

## Цель
На стороне **экосистемы AprilHub** согласованы и внедрены (или зафиксированы как MR с инструкцией мержа) **дашборды Grafana** и **алерты** для AprilProfile, плюс **черновик SLO** (доступность/latency/error budget на ключевых путях) — по блоку «Затем» фазы 4.1 в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).

## Контекст для агента
- Выполнять в репозитории **april-worker** ([`april-worker`](https://github.com/ukituki-ps/april-worker.git)), с согласованием datasource UID и folder в Grafana — по локальным правилам того репозитория.
- **Prometheus:** все динамические цели попадают в job **`aprilhub_dynamic_targets`**; различать AprilProfile в PromQL удобнее по **labels** из target-файла: `env`, `host`, `stand`, **`service`** (значение согласовать с именем при регистрации через [`register-stand-target.sh`](https://github.com/ukituki-ps/april-worker/blob/develop/infra/observability/scripts/register-stand-target.sh), например `april-profile`). **`instance`** = `host:port` из target (Prometheus выставляет сам).
- AprilProfile обеспечивает только **источник метрик/логов** (задача **018**); эта задача — **потребление** в общем контуре observability.

## Входит в объём
- Панели: HTTP rate/errors/latency для Profile по метрикам с namespace из **018** (например `april_profile_*`), базовые Go/runtime, при наличии — очередь/фон; фильтры Grafana — по `service` / `stand` / `env` из контракта targets.
- Алерты: минимум **доступность** (`/readyz` / ошибки 5xx) и **отсутствие временных рядов** для ожидаемых метрик (аналог «scrape down» для динамических целей).
- **Черновик SLO:** документ или раздел в существующем runbook (april-worker): цели, окно, чем измеряем (PromQL), что делаем при burn rate (ссылка на эскалацию — без автоматизации вне scope).

## Не входит в объём
- Изменение кода AprilProfile (кроме согласования имён метрик — тогда отдельный мини-PR в april-profile по договорённости).
- Финальный прод-SLO и error-budget политика организации — только черновик для dev/stage.

## Заглушки и внешние зависимости
- **До готовности dev-стенда Profile:** использовать **фиктивный datasource** или dashboard draft в JSON с пометкой «pending service»; зафиксировать в `REPORT.md` задачи.
- **Ручная контрольная точка:** доступ к Grafana/Prometheus в Hub, права на merge в april-worker, согласование с владельцами Hub (см. «Как вести работу с агентом» в родительском [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md)).

## Технические ограничения
- Не дублировать полный observability-стек april-profile — только интеграция с существующим Hub.
- Секреты datasource — только через механизмы april-worker/infra, не в этом репозитории.

## Критерии готовности (acceptance)
- [ ] В april-worker (или согласованном infra-репо) есть **merge-ready** изменения: dashboard JSON / Terraform / Helm — по принятому в Hub способу.
- [ ] Запросы к метрикам учитывают job **`aprilhub_dynamic_targets`** и labels **`env` / `host` / `stand` / `service`** из [`overlays/targets/*.yml`](https://github.com/ukituki-ps/april-worker/tree/develop/infra/observability/overlays/targets); задокументировано соответствие именам метрик из **018** (например `april_profile_*`).
- [ ] Алерты заведены с понятными сообщениями и ссылкой на runbook.
- [ ] Черновик SLO опубликован в согласованном месте docs april-worker.
- [ ] Прогон проверок april-worker на PR (по [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) того репозитория) — зелёный, либо в `REPORT.md` зафиксированы исключения и владелец.

## Проверка (команды)
```bash
# В клоне april-worker (пути и цели — по README того репозитория), например:
# make lint
# make test
# или эквивалент CI локально
```

## Результат в отчёте
Ссылки на PR в april-worker; скрин или UID дашборда; список алертов; краткий SLO; контакты согласования с Hub.

## Человекопонятная история в docs-site (обязательно)
- [ ] Если по политике april-profile требуется зеркальная story: страница `docs-site/docs/task-story-019-phase-4-grafana-alerts-slo-hub-coordination.md` с акцентом «работа в Hub, ссылка на PR».
- [ ] В `docs-site/docs/task-stories-overview.md` — строка по задаче 019.
- [ ] В конце — ссылки на `tasks/019-phase-4-grafana-alerts-slo-hub-coordination/TASK.md`, `PLAN.md`, `REPORT.md`.
