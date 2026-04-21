---
sidebar_position: 22
---

# 002 — CI/деплой-база: runner, переменные, smoke dev

## Что болело

Даже при хорошем коде релизы "не едут", если не настроены базовые вещи:

- правила веток;
- секреты/переменные;
- self-hosted runner;
- минимальный smoke после деплоя.

## Что сделали

- Подготовили процесс merge в `develop` через PR и зафиксировали правила в документации.
- Проверили и зафиксировали `APRIL_DEPLOY_ROOT` для реального сервера.
- Настроили/проверили отдельный runner для `april-profile`.
- Исправили фронтовый CI-нюанс (`ds:prepare` перед lint/build).
- Убрали конфликт портов на стенде (`8888` и `8092` для `april-profile`).

## Что получили

- Деплой pipeline реально отрабатывает на dev.
- Есть воспроизводимый инфраструктурный smoke.
- У команды единая "инструкция выживания" для деплоя и проверок.

## Что проверили фактически

- Успешный workflow `Deploy to dev` на `develop`.
- На `192.168.1.42` подняты сервисы документации/Swagger/Structurizr для `april-profile`.
- `curl http://192.168.1.42:8888/` -> `200`.

## Ограничения

- Полноценные API health-check'и (`/healthz`, `/readyz`) тогда еще не были в scope.
- Часть branch protection зафиксирована как организационное ограничение GitHub тарифа/режима.

## Технические детали

- Постановка: `tasks/002-phase-0-branch-ci-secrets-smoke-deploy/TASK.md`
- План: `tasks/002-phase-0-branch-ci-secrets-smoke-deploy/PLAN.md`
- Отчёт: `tasks/002-phase-0-branch-ci-secrets-smoke-deploy/REPORT.md`
