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

## 3. GitHub Actions runner (self-hosted)

Цель: два контура для **AprilProfile** — см. `.github/workflows/dev-deploy.yml`, [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md).

**Хост CI (`192.168.1.29`):** runner с labels **`self-hosted`**, **`dev`**, **`RUNNER_LABEL_EXTRA`** (`april-profile`). С него выполняются **CI**, **Backend image (ghcr)** и job **Build docs** в **Deploy to dev**. Нужны Docker, Node.js 20+, npm, `git`, `curl`.

**Хост стенда Orange Pi (`192.168.1.42`):** отдельный runner с labels **`self-hosted`**, **`dev`**, **`april-profile-stand`** (**без** `april-profile`). С него выполняется только job **deploy** в **Deploy to dev** (`git` + `docker compose` + `deploy.sh`). Нужны Docker + Compose v2, `git`, `curl`; Node на стенде для этого job **не** обязателен (доки приходят артефактом из предыдущего job).

1. **Доступ к GitHub** на **каждой** машине: ключ/credentials для `git fetch` в клоне по пути **`APRIL_DEPLOY_ROOT`**.
2. **Каталог клона:** ветка `develop`, **`deploy.sh`**, локальный **`.env`** — **`APRIL_DEPLOY_ROOT`** (на Orange Pi типично **`/home/ukituki/april-profile`**).
3. **Runner:** [actions/runner](https://github.com/actions/runner/releases), `./config.sh` с нужным набором labels для этой машины.
4. При необходимости — **systemd** для сервиса runner — по политике команды.
5. **Проверка:** оба runner'а **Idle** в GitHub; после merge в **`develop`** CI и образ — на .29; **deploy** — на .42.
6. **`APRIL_DEPLOY_ROOT`:** repository variable; путь должен существовать **на машине runner'а job deploy** (стенд).

## 4. Проверка документации на dev

После выкладки статики и `docker compose up` проверьте сайт, `/swagger/`, при необходимости порт Structurizr Lite.
