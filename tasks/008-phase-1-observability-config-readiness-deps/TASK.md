# Задача: Фаза 1 (часть 5) — структурированные логи, `request_id`, readiness (БД/Redis), конфиг только через env

## Мета
- **ID / ветка:** (например `feat/phase-1-logs-requestid-readiness`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 1**, блок **«Затем»** (структурированные логи, `request_id`, readiness зависит от БД/Redis; конфиг и секреты только через env).
- **Связанные подзадачи:** зависит от [`004-phase-1-go-mod-atlas-migrations-tenant`](../004-phase-1-go-mod-atlas-migrations-tenant/), [`006-phase-1-health-openapi-system`](../006-phase-1-health-openapi-system/), наличия подключений к БД/Redis в приложении; после [`007-phase-1-docker-ghcr-compose-deploy`](../007-phase-1-docker-ghcr-compose-deploy/) для проверки на dev. Перед [`009-phase-1-integration-tests-db-redis`](../009-phase-1-integration-tests-db-redis/).
- **Связанные документы:** [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md), [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md) (Promtail/Loki — контур Hub)

## Цель
Сервис пишет **структурированные логи** (формат, пригодный для сбора Promtail/Loki в экосистеме April), каждый запрос имеет **`request_id`** для корреляции; **`GET /readyz` отражает доступность PostgreSQL и Redis** (и возвращает 503 при недоступности). **Конфигурация и секреты** задаются **только через переменные окружения** (с валидацией при старте).

## Контекст для агента
- Блок «Затем» в [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md) для фазы 1.
- Полный стек observability в репозитории не копируется — достаточно контракта на логи/поля для будущей интеграции с Hub ([`AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md)).

## Входит в объём
- Middleware: генерация/проброс **`X-Request-Id`** (или согласованный заголовок), запись в лог и контекст.
- Логирование: структурные поля (уровень, время, сообщение, `request_id`, при необходимости `tenant_id` — без утечки PII).
- Readiness: проверка **пула БД** (ping/query) и **Redis** (ping); таймауты и отсутствие утечки соединений.
- Валидация обязательных env при старте; обновление **`.env.example`** с именами переменных без секретов.
- При необходимости — лёгкая правка OpenAPI для описания ошибок readiness (если меняется тело 503).

## Не входит в объём
- Экспорт **Prometheus** `GET /metrics` — фаза 4.1.
- Распределённый трейсинг (OpenTelemetry) — по отдельной задаче/ADR при необходимости.
- Asynq-воркеры — фаза 3.

## Заглушки и внешние зависимости
- Если Redis **ещё не поднят** на dev: readiness может временно допускать отсутствие Redis **только** под явным feature-flag env (по умолчанию — строгая проверка); зафиксировать в `REPORT.md`.
- Локально без контейнеров — `docker compose up` для Postgres/Redis или Testcontainers (пересечение с 009).

## Технические ограничения
- Секреты не логировать; строки подключения только из env.
- Keycloak для RBAC не дублировать в логах полностью JWT.

## Критерии готовности (acceptance)
- [ ] Логи структурированы; `request_id` присутствует на обработанных запросах и в логах.
- [ ] `/readyz` возвращает 503 при недоступной БД или Redis (демонстрируемо тестом или инструкцией).
- [ ] Отсутствие критичных env приводит к понятной ошибке при старте.
- [ ] `go test ./...`, `go vet ./...` зелёные; `make openapi-lint` при изменении спецификации.

## Проверка (команды)
```bash
go vet ./...
go test ./...

make openapi-lint
make docs-build

# Ручной smoke: остановить Postgres или Redis и убедиться, что /readyz = 503
```

## Результат в отчёте
Список env; формат лога; пример записи; как проверить readiness; follow-up для метрик (фаза 4.1).
