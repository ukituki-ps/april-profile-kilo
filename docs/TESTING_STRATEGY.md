# Тестовая стратегия v1 (шаблон / микросервис April)

Документ фиксирует уровни тестирования, инструменты и критические сценарии для v1. Минимальный набор в CI (lint, unit, integration, smoke E2E) и нагрузочные сценарии — см. раздел «Связь с CI и DoD» ниже; стек и наблюдаемость — [AGENT_ARCHITECTURE_CONTEXT.md](./AGENT_ARCHITECTURE_CONTEXT.md).

> **Связь с кодом:** пользовательские сценарии (задачи, роли, конкретные пути API) и таблицы ниже описывают **целевое** поведение продукта. Пока соответствующей реализации в репозитории нет, используйте их как **требования** к тестам и контрактам; текущий CI — см. [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## CI в этом шаблоне (после этапа AprilHub / april-worker)

В [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) зафиксированы минимальные обязательные jobs:

1. **`openapi-compatibility`** — `scripts/check-openapi-compat.sh` и [oasdiff](https://github.com/oasdiff/oasdiff): нет ломающих изменений относительно `origin/develop` для `openapi/openapi.yaml` (если ветки или файла на базе ещё нет, проверка пропускается).
2. **`quality`** — `make openapi-lint` и `make docs-build` (Redocly + Docusaurus).
3. **`backend`** — `go vet ./...`, `go build ./cmd/april-profile`, `docker run … arigaio/atlas migrate validate` (каталог `atlas/migrations/`).
4. **`frontend`** — checkout с **submodules** (для ассетов showcase и `vendor/ds-packs`), затем в `frontend/`: `npm ci`, `npm run lint`, `npm run test`, `npm run build`. Если в `frontend/package.json` зависимости DS с **GitHub Packages** (`npm:@ukituki-ps/…`), перед шагами выставляется `NODE_AUTH_TOKEN` (`secrets.APRIL_NPM_READ_TOKEN` или `secrets.GITHUB_TOKEN`, scope **`read:packages`**, см. `frontend/.npmrc`). При **`file:vendor/ds-packs/*.tgz`** токен для DS **не** нужен. `ds:prepare` **не** запускает `pnpm build` в submodule, если нет `file:` на `design-system/DisignApril/packages/{ui,tokens}` (см. `frontend/scripts/ds-prepare.sh`).

Для веток `feature/*` и `fix/*` дополнительно можно опираться на [`.github/workflows/bootstrap-ci.yml`](../.github/workflows/bootstrap-ci.yml): сборка доков, lint OpenAPI, `docker compose config`, тот же прогон **frontend** (без oasdiff — быстрее обратная связь на ранних коммитах).

**Расширение контура под продукт:** эталон «полного» quality gate с backend, SPA, smoke и k6 — репозиторий [april-worker](https://github.com/ukituki-ps/april-worker) (AprilHub): см. его [`docs/TESTING_STRATEGY.md`](https://github.com/ukituki-ps/april-worker/blob/develop/docs/TESTING_STRATEGY.md) и [`README.md`](https://github.com/ukituki-ps/april-worker/blob/develop/README.md). При добавлении `go test`, фронтенда или e2e переносите паттерны job’ов оттуда и фиксируйте обязательный набор в этом файле и в README сервиса.

## Принципы

- **Пирамида тестов**: много быстрых unit, меньше integration, узкий слой E2E на критические пользовательские потоки.
- **Контракт API** проверяется в integration; **полные пользовательские сценарии** — в E2E.
- **Миграции БД** в integration-тестах только через **Atlas** (без ручного SQL в тестах как альтернативы миграциям).

---

## Unit

### Backend (Go)

- Уровни: **service / domain / usecase** — изолированные тесты без реальных Postgres/Redis/Keycloak.
- Зависимости подменяются интерфейсами и моками; бизнес-правила и переходы статусов покрываются здесь в первую очередь.

### Frontend (React + TS)

- **Vitest** — раннер и утверждения.
- **React Testing Library (RTL)** — поведение компонентов с точки зрения пользователя.
- **MSW (Mock Service Worker)** — стабильные моки HTTP для API без поднятия backend.

---

## Integration

### Backend (Go)

- **Testcontainers**: реальные **PostgreSQL** и **Redis** в контейнерах на время тестов.
- Схема БД: применение миграций **только через Atlas** (те же артефакты, что в CI и deploy).
- **Keycloak**: один **shared container** на сюит (или фикстура на класс тестов), чтобы не поднимать realm на каждый тест без необходимости.

Типичные проверки: репозитории и SQL, HTTP-handlers с БД, очередь/фоновые джобы при необходимости, взаимодействие с JWT/Keycloak на уровне интеграции.

---

## E2E (Playwright)

Запуск против собранного приложения (или docker-compose профиль для e2e). Фокус на **smoke / критических сценариях**, не на полном регрессе.

Обязательные сценарии v1:

1. **Login → список задач** — успешный вход и отображение списка.
2. **Создание задачи** — создание и появление в списке/переход к карточке.
3. **Назначение исполнителя** — назначение пользователя на задачу.
4. **Смена статуса** — переход статуса по API/UI согласно правилам v1.
5. **Видимость действий по ролям** — UI отражает RBAC (скрытие/доступ к действиям в зависимости от роли из токена/профиля).

---

## Нагрузочное тестирование (в scope v1)

Цель — зафиксировать **базовую пригодность** API к ожидаемому трафику, увидеть **узкие места** (БД, пул соединений, Redis/Asynq, Keycloak при проксировании) и сопоставить результаты с **метриками** из Prometheus/Grafana до того, как нагрузка придёт «с улицы».

### Инструменты

- Предпочтительно **k6** (сценарии на JS, отчёты, пороги `thresholds`, удобно в CI) либо сочетание **Vegeta** / **hey** для узких точечных прогонов.
- Сценарии и конфиги (VUs, duration, stages ramp-up/ramp-down) хранятся в репозитории, параметры окружения — через переменные (base URL, токены, не коммитить секреты).

### Среда

- Прогон **не на продакшене**: отдельный стенд, `dev` с тестовыми данными или одноразовый compose-профиль с тем же образом, что кандидат в релиз.
- Данные: заранее подготовленный **сид** пользователей/задач; для API — пул **валидных JWT** (тестовые пользователи Keycloak или заранее выданные токены с ограниченным TTL), чтобы не упираться в логин в каждом виртуальном пользователе без необходимости.

### Сценарии (минимум v1)

| Сценарий | Смысл проверки |
|----------|----------------|
| **Чтение списка задач** | `GET /api/v1/tasks` с типичными query (пагинация, фильтры) — доминирующий read-path, кэш/индексы Postgres. |
| **Создание задач** | `POST /api/v1/tasks` — write-path, транзакции, аудит. |
| **Смешанная нагрузка** | Например 70–80% чтение / 20–30% создание и точечно смена статуса/назначение — ближе к реальному профилю. |
| **Граница инфраструктуры** | При необходимости отдельный короткий прогон с высоким RPS на ограниченном наборе эндпоинтов — проверка **rate limit** на Nginx и отсутствие «молчаливого» деграда backend. |

Сценарии не обязаны покрывать все эндпоинты v1; важно покрыть **критический путь задач** и зафиксировать методику.

### Метрики и критерии (baseline)

- Из нагрузочного отчёта (k6 и т.п.): **успешность запросов**, **p95/p99 latency** по ключевым операциям.
- Из **Prometheus/Grafana** (см. Observability в [AGENT_ARCHITECTURE_CONTEXT.md](./AGENT_ARCHITECTURE_CONTEXT.md)): за время прогона — latency/error rate приложения, при необходимости **размер очереди Asynq** и ошибки к БД/Redis.
- **Формального SLO** в архитектурных документах не зафиксировано; пороги задаются как **числовой baseline** в документации к релизу (например «p95 GET /tasks < N ms при X RPS на стенде Y») и пересматриваются по мере роста нагрузки.

### Частота и CI

- Минимум: прогон **перед значимым релизом** или по **расписанию** (ночной job), если стенд доступен.
- Полная автоматизация в каждом PR необязательна (долго, зависит от стенда); достаточно **документированного** способа запуска и сохранённых артефактов (отчёт, скрин дашборда).

---

## Связь с CI и DoD

- **Сейчас в шаблоне** в GitHub Actions: проверка обратной совместимости OpenAPI, lint OpenAPI, сборка Docusaurus, **lint/test/build frontend** (дизайн-система + shell) — см. раздел «CI в этом шаблоне» выше.
- **Целевой pipeline** (после появления кода): **lint**, **unit**, **integration**, **smoke E2E** (минимальный DoD для merge в целевую ветку — по политике репозитория; этот документ — источник по содержанию уровней).
- **Нагрузочное тестирование** — в scope v1: сценарии и порядок запуска описаны в этом файле; baseline и артефакты фиксируются в релизной заметке или согласованном артефакте прогона.
- Локальный запуск тестов и переменные окружения описываются в общей документации проекта (раздел «как запускать тесты»).

### Локальный запуск integration (фаза 1)

- Команда: `go test -tags=integration ./...` (или `make integration-test`).
- Требования: запущенный Docker Engine (Testcontainers поднимает PostgreSQL и Redis во время теста).
- Миграции БД в тестах применяются через `atlas migrate apply` с теми же артефактами (`atlas/migrations`), что и в CI/deploy.

---

## Вне scope v1 (на усмотрение позже)

- **Хаос-инжиниринг** (kill node, latency injection) и долгие soak-тесты (сутки+).
- Полное покрытие всех комбинаций ролей и edge-case UI — по мере стабилизации продукта.

---

## ProfilesWidget variant C: обязательная матрица (task 047)

Этот раздел — release-blocking матрица для `ProfilesWidget` после фаз 045/046. Любой релиз виджета считается заблокированным, если не выполнен хотя бы один пункт из блока **Must pass**.

### Must pass: Core unit/integration

- `ProfilesWidgetCore`:
  - первичная загрузка списка;
  - search/filter/sort + cursor pagination;
  - race/abort (list/details);
  - create/update/delete transitions;
  - `onError` payload (`message`, `requestId`, `code`);
  - observability hooks (`list_*`, `details_*`, `save_*`, `view_loaded`).
- `ProfilesWidget` smoke (через API adapter):
  - базовый CRUD happy path;
  - UX-мэппинг `401/403/409` на безопасные сообщения;
  - API-first list/search/filter/pagination.
- `openapiProfilesProvider` integration:
  - DTO mapping list/get/create/update/delete;
  - status->normalized error mapping;
  - extraction `request_id`;
  - wiring `baseUrl`/token/context;
  - `AbortSignal` propagation.

### Must pass: команды

Из корня репозитория:

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

### Blocking fail conditions

- Любой красный тест/линтер/сборка из команд выше.
- Отсутствие тестов provider integration для `openapiProfilesProvider`.
- Отсутствие проверок race/abort/conflict для `ProfilesWidget`.
- Несинхронность docs и фактического release-gate/checklist.
