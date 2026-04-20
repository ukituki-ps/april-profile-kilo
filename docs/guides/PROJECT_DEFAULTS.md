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
| `APRIL_DEPLOY_ROOT` | как `DEPLOY_ROOT` | Имя **repository variable** в GitHub Actions; ожидаемый путь на сервере — **`/opt/april-profile`**, если переменная не задана (см. `.github/workflows/dev-deploy.yml`) |

**OIDC / Keycloak (целевые имена для dev, источник RBAC — Keycloak):**

| Имя | Значение | Примечание |
| --- | -------- | ---------- |
| Realm (целевой) | `april` | Уточнить у администраторов Keycloak на стенде |
| Client ID (SPA / OIDC public, PKCE) | `april-profile-web` | Редиректы и web origins — по политике стенда |
| Client ID (resource server / audience API) | `april-profile-api` | Проверка `aud` / `azp` в backend |

Workflow ожидает runner с `runs-on: [self-hosted, dev, april-profile]`.

### Примечание по gateway (OpenAPI)

**`DEV_HOST`** зафиксирован: `dev.profile.april.ukituki.tech`. Базовый URL API в OpenAPI — **`https://<DEV_HOST>/api`**; при смене префикса публичного API или схемы BFF обновите `openapi/openapi.yaml` и согласуйте с владельцами AprilHub (см. `tasks/000-full-service-aprilhub-roadmap/PLAN.md`, фаза 0).
