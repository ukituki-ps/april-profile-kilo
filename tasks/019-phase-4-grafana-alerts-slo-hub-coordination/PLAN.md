# План: Дашборды Grafana, алерты и черновик SLO для AprilProfile (AprilHub)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-22
- **Статус плана:** черновик

## Исходные допущения
- Метрики AprilProfile уже экспортируются (`GET /metrics`) после задачи [`018-phase-4-prometheus-metrics-logs-correlation`](../018-phase-4-prometheus-metrics-logs-correlation/).
- Источник правды по observability для экосистемы — репозиторий **april-worker** и его `infra/observability/`.

## Порядок работ (шаги)
1. Убедиться, что target для Profile зарегистрирован в `infra/observability/overlays/targets/` (job Prometheus: **`aprilhub_dynamic_targets`**; labels: `env`, `host`, `stand`, **`service`** — см. [`018`](../018-phase-4-prometheus-metrics-logs-correlation/TASK.md) и [OBSERVABILITY_STACK_ONBOARDING.md](https://github.com/ukituki-ps/april-worker/blob/develop/docs/runbooks/OBSERVABILITY_STACK_ONBOARDING.md)). `instance` не задаётся в YAML вручную.
2. Проверить в Prometheus наличие рядов с префиксом метрик из **018** (например `april_profile_*`); при отсутствии — сеть до `OBS_STAND_HOST:OBS_METRICS_PORT`, target-файл или расширение scrape (ручная точка / follow-up в april-worker).
3. Добавить/обновить dashboard (HTTP + errors + latency + зависимости БД/Redis если доступны из метрик).
4. Добавить recording rules / alerts по согласованному минимуму.
5. Оформить **черновик SLO** (цели, запросы, окно) в docs april-worker.
6. PR в april-worker + описание rollback (удаление панелей/алертов).

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| AprilHub (april-worker) | Grafana dashboards, Prometheus rules/alerts, docs |
| AprilProfile | Только при несовпадении имён метрик — отдельный мини-PR |

## Риски и откат
- **Риск:** метрики переименованы в Profile → дашборд пустой. **Митигация:** зафиксировать контракт имён в задаче 018 и здесь в отчёте.
- **Откат:** revert PR в april-worker; алерты отключить в UI при инциденте шума.

## Проверка после выполнения
- В Grafana на dev видны панели с данными за последние N минут.
- `ALERTS` / firing в Prometheus согласованы с ожиданиями при инжекте ошибки (по runbook).
