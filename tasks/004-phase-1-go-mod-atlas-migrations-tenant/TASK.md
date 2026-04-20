# Задача: Фаза 1 (часть 1) — Go-модуль, модульный монолит, Atlas, миграции, tenant и заготовка сущностей

## Мета
- **ID / ветка:** (по договорённости, например `feat/phase-1-go-atlas-tenant`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — в [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md) раздел **«Фаза 1 — Каркас Go, PostgreSQL, Redis, OIDC/tenant, health»**, блок **«Сначала»** (первый абзац: `go.mod`, модульный монолит, миграции, таблицы под tenant и заготовку сущностей).
- **Связанные подзадачи этой фазы:** следующие — [`005-phase-1-keycloak-jwt-tenant-context`](../005-phase-1-keycloak-jwt-tenant-context/), [`006-phase-1-health-openapi-system`](../006-phase-1-health-openapi-system/), [`007-phase-1-docker-ghcr-compose-deploy`](../007-phase-1-docker-ghcr-compose-deploy/), затем «Затем» — [`008-phase-1-observability-config-readiness-deps`](../008-phase-1-observability-config-readiness-deps/), [`009-phase-1-integration-tests-db-redis`](../009-phase-1-integration-tests-db-redis/).
- **Зависимость от других фаз:** **фаза 0** завершена (согласованные `PROJECT_DEFAULTS`, CI/деплой-скелет, runner) — см. [`tasks/001-phase-0-placeholders-oidc-runner-hub-docs/`](../001-phase-0-placeholders-oidc-runner-hub-docs/), [`tasks/002-phase-0-branch-ci-secrets-smoke-deploy/`](../002-phase-0-branch-ci-secrets-smoke-deploy/).
- **Связанные документы:** [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md), ADR-0002 ([`docs/adr/0002-april-profile-scope-and-multitenancy.md`](../../docs/adr/0002-april-profile-scope-and-multitenancy.md)), [`docs/DESIGN_AprilProfile.md`](../../docs/DESIGN_AprilProfile.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) (миграции только через Atlas)

## Цель
Появился **рабочий каркас backend на Go** (модульный монолит), **миграции PostgreSQL через Atlas** и **минимальная схема БД** с `tenant_id` и заготовкой под будущие сущности профиля — без полноценного доменного API (это фаза 2).

## Контекст для агента
- Опора на [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md): Go, REST, модульный монолит, PostgreSQL 17, Keycloak для IAM (реализация JWT — в задаче 005).
- Дорожная карта (фаза 1): [`PLAN.md` в `000-full-service-aprilhub-roadmap`](../000-full-service-aprilhub-roadmap/PLAN.md) — блоки «Сначала» / «Затем» и зависимость от фазы 0.
- Упомянутые файлы в Cursor: @Makefile @go.mod (после создания) @atlas.hcl или принятая в репо схема Atlas

## Входит в объём
- Инициализация **`go.mod`** и структуры **модульного монолита** (пакеты `cmd/`, `internal/` по согласованной с командой схеме; без лишних абстракций).
- Подключение **Atlas** для миграций; артефакты миграций в репозитории; целевые команды в `Makefile` или документированный способ применения (согласовать с будущим deploy).
- Миграции: таблицы **минимум под tenant** и **заготовку** под сущности профиля (имена полей согласовать с ADR-0002/0003 и `DESIGN_AprilProfile` — без реализации CRUD).
- Локальная разработка: при необходимости **docker-compose** фрагмент или профиль для Postgres (если уже принят в репо — расширить, не дублировать стек observability).

## Не входит в объём
- Валидация JWT и извлечение `tenant_id` из токена — [`005-phase-1-keycloak-jwt-tenant-context`](../005-phase-1-keycloak-jwt-tenant-context/).
- Эндпоинты `/healthz`/`/readyz` и синхронизация OpenAPI с реализацией — [`006-phase-1-health-openapi-system`](../006-phase-1-health-openapi-system/) (и углубление readiness — [`008-phase-1-observability-config-readiness-deps`](../008-phase-1-observability-config-readiness-deps/)).
- Образ ghcr и пайплайн деплоя — [`007-phase-1-docker-ghcr-compose-deploy`](../007-phase-1-docker-ghcr-compose-deploy/).
- Интеграционные тесты с Testcontainers — [`009-phase-1-integration-tests-db-redis`](../009-phase-1-integration-tests-db-redis/).

## Заглушки и внешние зависимости
- **Keycloak:** на этом шаге не требуется живой realm; для будущих тестов допустимо заложить только конфиг-поля (URL, audience) в `.env.example` без обязательной проверки подключения.
- **Redis:** схема под Asynq может не создаваться до фазы 3; если в миграциях нужен минимальный задел — явно пометить как «зарезервировано».

## Технические ограничения
- Стек и границы — [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md); не предлагать замену PostgreSQL/Keycloak/Redis на альтернативы без явного запроса.
- **Миграции БД только через Atlas** (см. [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)); не вводить параллельный способ DDL.
- Секреты: только через env / `.env.example`; значения не коммитить ([`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)).
- **`tenant_id` в коде домена** не должен браться из query/body — доверенный контекст появится в задаче 005; в схеме БД — колонки/FK под изоляцию по tenant.

## Критерии готовности (acceptance)
- [ ] В репозитории есть осмысленная структура Go-монолита и `go.mod`; код компилируется (`go build ./...` или эквивалент для выбранной точки входа).
- [ ] Есть каталог/файлы миграций Atlas и документированный способ применить их к dev/local Postgres.
- [ ] Миграции создают минимально необходимые объекты для **tenant** и заготовки сущностей (согласовано с ADR-0002).
- [ ] Нет дублирования конфликтующих DDL вне Atlas.
- [ ] Команды проверки проходят (см. ниже).

## Проверка (команды)
```bash
# После появления Go-кода в репо (целевой набор из roadmap / TESTING_STRATEGY)
go vet ./...
go build ./...

# Миграции (уточнить имена целей после добавления в Makefile)
# atlas migrate validate
# make migrate-apply   # или согласованный target

# Регрессия репозитория (уже сейчас обязательны при изменениях, затрагивающих доки/OpenAPI — здесь минимум если не трогали)
make openapi-lint
make docs-build
```

## Результат в отчёте
По [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md): структура пакетов; пути к миграциям Atlas; как поднять Postgres локально; риски (например согласование имён таблиц с фазой 2); follow-up для 005–006.
