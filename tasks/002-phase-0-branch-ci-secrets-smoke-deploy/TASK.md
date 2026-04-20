# Задача: Фаза 0 (часть 2) — branch protection, секреты CI, APRIL_DEPLOY_ROOT, smoke на dev

## Мета
- **ID / ветка:** (по договорённости, например `chore/phase-0-ci-dev-smoke`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — в [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md) раздел **«Фаза 0»**, блок **«Затем»** (строки ~38–39).
- **Связанные подзадачи:** зависит от [`tasks/001-phase-0-placeholders-oidc-runner-hub-docs/`](../001-phase-0-placeholders-oidc-runner-hub-docs/) (согласованные `DEPLOY_ROOT` / labels / репозиторий должны быть зафиксированы в доках до настройки GitHub и сервера).
- **Связанные документы:** [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md), [`task_list.md`](../../task_list.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md), [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md); детальный порядок — [`PLAN.md`](./PLAN.md) в этой папке.

## Цель
Включить для репозитория практику **merge в `develop` через PR** (branch protection), настроить **секреты CI** (в т.ч. `SUBMODULES_TOKEN` и иные, нужные workflows), задать согласованный **`APRIL_DEPLOY_ROOT`** (repository variable в GitHub + реальный каталог на dev-хосте), убедиться что **smoke после деплоя** описан в репозитории и **выполнен на dev** (с фиксацией результата в отчёте задачи).

## Контекст для агента
- Опора на [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md): деплой по `push` в `develop` после merge PR; self-hosted runner с labels `dev` и `RUNNER_LABEL_EXTRA`; переменная `APRIL_DEPLOY_ROOT` переопределяет путь клону на сервере.
- Упомянутые файлы в Cursor: @.github/workflows/ci.yml @.github/workflows/bootstrap-ci.yml @.github/workflows/dev-deploy.yml @README.md @docs/DEPLOYMENT_STRATEGY.md @docs/ADMIN_DEV_SERVER.md

## Входит в объём
- **Branch protection:** зафиксировать в репозитории требования (какие ветки: минимум `develop`, при необходимости `main`) — в виде чеклиста в [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) или [`docs/ADMIN_DEV_SERVER.md`](../../docs/ADMIN_DEV_SERVER.md), либо коротком абзаце в [`README.md`](../../README.md); выполнение настроек в UI GitHub — с отметкой в `REPORT.md` (агент может подготовить текст, владелец репо применяет).
- **Секреты CI:** документировать обязательные секреты: `SUBMODULES_TOKEN` для checkout submodule DisignApril (см. [`README.md`](../../README.md)); при появлении публикации в ghcr — добавить в чеклист соответствующие секреты по [`DEPLOYMENT_STRATEGY`](../../docs/DEPLOYMENT_STRATEGY.md); убедиться, что [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) и [`.github/workflows/bootstrap-ci.yml`](../../.github/workflows/bootstrap-ci.yml) согласованы с политикой токена.
- **`APRIL_DEPLOY_ROOT`:** согласовать строковое значение с путём **`DEPLOY_ROOT`** из [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md) (задача 001); в GitHub -> **Settings -> Variables -> Actions** создать/обновить `APRIL_DEPLOY_ROOT`; на сервере — клон репозитория по этому пути, права для runner/deploy user ([`docs/ADMIN_DEV_SERVER.md`](../../docs/ADMIN_DEV_SERVER.md)).
- **Smoke после деплоя:** описать минимальный сценарий в репозитории (например раздел в `README`, отсылка к [`DEPLOYMENT_STRATEGY` §9](../../docs/DEPLOYMENT_STRATEGY.md)): что проверяется после успешного workflow **Deploy to dev** (HTTP-доступность, при отсутствии backend — хотя бы отдача статики/docs или `docker compose ps` / health proxy — см. заглушки ниже).
- Выполнить или сопроводить **реальный smoke на dev** после merge в `develop` (координация с владельцем стенда); зафиксировать в [`REPORT.md`](./REPORT.md) дату, commit SHA, что именно проверено.

## Не входит в объём
- Реализация Go `/healthz` — фаза 1; если smoke упирается в отсутствие API, зафиксировать **целевой** smoke из [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) как следующий шаг после фазы 1.
- Изменение логики `deploy.sh` и compose — только если обнаружена явная несовместимость с согласованным `APRIL_DEPLOY_ROOT` (тогда кратко в отчёте).

## Заглушки и mock до появления полного стека
- **Backend health:** пока нет `go` сервиса, smoke на dev трактуется как **инфраструктурный**: успешный деплой workflow, поднятые контейнеры по [`DEPLOYMENT_STRATEGY`](../../docs/DEPLOYMENT_STRATEGY.md), доступность согласованного URL (например доки или nginx). После фазы 1 smoke дополняется вызовом `/healthz` / `/readyz` — указать в `REPORT.md` как расширение DoD.
- **Логин Keycloak** в smoke — опционален до готовности маршрутов; при недоступности IdP на dev — зафиксировать блокер в `REPORT.md` и ссылку на владельца стенда.

## Технические ограничения
- Секреты не коммитить; в git только описание имён и назначения.
- Runner и путь деплоя должны соответствовать зафиксированным в задаче 001 labels и `DEPLOY_ROOT`.
- Расширение CI под `go test` — по мере появления кода ([`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)); в этой задаче не добавлять лишних job без необходимости.

## Критерии готовности (acceptance)
- [ ] Branch protection для интеграционной ветки (`develop`) включена **или** зафиксирован явный блокер/исключение в `REPORT.md` с владельцем решения. *(чеклист в доке + ручное подтверждение в UI; API не верифицирует private без Pro — см. [`REPORT.md`](./REPORT.md) §6.1, §7)*
- [x] `SUBMODULES_TOKEN` (и прочие необходимые секреты для текущих workflows) настроены в GitHub; CI на `develop` проходит после merge.
- [x] `APRIL_DEPLOY_ROOT` в GitHub Variables согласован с документацией и реальным путём на сервере; деплой workflow завершается успешно.
- [x] Smoke после деплоя **описан** в репо и **выполнен на dev**; результат отражён в [`REPORT.md`](./REPORT.md) (команды, вывод, ограничения «до появления backend»).
- [x] Целевые команды проверки по репозиторию (см. ниже) зелёные на ветке после изменений в доках.

## Проверка (команды)
```bash
# Локально / в PR до merge (quality gate)
make openapi-lint
make docs-build
make frontend-build

# После настройки CI — убедиться что workflow на develop зелёный (GitHub Actions UI).
# Smoke на dev — по чеклисту из DEPLOYMENT_STRATEGY §9 и дополнению в REPORT; целевой полный набор после появления кода:
# go test ./...  # когда появится backend
```

## Результат в отчёте
По [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md): скриншоты/описание настроек GitHub (без значений секретов); значение `APRIL_DEPLOY_ROOT`; ссылка на успешный run **Deploy to dev**; шаги smoke и результат; follow-up для фазы 1.
