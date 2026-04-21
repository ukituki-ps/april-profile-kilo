# Задача: Фаза 1 (часть 2) — валидация JWT Keycloak и `tenant_id` только из доверенного контекста

## Мета
- **ID / ветка:** `feature/phase-1-jwt-tenant-context`
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 1**, блок **«Сначала»** (валидация JWT Keycloak; **`tenant_id` только из доверенного контекста**).
- **Связанные подзадачи:** зависит от [`004-phase-1-go-mod-atlas-migrations-tenant`](../004-phase-1-go-mod-atlas-migrations-tenant/); далее — [`006-phase-1-health-openapi-system`](../006-phase-1-health-openapi-system/), [`008-phase-1-observability-config-readiness-deps`](../008-phase-1-observability-config-readiness-deps/).
- **Связанные документы:** ADR-0002, [`docs/auth-jwt-keycloak-adapted.md`](../../docs/auth-jwt-keycloak-adapted.md), [`docs/keycloak-stand-coordinates.md`](../../docs/keycloak-stand-coordinates.md) (живой Keycloak на стенде: `<BASE>`, discovery, JWKS, `KEYCLOAK_*`), [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md) (имена realm/client)

## Цель
HTTP-слой (или общий middleware) **проверяет JWT от Keycloak** по согласованным правилам (issuer, audience, JWKS), а **`tenant_id` для бизнес-логики доступен только из проверенного токена/сессии BFF** — не из недоверенных параметров запроса.

## Контекст для агента
- IAM: Keycloak — источник RBAC ([`AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md)).
- Политика tenant: ADR-0002 — кросс-тенант по умолчанию запрещён; контекст из аутентификации.
- **Согласование с AprilHub (OIDC):** одна модель — realm Keycloak, API доверяет только access token от IdP, проверка подписи и `iss` / `aud|azp` / срок ([`docs/auth-jwt-keycloak-adapted.md`](../../docs/auth-jwt-keycloak-adapted.md)). Эталон реализации проверки — **hub-bff** в репозитории экосистемы (например april-worker); пути `infra/keycloak/realm/…`, префикс `/auth/` у Keycloak и единый ingress — в стеке Hub. В этом репозитории задаём **`KEYCLOAK_JWKS_URL`**, **`KEYCLOAK_ISSUER`**, **`KEYCLOAK_AUDIENCE`** (см. [`.env.example`](../../.env.example) и [`docs/keycloak-stand-coordinates.md`](../../docs/keycloak-stand-coordinates.md)); client id, redirect URIs и Web origins согласуются с владельцами Hub.
- **Источник `tenant_id`:** либо согласованный claim в access token (mapper Keycloak), либо заголовок/claim от **BFF Hub** — один выбранный вариант фиксируется в отчёте задачи; подмена через query/body для защищённых маршрутов запрещена в любом случае.

## Входит в объём
- Конфигурация OIDC/JWT через **переменные окружения** (issuer, audience, JWKS URL, клиент и т.д. — по принятому в проекте списку).
- Middleware/handler: валидация подписи и claims; помещение **идентификатора tenant** и субъекта в **request-scoped context** (идиоматично для Go).
- Явный запрет/игнорирование `tenant_id` из query/body для защищённых маршрутов; для публичных маршрутов (например health) — без tenant.
- Документация в коде или короткий раздел в `README`: какие claims маппятся на `tenant_id`.

## Не входит в объём
- Полный доменный REST и CRUD — фаза 2.
- RBAC по ролям на уровне всех эндпоинтов — минимально необходимое для изоляции tenant; детальная матрица прав — по мере появления API.
- Интеграционный тест с реальным Keycloak в CI — может быть заглушкой до [`009`](../009-phase-1-integration-tests-db-redis/); см. раздел заглушек.

## Заглушки и внешние зависимости
- **До готовности dev-realm:** локальная проверка с **подписанными тестовыми JWT** (фикстуры) или Keycloak Testcontainer — по сложности; минимум — юнит-тесты на парсинг claims при переданном JWKS mock.
- **BFF Hub:** если в продакшене tenant приходит через BFF, зафиксировать в задаче ожидаемый claim/header **согласованно** с владельцами Hub — **ручная контрольная точка** (см. «Порядок работ» в [`000/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md)).
- **Smoke SSO на стенде Hub:** сценарий «логин через общий Keycloak → вызов API этого сервиса с Bearer → при необходимости второй заход в экосистему без повторного пароля при живой SSO-сессии» — **проверка на согласованном стенде с Hub**, не обязательный минимум для CI этой задачи (в CI достаточно моков/юнитов выше).

## Технические ограничения
- Keycloak как IAM; не заменять на другой IdP без ADR.
- Секреты и строки подключения — только env ([`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)).
- Не ослаблять проверку JWT «на время разработки» в коде main без явного feature-flag и документа.

## Критерии готовности (acceptance)
- [x] Защищённый тестовый маршрут (или существующий заготовка) отклоняет отсутствующий/невалидный JWT.
- [x] При валидном JWT `tenant_id` в контексте соответствует доверенному claim (согласованному mapping).
- [x] Попытка передать tenant через недоверенный канал не подменяет контекст.
- [x] `go test` для пакетов аутентификации проходит; `go vet ./...` зелёный.
- [x] Команды проверки проходят (см. ниже).
- [ ] (опционально, стенд с Hub) Выполнен или запланирован smoke: общий OIDC-логин → API с `Authorization: Bearer` — успех; при возможности — без повторного ввода пароля при активной SSO-сессии Keycloak.

## Проверка (команды)
```bash
go vet ./...
go test ./...

# Регрессия монорепозитория
make openapi-lint
make docs-build
```

## Результат в отчёте
Список env-переменных (имена); схема claims → tenant; как воспроизвести локально; явная ссылка на согласование с контрактом AprilHub (realm, issuer, audience); открытые вопросы по интеграции с Hub/BFF; если smoke на стенде делали — кратко результат.
