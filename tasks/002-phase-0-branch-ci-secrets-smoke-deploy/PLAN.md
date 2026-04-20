# План: Фаза 0 (часть 2) — CI, секреты, деплой-путь, smoke на dev

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-17
- **Статус плана:** выполнен (2026-04-20: отчёт [`REPORT.md`](./REPORT.md), `PROJECT_DEFAULTS` — фактический стенд; branch protection — исключение GitHub API / UI см. отчёт)

## Исходные допущения
- Значения `DEPLOY_ROOT`, `RUNNER_LABEL_EXTRA`, `GITHUB_REPO_SLUG` согласованы в документации в рамках задачи **001**.
- Self-hosted runner уже установлен или будет настроен владельцем dev-хоста с labels `self-hosted`, `dev`, `<RUNNER_LABEL_EXTRA>`.
- Прямой push в `develop` должен быть исключён branch protection ([`DEPLOYMENT_STRATEGY` §1](../../docs/DEPLOYMENT_STRATEGY.md)).

## Порядок работ (шаги)
1. Убедиться, что задача **001** закрыта или что ключевые константы в [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md) не будут меняться задним числом после выставления `APRIL_DEPLOY_ROOT`.
2. В GitHub: **Settings -> Secrets and variables -> Actions** — проверить/добавить `SUBMODULES_TOKEN` (PAT с доступом к submodule DisignApril при необходимости); зафиксировать в `REPORT.md` факт настройки без утечки значения.
3. В GitHub: **Settings -> Variables -> Actions** — задать `APRIL_DEPLOY_ROOT` равным пути git-клона на сервере (как `DEPLOY_ROOT` в PROJECT_DEFAULTS).
4. На dev-сервере: клон репозитория в каталоге `APRIL_DEPLOY_ROOT`, права `deploy`/`runner`, наличие `deploy.sh` и docker compose по [`docs/ADMIN_DEV_SERVER.md`](../../docs/ADMIN_DEV_SERVER.md).
5. В GitHub: включить **branch protection** для `develop` (требовать PR, запрет прямого push при возможности).
6. Выполнить merge в `develop`, дождаться успешного **Deploy to dev**, выполнить smoke по [`DEPLOYMENT_STRATEGY` §9](../../docs/DEPLOYMENT_STRATEGY.md); дополнить описание smoke в `README` или `DEPLOYMENT_STRATEGY`, если не хватает явного чеклиста для «пока нет backend».

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не затрагивается |
| GitHub | Branch protection, Secrets, Variables |
| Инфра / сервер | Путь клона, runner labels (сверка с workflow) |
| Документация | README / DEPLOYMENT_STRATEGY / ADMIN — чеклисты smoke и секретов |

## Риски и откат
- **Риск:** workflow deploy падает из-за неверного пути или прав на сервере -> **Митигация:** проверить `test -d "${ROOT}/.git"` и логи первого шага job; сверить с `APRIL_DEPLOY_ROOT`.
- **Риск:** submodule checkout в CI падает без `SUBMODULES_TOKEN` -> **Митигация:** использовать PAT или публичный submodule; задокументировать в README.
- **Откат:** откат переменной `APRIL_DEPLOY_ROOT` к предыдущему значению; откат коммита только через обычный git revert на `develop`.

## Проверка после выполнения
- Команды из `TASK.md`: `make openapi-lint`, `make docs-build`, `make frontend-build` при изменении доков.
- Ручная: Actions -> успешный run **Deploy to dev**; smoke по чеклисту в отчёте.

## Примечания
- Координация с владельцами AprilHub при расхождении URL/ OIDC — см. [родительский `PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), «Порядок работ», шаг 1.
- Обновления плана: при смене основной ветки интеграции — сверить с [`TESTING_STRATEGY`](../../docs/TESTING_STRATEGY.md) и `ci.yml` (`BASE_REF` для openapi-compat).
