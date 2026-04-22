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
| `RUNNER_LABEL_EXTRA` | `april-profile` | Доп. label self-hosted runner на **CI-хосте** (вместе с `self-hosted`, `dev`) |
| `RUNNER_LABEL_STAND` | `april-profile-stand` | Доп. label **только** на runner'е **на dev-стенде** (Orange Pi). Job **Deploy to dev** в [`.github/workflows/dev-deploy.yml`](../../.github/workflows/dev-deploy.yml) использует `runs-on: [self-hosted, dev, april-profile-stand]`. На этом runner'е **не** должно быть label `april-profile`, иначе он начнёт забирать CI. |
| `APRIL_DEPLOY_ROOT` | путь на **хосте runner'а job `deploy`**, где лежит клон и вызывается `deploy.sh` | Имя **repository variable** в GitHub Actions; если не задана — дефолт из [`.github/workflows/dev-deploy.yml`](../../.github/workflows/dev-deploy.yml) (**`/opt/april-profile`**). Для AprilProfile job `deploy` идёт на **Orange Pi** (`april-profile-stand`); задайте **`/home/ukituki/april-profile`**. См. блок «Разнесённая топология» ниже. |

### Фактическая топология AprilProfile (апрель 2026)

Чтобы не путать **стенд** и **CI**, зафиксированы два хоста в LAN:

| Роль | IP / DNS | Назначение |
|------|-----------|------------|
| **Dev-стенд** (рантайм: Docker Compose, БД, API за gateway) | **`192.168.1.42`** (Orange Pi, пользователь ОС **`ukituki`**) | Публичный **`DEV_HOST`** `dev.profile.april.ukituki.tech` указывает сюда (reverse proxy / маршрутизация по политике сети). Smoke по IP: доки **`http://192.168.1.42:18080/`**, API (проброс compose) **`http://192.168.1.42:18081/`**, Structurizr Lite **`http://192.168.1.42:18092/`** (если в `.env` другие порты — подставьте их). |
| **Self-hosted runners** (CI, сборка backend-образа) | **`192.168.1.29`** | Jobs с `runs-on: [self-hosted, dev, april-profile]` выполняются **здесь**. |
| **Self-hosted runner на стенде** (только **Deploy to dev** → `deploy.sh` + compose) | **`192.168.1.42`** | Один runner с labels **`self-hosted`**, **`dev`**, **`april-profile-stand`** (без `april-profile`). **`APRIL_DEPLOY_ROOT`** должен указывать на клон на этой машине, например **`/home/ukituki/april-profile`**. |

**Каталог клона на стенде (Orange Pi):** `/home/ukituki/april-profile` (без выделенного `sudo` под `/opt` — путь исторически в `$HOME`).

| Параметр на стенде **192.168.1.42** | Значение |
| ---------------------------------- | -------- |
| Порты HTTP (на хосте могут быть заняты **8080** / **8091** под другие сервисы, например `april-worker`) | в **`~/april-profile/.env`**: при необходимости override; в compose по умолчанию **`DOCS_HTTP_PORT=18080`**, **`STRUCTURIZR_HTTP_PORT=18092`**, backend **`BACKEND_HTTP_PORT=18081`**. |
| Postgres для compose и миграций | В том же **`.env`**: `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / **`POSTGRES_PORT`** (по умолчанию в compose **15432** на хосте). `scripts/run-migrations.sh` подключается к `127.0.0.1:${POSTGRES_PORT}`; внутри сети compose — `postgres:5432`. |

#### Разнесённая топология: runner ≠ стенд

CI и сборка образа остаются на **192.168.1.29** (`april-profile`). Job **Deploy to dev** (`deploy`) выполняется на **192.168.1.42**: runner с меткой **`april-profile-stand`**, **`APRIL_DEPLOY_ROOT=/home/ukituki/april-profile`**. Альтернатива без второго runner'а — SSH/Ansible с .29 на .42 (см. историю обсуждений в репозитории).

При смене IP или переносе клона в **`/opt/april-profile`** обновите **`APRIL_DEPLOY_ROOT`**, DNS и эту таблицу.

**OIDC / Keycloak (целевые имена для dev, источник RBAC — Keycloak):**

| Имя | Значение | Примечание |
| --- | -------- | ---------- |
| Realm (целевой) | `april` | Уточнить у администраторов Keycloak на стенде |
| Client ID (SPA / OIDC public, PKCE) | `april-profile-web` | Редиректы и web origins — по политике стенда |
| Client ID (resource server / audience API) | `april-profile-api` | Проверка `aud` / `azp` в backend |

Workflow **CI / образ** ожидает `runs-on: [self-hosted, dev, april-profile]` (на **192.168.1.29**). **Deploy to dev** (job `deploy`) — `runs-on: [self-hosted, dev, april-profile-stand]` на **192.168.1.42**.

### Примечание по gateway (OpenAPI)

**`DEV_HOST`** зафиксирован: `dev.profile.april.ukituki.tech`. Базовый URL API в OpenAPI — **`https://<DEV_HOST>/api`**; при смене префикса публичного API или схемы BFF обновите `openapi/openapi.yaml` и согласуйте с владельцами AprilHub (см. `tasks/000-full-service-aprilhub-roadmap/PLAN.md`, фаза 0).
