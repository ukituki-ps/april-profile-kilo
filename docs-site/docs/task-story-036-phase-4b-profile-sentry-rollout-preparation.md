---
sidebar_position: 46
---

# 036 — Подготовка внедрения Sentry в AprilProfile

## Какая была проблема

В проекте уже есть базовая наблюдаемость через метрики и логи, но перед подключением Sentry не было согласованного безопасного контура: какие env нужны, какие данные нельзя отправлять, как делать rollout/rollback и кто отвечает за triage между AprilProfile и AprilHub.

## Что сделали

- Подготовили отдельную задачу и артефакты для pre-implementation этапа.
- Добавили в `.env.example` шаблон переменных `SENTRY_*` без секретов.
- Создали runbook `docs/runbooks/APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md`:
  - env-контур;
  - redaction/filtering политика для PII;
  - шаги rollout/smoke/rollback;
  - cross-repo contract (`requestId`, `correlationId`, ownership).
- Обновили `docs/OBSERVABILITY.md`, чтобы Sentry preparation был частью общей observability-картины.
- Синхронизировали двойной отчёт: локально в `april-profile-1` и зеркально в `april-worker`.

## Что это даёт команде

- Команда может переходить к runtime-интеграции Sentry без споров о базовых правилах безопасности.
- Снижается риск утечки чувствительных данных в event payload.
- У incident triage заранее определены общие поля корреляции и зона ответственности.

## Как проверить без чтения кода

1. Убедиться, что в `.env.example` есть блок `SENTRY_*` с шаблонными значениями.
2. Прочитать `docs/runbooks/APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md` и проверить наличие разделов про redaction, rollout/smoke/rollback.
3. Запустить `make docs-build` и убедиться, что документация собирается.

## Границы и follow-up

- В этой задаче **не подключали** Sentry SDK в runtime.
- Реальная интеграция и smoke с тестовыми ошибками запланированы в задаче `038` (`april-worker`).

## Ссылки на артефакты

- `tasks/036-phase-4b-profile-sentry-rollout-preparation/TASK.md`
- `tasks/036-phase-4b-profile-sentry-rollout-preparation/REPORT.md`
