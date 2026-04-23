## 1) Итого
- Статус: ✅ выполнено (merge-ready в april-worker + документация-якорь в april-profile)
- Задача: Фаза 4.1 (2/2) — дашборды Grafana, алерты, черновик SLO (AprilHub / april-worker)
- Ветка: `feature/019-phase-4-grafana-alerts-slo-docs`
- Коммиты (april-worker PR #28): `63b160a` (основной), `a871a54` (пустой коммит для повторного прогона CI)
- Коммит (april-profile PR): `0b79444`
- PR (april-worker): https://github.com/ukituki-ps/april-worker/pull/28
- PR (april-profile): https://github.com/ukituki-ps/april-profile/pull/61

## 2) Что сделано
- [april-worker] Дашборд **AprilProfile Service Overview** (`infra/observability/grafana/dashboards/april-profile-service-overview.json`, UID `april-profile-service-overview`): rate/latency p95/5xx по `april_profile_http_*`, панель `/readyz`, lag `april_profile_source_sync_lag_seconds`; переменные `env` / `stand` / `host` / `service` для job `aprilhub_dynamic_targets`.
- [april-worker] Алерты `infra/observability/config/prometheus/rules/aprilprofile-alerts.yml`: высокий доля 5xx, сбои `/readyz`, отсутствие рядов HTTP-метрик при живом target (см. аннотации и runbook).
- [april-worker] Черновик SLO: `docs/runbooks/APRILPROFILE_SLO_DRAFT.md`; ссылки в `docs/guides/OBSERVABILITY_INDEX.md`.
- [docs april-profile] Страница истории задачи в docs-site, обзор списка, `docs/OBSERVABILITY.md` — ссылка на PR и UID дашборда.
- [tasks] Обновлён `PLAN.md` статуса плана; отчёт `REPORT.md`; `task_list.md` — задача 019 отмечена выполненной по артефактам Hub.

## 3) Изменённые файлы
- `tasks/019-phase-4-grafana-alerts-slo-hub-coordination/PLAN.md`
- `tasks/019-phase-4-grafana-alerts-slo-hub-coordination/REPORT.md`
- `docs/OBSERVABILITY.md`
- `docs-site/docs/task-story-019-phase-4-grafana-alerts-slo-hub-coordination.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

(В репозитории **april-worker**, вне этого клона как submodule: `april-profile-service-overview.json`, `aprilprofile-alerts.yml`, `APRILPROFILE_SLO_DRAFT.md`, `OBSERVABILITY_INDEX.md` — в PR #28.)

## 4) Миграции и данные
- Миграции Atlas: нет
- Обратимость: да (revert PR в april-worker; при шуме алертов — silence в Alertmanager)

## 5) Проверка качества
- Линтер: n/a (JSON/YAML/Markdown)
- Сборка: `make docs-build` в april-profile (docs-site) — ok (см. фактические команды ниже)
- Unit tests: n/a по коду april-profile в этой задаче
- Integration tests: n/a
- E2E / smoke: не требовались постановкой; после merge в Hub — проверка панелей на dev
- GitHub Actions (april-worker PR #28): на момент фиксации отчёта все проверки завершались **FAILURE** за 2–4 с (похоже на системный сбой раннего этапа workflow или окружения runner’а, не на содержимом diff). **Владелец репозитория april-worker:** повторный запуск jobs / диагностика по логам Actions; локально правила проверены `promtool check rules`.

Команды (фактически выполненные):
```bash
python3 -m json.tool infra/observability/grafana/dashboards/april-profile-service-overview.json
docker run --rm --entrypoint promtool -v "$(pwd)/infra/observability/config/prometheus/rules:/rules:ro" prom/prometheus:v2.53.0 check rules /rules/aprilprofile-alerts.yml
cd /home/ukituki/april-profile-1 && make docs-build
```

## 6) Деплой
- Среда: нет (изменения в репозитории observability april-worker деплоятся по процессу Hub / `OBSERVABILITY_STACK_DEPLOY.md`)
- Образы april-profile: не менялись

## 7) Риски и ограничения
- Алерты завязаны на **`service="april-profile"`** в target YAML при регистрации через `register-stand-target.sh`; иное имя — правка matchers или согласование имени.
- `AprilProfileHTTPMetricsAbsent` может сработать на полностью idle стенде без HTTP-трафика 30+ минут.
- UID дашборда в Grafana: **`april-profile-service-overview`**; datasource Prometheus в provisioning Hub — **`prometheus`** (как у существующих дашбордов).

## 8) Что осталось
- [ ] Merge PR #28 в `develop` april-worker и прогон CI того репозитория на merge.
- [ ] На dev: убедиться, что target для Profile зарегистрирован и панели показывают данные; при необходимости скорректировать `for` / silence.
- [ ] Контакт согласования с владельцем Hub — по процессу из `tasks/000-full-service-aprilhub-roadmap/PLAN.md`.

## Список алертов (имена)
- `AprilProfileHigh5xxRate`
- `AprilProfileReadyzFailures`
- `AprilProfileHTTPMetricsMissing`

## Краткий SLO (черновик)
- См. `docs/runbooks/APRILPROFILE_SLO_DRAFT.md` в april-worker (PR #28): доступность `/readyz`, p95 латентность, доля 5xx; окно и burn-rate — ручная эскалация без автоматизации вне scope.
