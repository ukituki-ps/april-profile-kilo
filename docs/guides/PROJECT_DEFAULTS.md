---
sidebar_position: 1
---

# Проектные значения (AprilProfile)

Каноничные имена и пути для репозитория **AprilProfile** (`ukituki-ps/april-profile`). При смене стенда или DNS обновите эту таблицу и связанные документы ([`FORK_AND_CUSTOMIZE.md`](./FORK_AND_CUSTOMIZE.md), в корне репозитория также `docs/DEPLOYMENT_STRATEGY.md`, `openapi/openapi.yaml`).

| Имя | Значение | Назначение |
| --- | -------- | ---------- |
| `DEV_HOST` | `dev.profile.april.ukituki.tech` | Публичный хост dev-стенда (документация, gateway за reverse proxy) |
| `DEPLOY_ROOT` | `/opt/april-profile` | Каталог git-клона на сервере деплоя |
| `DEPLOY_USER` | `deploy` | Пользователь ОС для SSH и runner |
| `GITHUB_REPO_SLUG` | `ukituki-ps/april-profile` | Репозиторий в `git@github.com:` |
| `RUNNER_LABEL_EXTRA` | `april-profile` | Доп. label self-hosted runner (вместе с `self-hosted`, `dev`) |
| `APRIL_DEPLOY_ROOT` | как `DEPLOY_ROOT` | Имя **repository variable** в GitHub Actions; если переменная **не** задана, workflow использует дефолт из [`.github/workflows/dev-deploy.yml`](../../.github/workflows/dev-deploy.yml) (**`/opt/april-profile`**). |

### Фактический dev-стенд (апрель 2026)

На хосте **192.168.1.42** (Orange Pi, пользователь ОС **`ukituki`**, без выделенного `sudo` под каталог в `/opt`) задано:

| Параметр | Значение |
| -------- | -------- |
| Каталог клона / **`APRIL_DEPLOY_ROOT` в GitHub** | `/home/ukituki/april-profile` |
| Self-hosted runner (второй процесс, репозиторий `april-profile`) | `~/actions-runner-april-profile`, labels `self-hosted`, `dev`, `april-profile` |
| Порты HTTP (на том же сервере уже заняты **8080** / **8091** под `april-worker`) | в **`~/april-profile/.env`**: при необходимости override; в compose по умолчанию **`DOCS_HTTP_PORT=18080`**, **`STRUCTURIZR_HTTP_PORT=18092`** (блок **1808x** вместе с API **18081**) |
| Postgres для compose и миграций | В том же **`.env`**: `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / **`POSTGRES_PORT`** (по умолчанию в compose **15432** на хосте, если занят 5432). `scripts/run-migrations.sh` подключается к `127.0.0.1:${POSTGRES_PORT}`; внутри сети compose по-прежнему `postgres:5432`. |

Публичный **`DEV_HOST`** (`dev.profile.april.ukituki.tech`) при необходимости направляют на этот хост reverse proxy; для smoke по IP (при дефолтных портах compose): доки **`http://192.168.1.42:18080/`**, Structurizr Lite **`http://192.168.1.42:18092/`** (если в `.env` заданы другие значения — подставьте их).

При переносе клона в **`/opt/april-profile`** обновите **variable** `APRIL_DEPLOY_ROOT` в GitHub и эту таблицу.

**OIDC / Keycloak (целевые имена для dev, источник RBAC — Keycloak):**

| Имя | Значение | Примечание |
| --- | -------- | ---------- |
| Realm (целевой) | `april` | Уточнить у администраторов Keycloak на стенде |
| Client ID (SPA / OIDC public, PKCE) | `april-profile-web` | Редиректы и web origins — по политике стенда |
| Client ID (resource server / audience API) | `april-profile-api` | Проверка `aud` / `azp` в backend |

Workflow ожидает runner с `runs-on: [self-hosted, dev, april-profile]`.

### Примечание по gateway (OpenAPI)

**`DEV_HOST`** зафиксирован: `dev.profile.april.ukituki.tech`. Базовый URL API в OpenAPI — **`https://<DEV_HOST>/api`**; при смене префикса публичного API или схемы BFF обновите `openapi/openapi.yaml` и согласуйте с владельцами AprilHub (см. `tasks/000-full-service-aprilhub-roadmap/PLAN.md`, фаза 0).
