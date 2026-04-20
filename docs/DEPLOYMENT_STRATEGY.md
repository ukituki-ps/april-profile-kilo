# Стратегия деплоя (dev): GitHub Actions + self-hosted runner

Документ для агента и команды: зафиксированные решения и порядок шагов для деплоя на **dev-хост** (`DEV_HOST`). Конкретные значения — в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md); при копировании шаблона замените их по [`guides/FORK_AND_CUSTOMIZE.md`](./guides/FORK_AND_CUSTOMIZE.md).

Конкретные значения для **AprilProfile** — в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md): `DEV_HOST` = `dev.profile.april.ukituki.tech`, **`DEPLOY_ROOT`** = `/opt/april-profile`.

## 1. Репозиторий и триггеры

| Решение | Значение |
|--------|----------|
| Репозиторий | Один (монорепозиторий) |
| Ветка деплоя на dev | `develop` |
| Когда деплоим | Только после merge PR в `develop` |

**Практика для GitHub Actions:** workflow запускается на **`push` в `develop`** (merge PR даёт такой push). Чтобы исключить прямой push в `develop`, на GitHub включается **branch protection** для `develop` (запрет прямых push, обязательный PR). Тогда событие `push` в `develop` по смыслу соответствует «приняли PR».

**Реализация в репозитории:** workflow **Deploy to dev** (файл `.github/workflows/dev-deploy.yml`) на **self-hosted** runner с labels **`dev`** и **`RUNNER_LABEL_EXTRA`** (для AprilProfile: `april-profile`) выполняет в каталоге клона (**`DEPLOY_ROOT`**, для AprilProfile: `/opt/april-profile`) `git fetch`, переход на коммит **`github.sha`**, затем **`SKIP_GIT_PULL=1 ./deploy.sh`**. Путь к клону можно переопределить **repository variable** `APRIL_DEPLOY_ROOT`. Ручной перезапуск того же сценария — **Actions → Deploy to dev → Run workflow** (`workflow_dispatch`).

### 1a. Branch protection (чеклист GitHub)

Настройки выполняет **владелец репозитория** в UI GitHub. Факт включения (без секретов) удобно фиксировать в `REPORT.md` соответствующей задачи (например [`tasks/002-phase-0-branch-ci-secrets-smoke-deploy/REPORT.md`](../tasks/002-phase-0-branch-ci-secrets-smoke-deploy/REPORT.md)).

**Ветка `develop` (интеграционная; merge через PR):**

- [ ] **Settings → Branches → Add branch protection rule** — pattern: `develop`
- [ ] **Require a pull request before merging** — включено
- [ ] (рекомендуется) **Require approvals** — не менее одного согласованного ревьюера
- [ ] (рекомендуется) **Require status checks to pass before merging** — добавить обязательные проверки из workflow **CI** (`.github/workflows/ci.yml`). Имена jobs в UI GitHub совпадают с полем **`name:`** в YAML (не с ключом job):
  - `OpenAPI compatibility (no breaking changes)`
  - `Lint OpenAPI and build docs`
  - `Frontend (design system + shell)`
- [ ] Ограничения для администраторов и обход правил — по политике организации (**Do not allow bypassing** / **Include administrators**)

**Ветка `main`** (при политике «релиз только через PR»):

- [ ] Аналогично `develop` или строже — по согласованию с командой

**Приватный репозиторий и API:** для частных репозиториев вызовы REST **`PUT /repos/.../branches/.../protection`** и чтение protection могут возвращать **403** с требованием **GitHub Pro** или публичной видимости — тогда правило создаётся **только в UI** (см. чеклист выше) либо меняется тариф/политика org. Зафиксируйте исключение в отчёте задачи ([`tasks/002-phase-0-branch-ci-secrets-smoke-deploy/REPORT.md`](../tasks/002-phase-0-branch-ci-secrets-smoke-deploy/REPORT.md)).

Если branch protection временно невозможна по другим причинам (ограничения org без Pro), зафиксируйте **явное исключение** и владельца решения в отчёте задачи.

