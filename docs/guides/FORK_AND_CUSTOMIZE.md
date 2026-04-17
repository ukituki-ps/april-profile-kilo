---
sidebar_position: 2
---

# Форк репозитория под новый сервис или команду

Краткий чеклист, если этот репозиторий используется как **шаблон** для отдельного микросервиса или копии стенда. Детали значений April — в [`PROJECT_DEFAULTS.md`](./PROJECT_DEFAULTS.md), версии инструментов — в [`VERSIONS.md`](./VERSIONS.md).

## 0. Репозиторий на GitHub

- [ ] При необходимости включите **Use this template** / **Template repository** (Settings → General) — удобнее, чем ручное копирование каталога.
- [ ] Один репозиторий из шаблона = **один сервис**; внутри репо допустим модульный монолит (см. `docs/AGENT_ARCHITECTURE_CONTEXT.md`).

## 1. Идентичность и URL

- [ ] **`README.md`**: название продукта, цели, при необходимости домен и ссылки.
- [ ] **`docs-site/docusaurus.config.ts`**: `title`, `url`, `themeConfig.navbar.title`, при необходимости `tagline`.
- [ ] **`openapi/openapi.yaml`**: `info.title`, `info.description`, блок `servers` (базовый URL API за gateway).
- [ ] **`docs/guides/PROJECT_DEFAULTS.md`**: заполнить таблицу под свой проект или заменить файл на локальные значения.

## 2. Деплой и сервер

- [ ] **`docs/DEPLOYMENT_STRATEGY.md`** и **`docs/ADMIN_DEV_SERVER.md`**: пройти по тексту и заменить хост, путь `/opt/...`, пользователя, примеры `ssh`, упоминания labels runner.
- [ ] **`.github/workflows/dev-deploy.yml`**: `runs-on` (labels), при необходимости имя workflow; путь по умолчанию к клону (`/opt/april`) — синхронизировать с `APRIL_DEPLOY_ROOT` / переменными в GitHub.
- [ ] **`deploy.sh`**: логика обычно универсальна; проверьте вызовы `make` и наличие Node на сервере, если собираете Docusaurus на runner.

## 3. CI и репозиторий

- [ ] **GitHub**: branch protection для `develop` / `main`, secrets для registry (если появятся образы).
- [ ] **Self-hosted runner**: заново зарегистрировать с нужными **labels** или скорректировать workflow под ваши имена.
- [ ] **OpenAPI и базовая ветка**: job `openapi-compatibility` в `.github/workflows/ci.yml` по умолчанию сравнивает с `origin/develop`. Если основная ветка интеграции — только `main`, замените `BASE_REF` в workflow на `origin/main` и убедитесь, что ветка существует на remote.
- [ ] **Несколько спецификаций**: при добавлении файлов в `openapi/*.yaml` расширьте `make openapi-lint` и при необходимости задайте `SPEC_PATH` / отдельные шаги для `scripts/check-openapi-compat.sh`.

## 4. Окружение

- [ ] **`.env.example`**, **`images.env.example`**: порты, префиксы; не коммитить реальные секреты.
- [ ] При нескольких сервисах на одном хосте: уникальные **`DOCS_HTTP_PORT`**, **`STRUCTURIZR_HTTP_PORT`**, чтобы не конфликтовать с соседними compose-стеками.
- [ ] Локальный **Docker Compose**: без предварительной сборки Docusaurus (`make docs-build` или `make compose-up`) каталог `docs-site/build` может быть пустым — Nginx отдаст пустой/неактуальный сайт. Для готовой статики используйте `make compose-up` или соберите сайт вручную перед `docker compose up`.

## 5. Документация в сайте

- [ ] **`docs-site/docs/intro.md`** и **`getting-started.md`**: согласовать формулировки с новым именем продукта.
- [ ] Каталог **`docs/adr`**: при другом продукте обновить индекс и при необходимости шаблон ADR.

## 6. Фронтенд и дизайн-система April

- [ ] После клона выполнить **`git submodule update --init --recursive`**, чтобы подтянуть **`design-system/DisignApril`** (шаблон уже содержит submodule и каталог **`frontend/`** с `file:`-зависимостями на пакеты DS).
- [ ] Согласовать с командой: при публикации **`@april/*`** в registry можно заменить `file:` в `frontend/package.json` на semver — см. [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).
- [ ] Для приватного scope **`@april/*`**: настроить `.npmrc` / CI credentials по политике организации.

## 7. После появления кода

- [ ] Добавить в **CI** шаги `go test`, `npm test` / lint — расширить job `.github/workflows/ci.yml` при появлении `go.mod` и фронтенда в репозитории. Ориентир по полному контуру (smoke, k6, несколько модулей) — репозиторий [april-worker](https://github.com/ukituki-ps/april-worker).
- [ ] Зафиксировать обязательный quality gate в `docs/TESTING_STRATEGY.md` и в корневом `README.md`.
- [ ] Зафиксировать версии в [`VERSIONS.md`](./VERSIONS.md) или перенести таблицу ближе к коду (`go.mod`, `package.json`).

## 8. Общая инфраструктура AprilHub

- [ ] Считать **AprilHub** ([april-worker](https://github.com/ukituki-ps/april-worker)) источником правды по **общему** инфраструктурному контуру экосистемы: observability (Prometheus, Loki, Grafana, Promtail и т.д.), onboarding стендов, типовые runbook'и.
- [ ] Для своего сервиса: **интеграция** в этот контур (например `GET /metrics`, согласованные лейблы, доставка логов) по документам в april-worker — `infra/observability/`, `docs/runbooks/`, `docs/guides/OBSERVABILITY_INDEX.md`; не дублировать у себя полный каталог `infra/observability`, если команда не приняла исключение.
- [ ] Зафиксировать в `README` или ADR сервиса, **как** сервис подключён к контуру Hub (если есть особенности).
