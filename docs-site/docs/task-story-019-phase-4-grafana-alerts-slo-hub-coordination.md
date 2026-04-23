---
sidebar_position: 33
---

# 019 — Дашборды Grafana, алерты и черновик SLO для AprilProfile в AprilHub

## Что поменялось

Работа выполнена в репозитории **AprilHub** ([april-worker](https://github.com/ukituki-ps/april-worker)): добавлены дашборд Grafana для метрик **`april_profile_*`**, отдельный файл правил Prometheus с алертами по доступности/ошибкам и черновик SLO в виде runbook. В april-profile обновлены только ссылки и «человеческая» история, чтобы команда знала, где искать артефакты после merge.

## Зачем это нужно

После задачи **018** сервис уже отдаёт `/metrics` и предсказуемые логи. Без панелей и алертов в общем контуре AprilHub эксплуатация хуже видит регрессии (5xx, деградация `/readyz`, лаг синка). Единое место для дашбордов и правил — april-worker, а этот репозиторий остаётся источником метрик.

## Границы задачи

**Сделано:** merge-ready PR в april-worker с дашбордом, алертами и документом SLO-draft; индекс observability в том репозитории обновлён.

**Не входило:** изменение кода AprilProfile; финальная организационная политика error budget; деплой стенда april-profile (не требовался постановкой).

## Как проверить без чтения кода

1. Открыть PR в april-worker: https://github.com/ukituki-ps/april-worker/pull/28
2. После merge и деплоя стека observability на стенде Hub: в Grafana папка **AprilHub Observability** → дашборд **AprilProfile Service Overview** (UID `april-profile-service-overview`); в Prometheus — правила из `aprilprofile-alerts.yml`.
3. Убедиться, что в target для Profile в `overlays/targets` label **`service`** совпадает с ожидаемым в алертах (**`april-profile`**), иначе скорректировать имя при регистрации или matchers в правилах.

## Официальные артефакты

- Постановка: `tasks/019-phase-4-grafana-alerts-slo-hub-coordination/TASK.md`
- План: `tasks/019-phase-4-grafana-alerts-slo-hub-coordination/PLAN.md`
- Отчёт: `tasks/019-phase-4-grafana-alerts-slo-hub-coordination/REPORT.md`
