# Администратор: Git и dev-сервер

Пошаговый план для первичной настройки доступа к репозиторию и dev-стенда. Значения хоста, пользователя и каталога задайте в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md); при копировании шаблона — [`guides/FORK_AND_CUSTOMIZE.md`](./guides/FORK_AND_CUSTOMIZE.md). Детали деплоя — [`DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md).

## 1. Git и GitHub

1. Создайте SSH-ключ (ed25519): `ssh-keygen -t ed25519 -C "your_email@example.com"`.
2. Добавьте **public** ключ в GitHub.
3. Клонируйте репозиторий: `git clone git@github.com:<org>/<repo>.git`.
4. Ветки: разработка в `feature/*` или `fix/*`, merge в `develop` через PR; при branch protection — не пушить напрямую в `main`/`develop`.

## 2. Сервер Debian 13 (`DEV_HOST`)

1. **DNS:** A-запись `DEV_HOST` → IP сервера.
2. **Пользователь ОС:** **`DEPLOY_USER`** с входом по SSH-ключу.
3. **Firewall:** **22/tcp**, **80/tcp**, **443/tcp**; дополнительные порты (например для Structurizr Lite) — по политике сети.
4. **Docker:** Docker Engine и Compose v2; пользователь деплоя в группе `docker`.
5. **Каталог:** `sudo mkdir -p <DEPLOY_ROOT> && sudo chown $USER:$USER <DEPLOY_ROOT>`; клон репозитория в **`DEPLOY_ROOT`**. Выкладка: **`./deploy.sh`** в этом каталоге.
6. **Секреты:** `.env`, `images.env` на сервере не коммитить; шаблоны — в репозитории.

## 3. GitHub Actions runner (self-hosted на `DEV_HOST`)

Цель: runner с labels **`self-hosted`**, **`dev`**, **`RUNNER_LABEL_EXTRA`** и клон в **`DEPLOY_ROOT`**, откуда workflow вызывает **`deploy.sh`** (см. `.github/workflows/dev-deploy.yml`).

1. **ПО:** Docker + Compose v2, Node.js 18+, npm, `git`, `curl`; пользователь в группе **`docker`**.
2. **Доступ к GitHub:** deploy key или credentials для `git fetch` на сервере.
3. **Каталог деплоя:** **`DEPLOY_ROOT`**, ветка `develop`, **`deploy.sh`**, локальный **`.env`**.
4. **Runner:** [actions/runner](https://github.com/actions/runner/releases), `./config.sh`, labels **`dev`** и **`RUNNER_LABEL_EXTRA`**.
5. При необходимости — скрипт донастройки (создание каталога, systemd для runner) — по политике команды.
6. **Проверка:** runner **Idle** в GitHub; после merge в **`develop`** запускается **Deploy to dev**.
7. Путь к клону: variable **`APRIL_DEPLOY_ROOT`** в настройках репозитория, если не совпадает с умолчанием в workflow.

## 4. Проверка документации на dev

После выкладки статики и `docker compose up` проверьте сайт, `/swagger/`, при необходимости порт Structurizr Lite.
