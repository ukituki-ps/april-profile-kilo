# Задача: Фаза 1 (часть 6) — базовые интеграционные тесты (PostgreSQL, Redis, миграции Atlas)

## Мета
- **ID / ветка:** (например `feat/phase-1-integration-tests`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 1**, блок **«Затем»** (базовые интеграционные тесты с БД).
- **Связанные подзадачи:** зависит от [`004-phase-1-go-mod-atlas-migrations-tenant`](../004-phase-1-go-mod-atlas-migrations-tenant/) (миграции Atlas); желательно после [`008-phase-1-observability-config-readiness-deps`](../008-phase-1-observability-config-readiness-deps/) для тестов readiness/HTTP. Связь с [`005-phase-1-keycloak-jwt-tenant-context`](../005-phase-1-keycloak-jwt-tenant-context/) — опциональные тесты JWT (mock/fixture).
- **Связанные документы:** [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) (Integration: Testcontainers, Atlas)

## Цель
В репозитории есть **интеграционные тесты** на Go с **Testcontainers** (PostgreSQL, Redis), применением **тех же миграций Atlas**, что и в CI/deploy, и минимальными проверками: подключение, миграции, при необходимости — HTTP `/healthz`/`/readyz` против тестового сервера.

## Контекст для агента
- [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md): миграции в интеграционных тестах **только через Atlas**; Keycloak — shared container или отложен до стабилизации ([`TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) §Integration).

## Входит в объём
- Подключение зависимостей тестов (`testcontainers-go` или согласованный стек).
- Хелпер: поднять Postgres, применить миграции Atlas из артефактов репозитория.
- Хелпер: поднять Redis для проверок readiness или клиента.
- Один или несколько интеграционных тестов, дающих уверенность в «сквозной» работе каркаса (без доменного API фазы 2).
- При необходимости — цель `Makefile` `go test -tags=integration ./...` или отдельный пакет `internal/integrationtest`.

## Не входит в объём
- Полный E2E через браузер (Playwright) — фаза 6 и далее.
- Нагрузочные тесты k6 — фаза 6.
- Интеграция с реальным Keycloak на каждый PR — допускается отложить; минимум — мок JWT ([`005`](../005-phase-1-keycloak-jwt-tenant-context/)).

## Заглушки и внешние зависимости
- **Keycloak:** не обязателен в CI для этой задачи, если покрытие JWT остаётся на уровне unit/моков ([`TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)).
- **Docker:** Testcontainers требует Docker в среде CI; если runner не поддерживает — зафиксировать в `REPORT.md` и предложить политику (отдельный job, только на `develop`, и т.д.).

## Технические ограничения
- Не дублировать SQL миграций вне Atlas.
- Тесты не должны требовать доступа к продакшен-секретам.

## Критерии готовности (acceptance)
- [ ] `go test` с интеграционным тегом/пакетом проходит локально при наличии Docker.
- [ ] Миграции применяются тем же механизмом, что в прод-процедуре (Atlas).
- [ ] Документировано в `README` или `TESTING_STRATEGY`, как запускать интеграционные тесты.
- [ ] При расширении CI — новые jobs не ломают обязательный контур без согласования (имена checks — как в [`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) для branch protection).

## Проверка (команды)
```bash
go vet ./...
# пример — уточнить после внедрения
go test -tags=integration ./...

# Регрессия монорепозитория
make openapi-lint
make docs-build
```

## Результат в отчёте
Какие контейнеры поднимаются; как прогонять локально/в CI; ограничения runner; follow-up для Keycloak-интеграции.