## 2. Runner

| Решение | Значение |
|--------|----------|
| Размещение | Тот же сервер, что обслуживает `DEV_HOST` (для AprilProfile: `dev.profile.april.ukituki.tech`) |
| Охват | Один runner на все репозитории |
| Администрирование | Вручную: обновления и перезапуск `actions.runner` |
| Labels | `dev`, **`RUNNER_LABEL_EXTRA`** — jobs указывают `runs-on` с этими labels (для AprilProfile: `dev`, `april-profile`) |

| Решение | Значение |
|--------|----------|
| Пользователь ОС | `DEPLOY_USER` (задайте на сервере; в шаблоне часто отдельный пользователь `deploy`) |
| Docker | Доступ через группу **`docker`**, прав достаточно для деплоя |

## 3. Секреты и переменные Actions

- **GitHub Secrets** — всё, что нужно CI (логин в ghcr при публикации образов, токены для приватных submodule и т.д.).
- **GitHub Variables** (repository) — неконфиденциальные параметры, например путь деплоя **`APRIL_DEPLOY_ROOT`**.
- **На сервере** — `.env` и при необходимости отдельные env-файлы вне репозитория в каталоге **`DEPLOY_ROOT`** (для AprilProfile: `/opt/april-profile`; см. [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md)).

### 3a. Имена для текущих workflows (значения не коммитить)

| Имя | Где задать | Назначение |
|-----|------------|------------|
| `SUBMODULES_TOKEN` | **Settings → Secrets and variables → Actions → Secrets** | PAT с доступом **Contents: Read** к приватному submodule **DisignApril** (`ukituki-ps/DisignApril`), если submodule недоступен через `GITHUB_TOKEN`. В [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (job `frontend`) и [`.github/workflows/bootstrap-ci.yml`](../.github/workflows/bootstrap-ci.yml) задан fallback на `github.token`, если секрет пуст — при публичном submodule или достаточных правах токена секрет можно не задавать. |
| `APRIL_DEPLOY_ROOT` | **Settings → Variables → Actions** | Абсолютный путь к git-клону на dev-хосте; должен совпадать с **`DEPLOY_ROOT`** в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md) (для AprilProfile: `/opt/april-profile`). Если переменная не задана, workflow использует значение по умолчанию из `dev-deploy.yml`. |

**После появления публикации образов в ghcr.io** добавьте в этот список секреты для `docker login ghcr.io` (или эквивалент в workflow), имена — по фактической реализации job сборки/push; до появления таких jobs дополнительные секреты для registry не обязательны.

Ограничение workflow по путям/файлам: **не используется** — любой merge в `develop` ведёт к полному пайплайну.

## 4. Сборка и registry

| Решение | Значение |
|--------|----------|
| Registry | **ghcr.io** |
| Теги образов | **Только `git sha`** (без обязательных `latest` / `dev`) |
| Multi-arch | Нет |

## 5. Каталог деплоя и compose

| Решение | Значение |
|--------|----------|
| Путь на сервере | `DEPLOY_ROOT` (для AprilProfile: `/opt/april-profile`) |
| Обновление исходников на сервере | **`git pull`** в этом каталоге |
| Инструмент | **`docker compose` v2** |
| Файлы | `docker-compose.yml` + overrides |

### Версии образов и источник истины

- **Теги образов (SHA)** задаются через **`.env`** и/или отдельный **`images.env`** на сервере. Compose-файлы в git ссылаются на переменные (например `IMAGE_TAG_BACKEND=${BACKEND_SHA}`), а конкретные значения подставляются из этих файлов.
- **`images.env` (и при необходимости server-local override)** — **не коммитятся** в репозиторий (или коммитится только шаблон без секретов). Так `git pull` в **`DEPLOY_ROOT`** не перезаписывает задеплоенные версии образов и не требует обратных коммитов из CI.

## 6. База данных и миграции

