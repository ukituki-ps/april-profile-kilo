---
sidebar_position: 2
---

# Форк репозитория под новый сервис или команду

Краткий чеклист, если этот репозиторий используется как **шаблон** для отдельного микросервиса или копии стенда. Детали значений April — в [`PROJECT_DEFAULTS.md`](./PROJECT_DEFAULTS.md), версии инструментов — в [`VERSIONS.md`](./VERSIONS.md).

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

## 4. Окружение

- [ ] **`.env.example`**, **`images.env.example`**: порты, префиксы; не коммитить реальные секреты.
- [ ] При нескольких сервисах на одном хосте: уникальные **`DOCS_HTTP_PORT`**, **`STRUCTURIZR_HTTP_PORT`**, чтобы не конфликтовать с соседними compose-стеками.

## 5. Документация в сайте

- [ ] **`docs-site/docs/intro.md`** и **`getting-started.md`**: согласовать формулировки с новым именем продукта.
- [ ] Каталог **`docs/adr`**: при другом продукте обновить индекс и при необходимости шаблон ADR.

## 6. После появления кода

- [ ] Добавить в **CI** шаги `go test`, `npm test` / lint — расширить job `.github/workflows/ci.yml` при появлении `go.mod` и фронтенда в репозитории.
- [ ] Зафиксировать версии в [`VERSIONS.md`](./VERSIONS.md) или перенести таблицу ближе к коду (`go.mod`, `package.json`).
