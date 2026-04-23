# Задача: Фаза 4.2 (часть 1, AprilProfile) — контракт «за BFF»: tenant, маршруты, документация для dev

## Мета
- **ID / ветка:** (например `feat/phase-4-hub-bff-contract-docs`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4**, подраздел **4.2 Продукт (BFF + UI)**, блок **«Сначала»** (сценарий на dev: BFF Hub проксирует к Profile с tenant; админ-маршруты `/admin/profile/...` или согласованный префикс; один OIDC-клиент).
- **Связанные подзадачи:** **зависит от** минимума фазы 1 и фазы 2: [`005-phase-1-keycloak-jwt-tenant-context`](../005-phase-1-keycloak-jwt-tenant-context/), [`006-phase-1-health-openapi-system`](../006-phase-1-health-openapi-system/), доменного API [`010`](../010-phase-2-entity-types-openapi/)–[`013`](../013-phase-2-abac-field-filtering/) (для осмысленного проксируемого пути). Параллельно с [`018`](../018-phase-4-prometheus-metrics-logs-correlation/) по графу дорожной карты. Реализацию **BFF в Hub** см. **[AprilHub]** [`021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`](../021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/).
- **Связанные документы:** [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md), [`docs/DECISION_MATRIX_UI_INTEGRATION.md`](../../docs/DECISION_MATRIX_UI_INTEGRATION.md), [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md), OpenAPI `openapi/openapi.yaml`

## Цель
В репозитории **AprilProfile** зафиксирован и при необходимости дополнен **контракт вызова сервиса через BFF AprilHub**: как передаётся **tenant**, какие **базовые пути** ожидаются за reverse proxy, как **OIDC/JWT** согласуются с одним клиентом; есть инструкция для **dev smoke** без реализации кода Hub (заглушка — ручной `curl` через локальный nginx или временный прокси).

## Контекст для агента
- Блок **«Сначала»** в подразделе **4.2** родительского [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Координация URL/BFF с владельцами Hub — **ручная контрольная точка**; эта задача — сторона **Profile**.

## Входит в объём
- Документ (короткий раздел в существующем guide или README): **цепочка** Hub BFF → Profile; заголовки доверия (`X-Forwarded-*`, `Authorization`) и извлечение **`tenant_id` только из доверенного контекста** (JWT/claims), без доверия произвольному query от клиента браузера.
- Согласование и фиксация **префикса пути** (`/admin/profile/...` или иной) на стороне Profile: либо сервис слушает корень API и префикс снимает только Nginx/BFF, либо явный sub-router — задокументировать выбранный вариант.
- Обновление **OpenAPI** (`servers`, `securitySchemes`, описание прокси при необходимости) в том же стиле, что принят в репо.
- Проверка CORS: если BFF same-origin — зафиксировать; если прямой вызов с фронта — не расширять без ADR.

## Не входит в объём
- Код **BFF, маршрутизация и OIDC-клиент в april-worker** — задача [`021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`](../021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/) **[AprilHub]**.
- Пакет `@april/profile-ui` — задача [`022-phase-4-profile-ui-package-openapi-embed`](../022-phase-4-profile-ui-package-openapi-embed/).

## Заглушки и внешние зависимости
- **До готовности BFF в Hub:** проверка через **локальный reverse proxy** (compose) или `httptest` с имитацией заголовков BFF; в `REPORT.md` — точная команда.
- **Mock Keycloak:** как в фазе 1 — токены с нужными claims для tenant; без стенда Hub.

## Технические ограничения
- **Keycloak** — источник RBAC; не ослаблять правила извлечения tenant.
- **Atlas** — только если для контракта нужны изменения схемы (обычно нет).
- Секреты — только env; не коммитить realm secrets.

## Критерии готовности (acceptance)
- [x] В репозитории есть **однозначное** описание: как Hub должен звать Profile (host, path, заголовки).
- [x] OpenAPI согласован с фактическим поведением REST (синхронизация в одном PR).
- [x] `make openapi-lint`, `make docs-build`, `go test ./...`, `go vet ./...` зелёные.
- [x] Описан **smoke-сценарий** dev (шаги), воспроизводимый командой из репо или compose.

## Проверка (команды)
```bash
go vet ./...
go test ./...

make openapi-lint
make docs-build
```

## Результат в отчёте
Ссылка на согласованный префикс и пример `curl`; список доверенных заголовков; follow-up для задачи 021 (Hub).

## Человекопонятная история в docs-site (обязательно)
- [x] Страница `docs-site/docs/task-story-020-phase-4-profile-contract-behind-hub-bff.md`.
- [x] Обновлён `docs-site/docs/task-stories-overview.md`.
- [x] Простым языком: зачем BFF и tenant, что проверяет smoke.
- [x] Ссылки на `tasks/020-phase-4-profile-contract-behind-hub-bff/TASK.md`, `REPORT.md`.