| Решение | Значение |
|--------|----------|
| PostgreSQL | Контейнер на том же хосте |
| Резервная копия перед изменением БД | Перед миграциями и `docker compose up` **обязательно** снять дамп БД dev-стенда командой **`pg_dump`** (путь хранения и ротация — зафиксировать в скрипте/репо при появлении кода) |
| Миграции | Отдельный шаг **до** `docker compose up` |
| Откат | При неуспехе — авто-откат миграций + откат образов (реализация «down» должна быть предусмотрена в tooling миграций) |

## 7. Сеть, Nginx, домен

| Решение | Значение |
|--------|----------|
| Health / readiness | Проверка по **внутреннему порту** |
| Nginx | В контейнере; обновление через compose, не reload nginx на хосте |

## 8. Keycloak и остальная архитектура

- **Keycloak** — в том же compose; redirect URI при каждом деплое **не меняются**.
- **AprilNflow и прочие компоненты** из архитектуры разворачиваются самостоятельно (в compose / те же процедуры), чтобы стенд был полным.

## 9. Качество после деплоя (smoke)

### Фаза 0 — инфраструктурный smoke (без Go API)

Пока в репозитории нет сервиса с **`/healthz`** / **`/readyz`**, проверка на **dev** после деплоя — **инфраструктурная**:

1. Workflow **Deploy to dev** завершился успешно (зелёный run в GitHub Actions для commit после merge в `develop`).
2. На сервере в каталоге деплоя (**`DEPLOY_ROOT`**): контейнеры в ожидаемом состоянии — например `docker compose ps` (или эквивалент, зашитый в `deploy.sh`).
3. **HTTP:** доступность документации и статики по согласованному хосту — см. [`PROJECT_DEFAULTS`](./guides/PROJECT_DEFAULTS.md) (`DEV_HOST` для AprilProfile: `dev.profile.april.ukituki.tech`): главная Docusaurus, при настроенных маршрутах — `https://<DEV_HOST>/openapi/openapi.yaml`, `https://<DEV_HOST>/swagger/` (подробнее — §13).
4. **Keycloak / логин** в smoke — **опционально** до готовности маршрутов и IdP на стенде; при недоступности — зафиксировать блокер и владельца стенда в отчёте задачи.

**Расширение DoD:** после фазы 1 (появление API) добавьте вызовы **`/healthz`** и **`/readyz`** по внутреннему порту и публичным маршрутам — см. [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md).

### Целевой набор после появления backend и полного стека

После успешного `up`:

1. Один endpoint (smoke API), в т.ч. health/readiness по политике §7.
2. Логин (через Keycloak / согласованный сценарий).
3. E2E (минимальный прогон) — см. [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md).

**Артефакты в CI:** логи релевантных шагов, вывод `docker compose ps`, версия **commit** (и при необходимости digest образов).

## 10. Отказоустойчивость и «last good»

| Решение | Значение |
|--------|----------|
| Авто-rollback при failed healthcheck | Да |
| Downtime на dev | Допустим |

### Где хранить успешный релиз (согласованная модель)

1. **Git tag** — метка успешного деплоя на **commit** (например `deploy/dev-last-good` перемещается на последний зелёный commit, или используется отдельный префикс тегов по окружениям). По тегу однозначно восстанавливается код и ожидаемые версии в git.
2. **Теги образов на сервере** — **источник истины в рантайме**: файл **`images.env`** (и при необходимости server-local override), обновляемый пайплайном при успешном деплое. Так не нужно править закоммиченный `docker-compose.yml` при каждом релизе и нет конфликта с `git pull`.

При rollback: откатить **images.env** к предыдущим SHA, при необходимости выполнить откат миграций, затем `compose pull` / `up`, снова health + smoke.

## 11. Операционка

- Ручной redeploy на сервере: из каталога клона (**`DEPLOY_ROOT`**, для AprilProfile: `/opt/april-profile`) выполнить **`./deploy.sh`** (обёртка над шагами ниже; см. `--help` и переменные `SKIP_*`). Альтернатива — отдельный job в GitHub Actions (`workflow_dispatch`) по согласованию с командой.
- Уведомления (Telegram, Slack, email): не используются.

