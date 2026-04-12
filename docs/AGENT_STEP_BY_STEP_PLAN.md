# Пошаговый план работы агента (April Service)

Контекст стека и границ: [`AGENT_ARCHITECTURE_CONTEXT.md`](./AGENT_ARCHITECTURE_CONTEXT.md).

## 1. Уточнить scope
- Прочитать постановку и [`task_list.md`](../task_list.md).
- Зафиксировать, что входит и что сознательно не входит в задачу.

## 2. Собрать контекст
- Прочитать [`README.md`](../README.md), [`docs/AGENT_TASK_TEMPLATE.md`](./AGENT_TASK_TEMPLATE.md), [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](./AGENT_ARCHITECTURE_CONTEXT.md).
- Найти затронутые части монорепозитория: backend (Go), frontend (React), инфраструктура (Compose, Nginx), документация.

## 2a. Детальный план в папке задачи (при нетривиальной задаче)
- Если работа ведётся в `tasks/<NNN-slug>/` и задача не тривиальна (несколько слоёв, неочевидный порядок шагов, зависимости) — составить план по [`docs/AGENT_PLAN_TEMPLATE.md`](./AGENT_PLAN_TEMPLATE.md) и сохранить как **`PLAN.md`** в той же подпапке, рядом с `TASK.md`.
- План уточнять по мере работы; при смене scope синхронизировать с `TASK.md`.

## 3. Спроектировать минимальное решение
- Без архитектурных усложнений вне согласованного scope.
- Проверить согласованность с **Keycloak (RBAC)** и с политикой миграций **Atlas** (см. [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md)).

## 4. Реализация
- Порядок слоёв по задаче (часто: backend → frontend → infra).
- При изменении схемы БД — миграции **Atlas**, без ручного расхождения со стратегией тестов.

## 5. Тестирование
- Прогнать lint / build / tests согласно [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md) и принятым в репо командам.
- Smoke ключевого сценария, если применимо.

## 6. Git / GitHub
- Ветка `feature/*` или `fix/*`.
- Атомарные коммиты; PR с test plan и рисками.
- Не обходить защиту веток (`main`, `develop`) — см. [`DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md).

## 7. Деплой (если явно требуется задачей)
- Ориентир: [`DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md) — CI на merge в `develop`, образы в **ghcr** по **git SHA**, сервер `/opt/april`, обновление `images.env`, дамп БД перед миграциями, миграции до `docker compose up`, проверка health по внутреннему порту, затем smoke / логин / E2E по мере готовности стенда.
- При провале — откат образов и при необходимости миграций по документу.

## 8. Отчёт
- Результат строго по [`docs/AGENT_REPORT_TEMPLATE.md`](./AGENT_REPORT_TEMPLATE.md), файл — **`tasks/<NNN-slug>/REPORT.md`** (см. [`tasks/README.md`](../tasks/README.md)).
