# AGENT ERROR TRIAGE PROMPT

Операционный промпт для агента, который ведёт цикл **анализ ошибок → локализация → безопасное исправление → верификация** по кейсам `400/404/503`, падений React, `unhandledrejection` и деградаций интеграции **AprilHub ↔ AprilProfile** (виджеты, BFF/прокси, REST API этого репозитория).

**Не заменяет** [`AGENT_MASTER_PROMPT.md`](./AGENT_MASTER_PROMPT.md): перед работой по обычной задаче используй master prompt; **этот документ** — узкий overlay для incident/fix-сессий.

## Когда использовать

- Есть Sentry issue, алерт Grafana/Prometheus, жалоба на экран или повторяющийся HTTP-ошибочный сценарий.
- Нужна единообразная корреляция **widget/host ↔ BFF (april-worker) ↔ `april-profile` API ↔ downstream ↔ infra** без «угадывания слоя».

## Обязательные ссылки (не дублировать содержимое)

| Тема | Документ |
|------|-----------|
| Стек и границы | [`AGENT_ARCHITECTURE_CONTEXT.md`](./AGENT_ARCHITECTURE_CONTEXT.md) |
| Модель ошибок и поля корреляции | [`ERROR_TELEMETRY_MODEL.md`](./ERROR_TELEMETRY_MODEL.md) |
| Пошаговый triage Sentry → Loki → Prometheus | [`runbooks/APRILPROFILE_ERROR_TELEMETRY_TRIAGE.md`](./runbooks/APRILPROFILE_ERROR_TELEMETRY_TRIAGE.md) |
| Метрики, логи, связь с контуром Hub | [`OBSERVABILITY.md`](./OBSERVABILITY.md) |
| Индекс observability в экосистеме (april-worker) | [OBSERVABILITY_INDEX.md в april-worker](https://github.com/ukituki-ps/april-worker/blob/develop/docs/guides/OBSERVABILITY_INDEX.md) |
| Контракты host/widget | [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md), [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md) |
| Телеметрия виджетов (requestId / correlationId) | [`WIDGET_OBSERVABILITY_GUIDE.md`](./WIDGET_OBSERVABILITY_GUIDE.md) |
| IAM | [`auth-jwt-keycloak-adapted.md`](./auth-jwt-keycloak-adapted.md) — роли из Keycloak, не изобретать политику в коде |
| Отчёт по задаче | [`AGENT_REPORT_TEMPLATE.md`](./AGENT_REPORT_TEMPLATE.md) |

## Обязательный flow корреляции: Sentry ↔ Loki ↔ Prometheus

Пока не пройдены шаги **1–3**, не классифицируй root cause и не вноси кодовые правки (кроме явного hotfix по согласованному процессу).

1. **Sentry (incident layer)** — открыть issue: тип ошибки, release, теги `requestId`, `correlationId`, `tenant`, `route`, `module` / `widget`, breadcrumbs (последний API, навигация).
2. **Loki (operational logs)** — по самому узкому ключу (приоритет: `requestId` → `correlationId` + route): цепочка **host/BFF** (april-worker, если запрос шёл через Hub) → **`april-profile`** (`service`/лейблы стенда) → downstream (Temporal, БД и т.д.). Имена job’ов и stream’ов бери из runbook и дашбордов Hub. Зафиксировать первый компонент с ошибкой, HTTP-статус, признаки degraded/timeout.
3. **Prometheus / Grafana** — временное окно инцидента: error rate, latency, `target down`, релевантные алерты (см. runbook и [`OBSERVABILITY.md`](./OBSERVABILITY.md)). Отделить инфраструктурный паттерн от точечного бага.

Каноническое описание корреляции и redaction: [`ERROR_TELEMETRY_MODEL.md`](./ERROR_TELEMETRY_MODEL.md) §4–5 и [`runbooks/APRILPROFILE_ERROR_TELEMETRY_TRIAGE.md`](./runbooks/APRILPROFILE_ERROR_TELEMETRY_TRIAGE.md).

## Чеклист: что собрать перед фиксом

- [ ] Идентификатор инцидента (Sentry issue URL / alert / тикет) и **окружение** (`dev` / `staging` / `prod`).
- [ ] **Sentry**: stacktrace, breadcrumbs, теги корреляции (`requestId`, `correlationId`, `tenant`, `route`, `module` / `widget`, `release`).
- [ ] **Маршрут UI** и API path; для виджетов — host route + контекст виджета ([`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md)); при интеграции в Hub — согласованный префикс BFF (см. [`integration/`](./integration/) и handoff-документы).
- [ ] **Роль(и)** из Keycloak / `/me` (агрегированный `roleSet` без PII) — воспроизведение под той же матрицей доступа.
- [ ] **Tenant** (trusted context) — не из произвольного пользовательского ввода.
- [ ] Гипотеза слоя: UI-only / Hub BFF / **april-profile API** / downstream / infra (после шагов Sentry → Loki → Prometheus).

## Алгоритм проверки слоёв (после корреляции)

Порядок расследования по умолчанию:

1. **Frontend** (`frontend/`, пакеты `@april/*-ui` при отладке потребителя) — Error Boundary, состояние после fetch, контракт props/DTO, гонки при навигации, соответствие [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md).
2. **Hub BFF / reverse proxy** (репозиторий **april-worker**, не этот) — префиксы вроде `/admin/profile/api`, проксирование на сервисный путь **`/api`**, таймауты, маппинг ошибок; при изоляции бага здесь — фикс и PR в owning-репо Hub, в AprilProfile только сопутствующие контракты/доки при необходимости.
3. **AprilProfile backend** (`cmd/april-profile`, `internal/httpapi`) — доменная логика, валидация, `5xx`/выбранные `4xx` по [`ERROR_TELEMETRY_MODEL.md`](./ERROR_TELEMETRY_MODEL.md).
4. **Downstream** — PostgreSQL, Temporal, Redis/Asynq, внешние интеграции, будущий File Service и т.д.
5. **Infra** — ingress, сеть, scrape `/metrics`, целевые алерты Prometheus (см. triage runbook и ссылку на Hub в [`AGENT_ARCHITECTURE_CONTEXT.md`](./AGENT_ARCHITECTURE_CONTEXT.md)).

Если симптом воспроизводится **только** при прямом вызове API без Hub — слой BFF можно сузить быстрее; если только из встроенного виджета — расширь цепочку до host и BFF.

## Правила исправления

- Минимальный дифф; не смешивать несвязанные исправления.
- **IAM**: исправлять права в Keycloak / конфиге ролей, не дублировать «теневую» RBAC в приложении.
- **PII / секреты**: не логировать и не отправлять в Sentry токены, cookies, сырые ПДн; redaction — по [`ERROR_TELEMETRY_MODEL.md`](./ERROR_TELEMETRY_MODEL.md) §5.
- **БД**: только Atlas-процесс, если затронута схема ([`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md)).
- После фикса — релевантные тесты (unit/integration/e2e по затронутому контуру) и smoke при необходимости ([`guides/PROFILE_BFF_DEV_SMOKE.md`](./guides/PROFILE_BFF_DEV_SMOKE.md) и постановка задачи).

## Anti-patterns

- Чинить «на глаз» по одному только stacktrace в Sentry без Loki/Prometheus.
- Включать в issue/query идентификаторы с PII в открытом виде.
- Расширять права в коде вместо настройки Keycloak.
- Менять контракт host↔widget без синхронизации OpenAPI / [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md) / ADR при необходимости.

## Чеклист: что проверить после фикса

- [ ] Повтор Sentry → Loki → Prometheus на том же сценарии: ошибка не воспроизводится или деградация снята.
- [ ] Негативные кейсы для ролей (где применимо) и happy-path.
- [ ] Линтер/сборка/тесты по [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md) для затронутых пакетов.
- [ ] `REPORT.md` задачи (или incident note) с ключами корреляции и классификацией root cause.

## Обязательный формат отчёта (incident / fix-сессия)

Структура отчёта (в чате, тикете или `tasks/<NNN-slug>/REPORT.md`):

1. **Инцидент:** ID, окно времени, окружение.
2. **Корреляция:** `requestId`, `correlationId`, `tenant`, `route`, `module` / `widget`, release.
3. **Наблюдения:** кратко по Sentry → Loki → Prometheus (что подтвердилось на каждом шаге).
4. **Классификация:** UI / Hub BFF / **april-profile API** / downstream / infra + owner (репозиторий/команда).
5. **Изменения:** файлы/PR, риски, rollback.
6. **Верификация:** команды тестов / smoke, повторная проверка метрик/логов.

Для задач в `tasks/<NNN-slug>/` итоговый артефакт репозитория — по [`AGENT_REPORT_TEMPLATE.md`](./AGENT_REPORT_TEMPLATE.md).

---

## Блок для копирования в чат агента

Вставь постановку между `TASK START` / `TASK END` (формат [`AGENT_TASK_TEMPLATE.md`](./AGENT_TASK_TEMPLATE.md)).

```md
Ты работаешь как инженер-исполнитель экосистемы **April** в режиме **incident triage / fix** по репозиторию **april-profile-1** (ошибки UI/API, интеграция AprilHub ↔ AprilProfile).

Перед началом прочитай (пути от корня репозитория april-profile-1):
1) `docs/AGENT_ERROR_TRIAGE_PROMPT.md` — чеклисты, anti-patterns, формат отчёта
2) `docs/AGENT_ARCHITECTURE_CONTEXT.md`
3) `docs/ERROR_TELEMETRY_MODEL.md`
4) `docs/runbooks/APRILPROFILE_ERROR_TELEMETRY_TRIAGE.md`
5) `docs/OBSERVABILITY.md`
6) `docs/AGENT_MASTER_PROMPT.md` — общие правила Git, Keycloak, Atlas, UI-язык
7) `docs/AGENT_REPORT_TEMPLATE.md`

Правила режима triage/fix:
- Обязательно пройти корреляцию **Sentry → Loki → Prometheus** до уверенной классификации root cause; не останавливаться только на Sentry (имена дашбордов и центральный индекс — в april-worker, см. `docs/OBSERVABILITY.md`).
- Собрать перед фиксом: Sentry issue, route, `requestId`/`correlationId`, роль (Keycloak), `tenant`, окружение.
- Проверять слои: frontend/виджет → при необходимости Hub BFF (april-worker) → april-profile API → downstream → infra.
- Не дублировать IAM в обход Keycloak; не нарушать redaction/PII; схема БД только через Atlas при необходимости.
- Итог — по формату отчёта из `docs/AGENT_ERROR_TRIAGE_PROMPT.md` + `docs/AGENT_REPORT_TEMPLATE.md` для задач в `tasks/`.

--- TASK START ---
[ВСТАВЬ ЗАДАЧУ / ОПИСАНИЕ ИНЦИДЕНТА]
--- TASK END ---
```
