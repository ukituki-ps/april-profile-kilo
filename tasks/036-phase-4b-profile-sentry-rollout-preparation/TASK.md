# Задача 036: исполнить внешнюю задачу 036 в `april-worker` с двойным отчётом

## Мета
- **Репозиторий выполнения:** `april-profile-1` (текущий), по постановке из `april-worker`.
- **Карточка-источник:** `april-worker/tasks/036-aprilprofile-sentry-rollout-preparation/TASK.md`.
- **Приоритет:** высокий.
- **ID / ветка:** `036-phase-4b-profile-sentry-rollout-preparation` (локальная трассировка).
- **Связанные документы:** `docs/OBSERVABILITY.md`, `docs/DEPLOYMENT_STRATEGY.md`, `docs/TESTING_STRATEGY.md`.

## Цель
Подготовить безопасный и воспроизводимый контур внедрения Sentry для AprilProfile без runtime-изменений: env-переменные, политика редактирования чувствительных данных, runbook rollout/rollback, чеклист для будущей реализации и зеркальные отчёты в двух репозиториях.

## Контекст для агента
- Источник требований и критериев приёмки — `task 036` в `april-worker`.
- В текущем репозитории нужно создать полный документационный пакет для последующей реализации задачи `038` в `april-worker`.
- Отчёт должен быть оформлен в двух местах: локально (`april-profile-1`) и в карточке `april-worker/tasks/036.../REPORT.md`.

## Входит в объём
- Добавить Sentry env-шаблон в `.env.example` (без реальных секретов).
- Подготовить runbook для AprilProfile: rollout/smoke/rollback/ownership.
- Зафиксировать baseline redaction/filtering policy для персональных данных профиля.
- Зафиксировать cross-repo поля корреляции и ownership для совместного triage с AprilHub.
- Создать локальный отчёт `tasks/036.../REPORT.md` и зеркальный отчёт в `april-worker`.

## Не входит в объём
- Подключение Sentry SDK в runtime-код.
- Изменение бизнес-логики backend/frontend.
- Настройка production DSN/секретов на реальных стендах.

## Технические ограничения
- Секреты и DSN не хранятся в git.
- Сохранить совместимость с текущим `requestId`/`correlationId`-контуром.
- Не менять release-процесс beyond документационного/prep scope.

## Критерии готовности (acceptance)
- [x] В `april-profile-1` создана и оформлена задача подготовки Sentry (`tasks/036...`).
- [x] Подготовлены env/redaction/runbook артефакты в `april-profile-1`.
- [x] Определены поля cross-repo корреляции и ownership для triage.
- [x] Подготовлен локальный отчёт в `tasks/036-phase-4b-profile-sentry-rollout-preparation/REPORT.md`.
- [x] Подготовлен зеркальный отчёт в `april-worker/tasks/036-aprilprofile-sentry-rollout-preparation/REPORT.md`.

## Проверка (команды)
```bash
# Документационный контур (выполнено в april-profile-1):
make docs-build
```

## Результат в отчёте
- Ссылки на подготовленные артефакты runbook/env/docs-site.
- Перечень принятых redaction/filtering правил.
- Что остаётся к runtime-реализации (задача `038` в `april-worker`).

## Человекопонятная история в docs-site (обязательно)
- [x] Создана страница `docs-site/docs/task-story-036-phase-4b-profile-sentry-rollout-preparation.md`.
- [x] В `docs-site/docs/task-stories-overview.md` добавлена ссылка и статус.
- [x] Простым языком описаны цель, эффект и шаги проверки.
- [x] Указаны границы задачи (что сделано/что остаётся).
- [x] В конце страницы есть ссылки на `TASK.md` и `REPORT.md`.