## 12. Порядок шагов для агента (скелет pipeline)

1. Job на runner с labels `self-hosted`, `dev`, **`RUNNER_LABEL_EXTRA`** (для AprilProfile: `april-profile`), ref = commit после merge в `develop`.
2. Сборка и тесты (как принято в репо).
3. Сборка образов, push в ghcr.io с тегом по **git sha**.
4. На сервере: `cd` в **`DEPLOY_ROOT`** → **`./deploy.sh`** (внутри: `git pull`, при необходимости хуки `scripts/db-backup.sh` / `scripts/run-migrations.sh`, `make openapi-lint`, `make docs-build`, `docker compose pull` → `up -d` с учётом `.env` и **`images.env`**). Либо те же шаги вручную: `git pull` → п.5–8.
5. Обновить **`images.env`** / `.env` под новые SHA образов (часто делает CI перед вызовом деплоя или вручную до/после `git pull`).
6. **Обязательно** снять дамп БД dev-стенда: **`pg_dump`** (до миграций и поднятия compose) — в скрипте деплоя: исполняемый **`scripts/db-backup.sh`**, если добавлен в репозиторий.
7. Миграции (отдельная команда **до** `up`) — **`scripts/run-migrations.sh`**, если добавлен.
8. `docker compose pull` → `docker compose up -d` (с overrides) — входит в **`deploy.sh`**.
9. Health по внутреннему URL/порту → smoke: endpoint → логин → E2E.
10. Успех: обновить **images.env** как зафиксированный good (если ещё не записан), поставить/сдвинуть **git tag** успешного деплоя, загрузить артефакты (логи, `docker compose ps`, commit).
11. Провал: откат миграций (по политике) + откат **images.env** на предыдущие SHA из last good + при необходимости `git checkout` на commit по тегу; снова health; fail job при повторном провале.

## 13. Документация (Docusaurus, OpenAPI, Structurizr) на dev

Цель — **те же команды**, что локально (`make docs-build`, `make openapi-lint`, `docker compose config`), плюс выкладка артефактов на сервер.

### Локально и в CI

- На **pull request** и **push** в `main` / `develop`: workflow **CI** (`.github/workflows/ci.yml`) на GitHub-hosted runner выполняет `make openapi-lint` и `make docs-build` (без деплоя).
- Сборка сайта: из корня репозитория `make docs-build` (внутри: `npm ci` + `npm run build` в `docs-site/`).
- Проверка OpenAPI: `make openapi-lint` (Redocly, конфиг `redocly.yaml`).
- Просмотр через Compose: после `make docs-build` — `docker compose up -d`; Nginx раздаёт `docs-site/build`, пути `/openapi/`, `/swagger/`; Structurizr Lite — отдельный порт (см. `.env.example`).

### На dev-хосте (`DEV_HOST`, для AprilProfile: `dev.profile.april.ukituki.tech`)

1. После `git pull` в **`DEPLOY_ROOT`** — **`./deploy.sh`** (включает `make docs-build`; нужны Node.js 18+ и npm на сервере, либо собрать статику в CI и скопировать артефакт — по договорённости) или вручную `make docs-build`.
2. Поднять/обновить сервисы — шаг `docker compose up -d` внутри **`deploy.sh`** с тем же `docker-compose.yml` (порты и TLS — за reverse proxy/Nginx на хосте или в отдельном контейнере; TLS не хранить в репозитории).
3. Проверить в браузере: главная страница документации (статика Docusaurus), `https://<host>/openapi/openapi.yaml`, `https://<host>/swagger/`, при открытом в firewall порте — Structurizr Lite на согласованном порту.

Когда появятся образы приложений и отдельный compose-профиль, документацию можно вынести в тот же compose-стек или оставить отдельным профилем `docs` — важно зафиксировать один способ в этом документе при первом полном деплое.

Первичная настройка Git и сервера: [`ADMIN_DEV_SERVER.md`](./ADMIN_DEV_SERVER.md).
