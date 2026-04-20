# Задача: Фаза 0 (часть 1) — плейсхолдеры, OIDC/gateway/runner, связь с AprilHub в доках

## Мета
- **ID / ветка:** (по договорённости, например `docs/phase-0-defaults-hub`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — в [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md) раздел **«Фаза 0 — Репозиторий, дефолты, выравнивание с AprilHub»**, блок **«Сначала»** (строки ~36–37).
- **Связанные подзадачи:** следующая по фазе — [`tasks/002-phase-0-branch-ci-secrets-smoke-deploy/`](../002-phase-0-branch-ci-secrets-smoke-deploy/) (зависит от согласованных значений из этой задачи).
- **Связанные документы:** [`task_list.md`](../../task_list.md), [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md), [`docs/guides/FORK_AND_CUSTOMIZE.md`](../../docs/guides/FORK_AND_CUSTOMIZE.md), [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md), [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md)

## Цель
Заменить шаблонные плейсхолдеры хостов и путей на согласованные значения для **AprilProfile**, зафиксировать **имена** для OIDC-клиента (как будет называться в Keycloak/интеграции), публичного **gateway** (базовый URL API в OpenAPI и доках) и **labels self-hosted runner**; кратко описать в репозитории, **как** сервис будет подключаться к общему контуру AprilHub (метрики и логи — по runbook [april-worker](https://github.com/ukituki-ps/april-worker)); обновить [`task_list.md`](../../task_list.md) со ссылками на подзадачи фазы 0.

## Контекст для агента
- Опора на [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md) и [`README.md`](../../README.md): observability задаётся **AprilHub**, полный стек не копируется без отдельного ADR.
- Упомянутые файлы в Cursor: @docs/guides/PROJECT_DEFAULTS.md @docs/guides/FORK_AND_CUSTOMIZE.md @README.md @openapi/openapi.yaml @docs/DEPLOYMENT_STRATEGY.md @docs/ADMIN_DEV_SERVER.md @.github/workflows/dev-deploy.yml @docs-site/docusaurus.config.ts (при смене URL/имени сайта)

## Входит в объём
- Заполнить/уточнить таблицу в [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md): `DEV_HOST`, `DEPLOY_ROOT`, `DEPLOY_USER`, `GITHUB_REPO_SLUG`, `RUNNER_LABEL_EXTRA`, согласованное значение для `APRIL_DEPLOY_ROOT` (как имя переменной и ожидаемый путь на сервере).
- Синхронизировать с этими значениями: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md), [`docs/ADMIN_DEV_SERVER.md`](../../docs/ADMIN_DEV_SERVER.md) — примеры хоста, SSH, путей, labels (заменить оставшиеся `april_template` / `dev.example.com`, если ещё есть).
- **Runner:** обновить [`.github/workflows/dev-deploy.yml`](../../.github/workflows/dev-deploy.yml) — `runs-on: [self-hosted, dev, <RUNNER_LABEL_EXTRA>]` в соответствии с зафиксированным `RUNNER_LABEL_EXTRA`; при необходимости упоминания labels в других workflow-доках/README.
- **Gateway / OpenAPI:** согласовать и подставить базовый URL API в [`openapi/openapi.yaml`](../../openapi/openapi.yaml) (`servers`) под публичный gateway dev; выровнять формулировки в [`docs/guides/FORK_AND_CUSTOMIZE.md`](../../docs/guides/FORK_AND_CUSTOMIZE.md) §1.
- **OIDC:** зафиксировать **целевые имена** (realm/client id или согласованный префикс клиента для AprilProfile на dev) в одном месте — минимум таблица в `PROJECT_DEFAULTS.md` или короткий подраздел в [`README.md`](../../README.md) / [`docs/auth-jwt-keycloak-adapted.md`](../../docs/auth-jwt-keycloak-adapted.md) со ссылкой на Keycloak как источник RBAC; без реализации backend.
- **AprilHub:** дополнить [`README.md`](../../README.md) (раздел про Hub) или добавить краткую заметку с явными ссылками на runbook'и april-worker (например `docs/runbooks/`, `docs/guides/OBSERVABILITY_INDEX.md` в репо april-worker — путь уточнить по актуальной структуре upstream): что сервис **экспортирует** (например будущий `GET /metrics`, формат логов для Promtail/Loki) и что **не** дублируется локально.
- Проверить [`task_list.md`](../../task_list.md): раздел **Инициализация** содержит пункты фазы 0 со ссылками на `tasks/001-…` и `tasks/002-…`; при смене формулировок задач — актуализировать.

## Не входит в объём
- Настройка branch protection и секретов GitHub — задача [`002-phase-0-branch-ci-secrets-smoke-deploy`](../002-phase-0-branch-ci-secrets-smoke-deploy/).
- Реализация `/metrics`, Go-кода, миграций Atlas — фазы 1 и 4.1 дорожной карты.
- Полноценный ADR «подключение к Hub» — **только если** команда фиксирует отклонение от runbook april-worker; тогда оформить отдельной задачей или явным follow-up в `REPORT.md` (не блокирует закрытие этой задачи).

## Заглушки и зависимости от внешнего контура
- **До готовности финальных URL BFF/OIDC на стенде:** допустимы согласованные **предварительные** значения с пометкой в `PROJECT_DEFAULTS.md` (дата/статус «черновик»); ссылка на дорожную карту: [«Порядок работ» в `PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md) (шаг 1 — контракт с владельцами Hub).
- **Метрики/логи в продакшн-качестве** — заглушка до фазы 1/4.1: в доках описать **ожидаемую** интеграцию по april-worker, без обязательства уже работающего endpoint на dev.

## Технические ограничения
- Стек и границы — [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md); не предлагать замену Keycloak, Prometheus/Loki-стека экосистемы и т.д.
- OpenAPI — единственный каноничный файл спецификации для публичного API на данном этапе: [`openapi/openapi.yaml`](../../openapi/openapi.yaml); правки `servers` — согласованы с gateway, без выдуманных путей без пометки.
- Секреты и значения токенов не коммитить; в репозитории — только имена переменных и ссылки на [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md).

## Критерии готовности (acceptance)
- [ ] Таблица `PROJECT_DEFAULTS` заполнена осмысленными значениями для AprilProfile; нет противоречий с `dev-deploy.yml` и документами деплоя.
- [ ] Имена **OIDC / gateway / runner labels** зафиксированы и согласованы между `openapi.yaml`, workflow и гайдами (поиск по репо не находит устаревший `template` в `runs-on`, если label сменили).
- [ ] В `README` или рядом зафиксировано **как** сервис подключается к контуру Hub (метрики/логи по подходу april-worker), со ссылками на upstream-доки.
- [ ] [`task_list.md`](../../task_list.md) в разделе инициализации отражает подзадачи фазы 0 со ссылками на папки `tasks/001-…` и `tasks/002-…` (или обновлён исполнителем при уточнении названий).
- [ ] Команды проверки проходят (см. ниже).

## Проверка (команды)
```bash
# Документация и OpenAPI (целевой набор из docs/TESTING_STRATEGY.md для quality gate)
make openapi-lint
make docs-build

# Фронт (если трогали только доки — опционально; полный gate перед merge)
make frontend-build
```

## Результат в отчёте
По [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md): перечень изменённых файлов; итоговые значения `DEV_HOST`, `DEPLOY_ROOT`, `RUNNER_LABEL_EXTRA`; ссылка на согласование с владельцами Hub (если было); риски и follow-up (например необходимость ADR).
