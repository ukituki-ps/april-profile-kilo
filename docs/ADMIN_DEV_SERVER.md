# Администратор: Git и dev-сервер

Пошаговый план для первичной настройки доступа к репозиторию и dev-стенда. Значения хоста, пользователя и каталога задайте в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md); при копировании шаблона — [`guides/FORK_AND_CUSTOMIZE.md`](./guides/FORK_AND_CUSTOMIZE.md). Детали деплоя — [`DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md).

## 1. Git и GitHub

1. Создайте SSH-ключ (ed25519): `ssh-keygen -t ed25519 -C "your_email@example.com"`.
2. Добавьте **public** ключ в GitHub.
3. Клонируйте репозиторий: `git clone git@github.com:<org>/<repo>.git`.
4. Ветки: разработка в `feature/*` или `fix/*`, merge в `develop` через PR; не пушить напрямую в защищённые ветки (`main`, `develop` — см. [`DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md)).
5. **Branch protection** для `develop` (и при политике команды — для `main`): пошаговый чеклист в [`DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md) §1a; секрет **`SUBMODULES_TOKEN`** и variable **`APRIL_DEPLOY_ROOT`** — §3.

## 2. Сервер стенда (`DEV_HOST`, рантайм compose)

Для AprilProfile публичный **`DEV_HOST`** (`dev.profile.april.ukituki.tech`) ведёт на **dev в LAN** — **`192.168.1.42`** (Orange Pi); каноничные порты и пути — в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md).

1. **DNS:** A-запись `DEV_HOST` → IP сервера стенда (или reverse proxy перед ним).
2. **Пользователь ОС:** **`DEPLOY_USER`** (или фактический пользователь, например `ukituki` на Orange Pi) с входом по SSH-ключу.
3. **Firewall:** **22/tcp**, **80/tcp**, **443/tcp**; дополнительные порты (например для Structurizr Lite) — по политике сети.
4. **Docker:** Docker Engine и Compose v2; пользователь деплоя в группе `docker`.
5. **Каталог:** клон репозитория в каталоге деплоя стенда (для AprilProfile на Orange Pi — **`/home/ukituki/april-profile`**). Выкладка на этом хосте: **`./deploy.sh`** из этого каталога.
6. **Секреты:** `.env`, `images.env` на сервере не коммитить; шаблоны — в репозитории.

## 3. GitHub Actions runner (self-hosted; для AprilProfile — отдельный хост от стенда)

Цель: runner с labels **`self-hosted`**, **`dev`**, **`RUNNER_LABEL_EXTRA`**, с которого выполняются jobs CI и (по текущему workflow) шаги **`Deploy to dev`** — см. `.github/workflows/dev-deploy.yml`.

**AprilProfile (апрель 2026):** runners установлены на **`192.168.1.29`**; **рантайм стенда** (compose, БД, API) — на **`192.168.1.42`**. Это **разные** машины: переменная **`APRIL_DEPLOY_ROOT`** указывает путь к клону **на том хосте, где зарегистрирован runner и выполняется `docker compose`**. Если там нет того же compose, что на Orange Pi, автоматический деплой из job **не обновит** контейнеры на **192.168.1.42** без отдельной донастройки — см. раздел «Разнесённая топология» в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md).

1. **ПО на машине runner'а:** Docker + Compose v2, Node.js 18+, npm, `git`, `curl` (по требованиям workflow); пользователь в группе **`docker`**.
2. **Доступ к GitHub:** deploy key или credentials для `git fetch` в клоне на **этой** машине.
3. **Каталог клона на runner'е:** ветка `develop`, **`deploy.sh`**, локальный **`.env`** — по пути **`APRIL_DEPLOY_ROOT`**.
4. **Runner:** [actions/runner](https://github.com/actions/runner/releases), `./config.sh`, labels **`dev`** и **`RUNNER_LABEL_EXTRA`**.
5. При необходимости — systemd для runner — по политике команды.
6. **Проверка:** runner **Idle** в GitHub; после merge в **`develop`** запускаются CI и **Deploy to dev** (на хосте runner'а).
7. **`APRIL_DEPLOY_ROOT`:** repository variable; должен существовать **на машине runner'а**. Для деплоя **именно на Orange Pi** нужен либо runner на **192.168.1.42**, либо отдельный сценарий (SSH/Ansible) — см. `PROJECT_DEFAULTS.md`.

## 4. Проверка документации на dev

После выкладки статики и `docker compose up` проверьте сайт, `/swagger/`, при необходимости порт Structurizr Lite.
