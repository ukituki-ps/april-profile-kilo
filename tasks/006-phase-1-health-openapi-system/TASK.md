# Задача: Фаза 1 (часть 3) — `/healthz`, `/readyz` и синхронизация OpenAPI

## Мета
- **ID / ветка:** (например `feat/phase-1-health-openapi`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 1**, блок **«Сначала»** (`/healthz`, `/readyz`).
- **Связанные подзадачи:** зависит от [`004-phase-1-go-mod-atlas-migrations-tenant`](../004-phase-1-go-mod-atlas-migrations-tenant/) (HTTP-сервер/роутер), опционально после [`005-phase-1-keycloak-jwt-tenant-context`](../005-phase-1-keycloak-jwt-tenant-context/) для единой структуры middleware; углубление readiness — [`008-phase-1-observability-config-readiness-deps`](../008-phase-1-observability-config-readiness-deps/).
- **Связанные документы:** [`openapi/openapi.yaml`](../../openapi/openapi.yaml), [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) §7 (health по внутреннему порту)

## Цель
Сервис отдаёт **liveness** (`/healthz`) и **readiness** (`/readyz`) в соответствии со спецификацией; [`openapi/openapi.yaml`](../../openapi/openapi.yaml) **синхронизирован** с фактическими путями и ответами. На этом шаге **`/readyz` может быть упрощённым** (например 200 без проверки зависимостей), пока не выполнена задача 008.

## Контекст для агента
- OpenAPI — каноничный контракт; правки в одном PR с изменением кода ([`000/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md) — практика сессий).
- Readiness с проверкой БД/Redis — явно в блоке «Затем» дорожной карты → [`008-phase-1-observability-config-readiness-deps`](../008-phase-1-observability-config-readiness-deps/).

## Входит в объём
- Реализация маршрутов `GET /healthz`, `GET /readyz` (префикс `/api` или без — **как согласовано** с gateway в [`openapi/openapi.yaml`](../../openapi/openapi.yaml) и `PROJECT_DEFAULTS`).
- Согласование тел ответов и кодов с уже существующей заготовкой в OpenAPI (в т.ч. 503 для неготовности, когда появится проверка зависимостей).
- Обновление `openapi/openapi.yaml`: `servers`, теги, операции без расхождений с реализацией.

## Не входит в объём
- Проверка Postgres/Redis в readiness — [`008-phase-1-observability-config-readiness-deps`](../008-phase-1-observability-config-readiness-deps/).
- `GET /metrics` (Prometheus) — фаза 4.1 дорожной карты.
- Доменные пути API — фаза 2.

## Заглушки и внешние зависимости
- Если readiness пока **всегда 200**: явно описать в `REPORT.md` и в комментарии в коде, что это временно до задачи 008.
- Nginx/gateway на dev — не блокирует merge; smoke с хоста — по [`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md).

## Технические ограничения
- Эндпоинты health/readiness — **без обязательной авторизации** (в OpenAPI уже `security: []`); не требовать JWT для проверки оркестратором.
- Секреты не отдавать в ответах health.

## Критерии готовности (acceptance)
- [ ] `GET /healthz` и `GET /readyz` соответствуют спецификации по путям и основным кодам ответа.
- [ ] `openapi/openapi.yaml` отражает реальные пути и схемы; `make openapi-lint` проходит.
- [ ] `make docs-build` проходит, если затронута документация сайта.
- [ ] Задокументировано, что именно проверяет `/readyz` в этом инкременте (и ссылка на follow-up 008).

## Проверка (команды)
```bash
go vet ./...
go test ./...

make openapi-lint
make docs-build

# Локально после запуска сервера (порты из конфига)
# curl -sf http://127.0.0.1:<port>/healthz
# curl -sf http://127.0.0.1:<port>/readyz
```

## Результат в отчёте
Пути и порты; пример curl; отличия от целевого readiness после 008; затронутые файлы OpenAPI.
