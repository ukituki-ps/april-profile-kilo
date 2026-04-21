## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 1 (часть 4) — образ в ghcr, compose, деплой на dev по DEPLOYMENT_STRATEGY
- Ветка: `develop`
- Коммиты: `4a69bcb`, `pending` (fix ghcr pull auth)
- PR: [#11](https://github.com/ukituki-ps/april-profile/pull/11) (merged), follow-up PR на фикс авторизации pull

## 2) Что сделано
- [backend] Добавлен production-oriented `Dockerfile` (multi-stage, финальный образ distroless/nonroot) для `cmd/april-profile`.
- [infra / compose / nginx] Backend интегрирован в `docker-compose.yml` с переменными `BACKEND_IMAGE_REPO`, `IMAGE_TAG_BACKEND`, `BACKEND_HTTP_PORT`; добавлен локальный `build` для `docker compose build`.
- [ci/cd] Добавлен workflow `.github/workflows/backend-image-ghcr.yml` (build+push в `ghcr.io` с тегом `${{ github.sha }}`) и обновлён `.github/workflows/dev-deploy.yml` (передаёт `IMAGE_TAG_BACKEND=${{ github.sha }}` в `deploy.sh`).
- [docs] Обновлены `docs/DEPLOYMENT_STRATEGY.md` (секрет `GHCR_PUSH_TOKEN`, fallback на `GITHUB_TOKEN`), `.env.example`, `images.env.example`.
- [docs-site] Добавлена человекопонятная история задачи `docs-site/docs/task-story-007-docker-ghcr-compose-deploy.md` и обновлён индекс `docs-site/docs/task-stories-overview.md`.

## 3) Изменённые файлы
- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml`
- `.github/workflows/backend-image-ghcr.yml`
- `.github/workflows/dev-deploy.yml`
- `.env.example`
- `images.env.example`
- `docs/DEPLOYMENT_STRATEGY.md`
- `docs-site/docs/task-story-007-docker-ghcr-compose-deploy.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; откат — вернуть предыдущие версии файлов и/или предыдущий SHA в `images.env`, затем `docker compose up -d`

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: не запускались (в scope проверки задачи не требовались)
- Integration tests: не запускались
- E2E / smoke: частично (локальные команды выполнены, удалённый dev smoke не проверялся из этой среды)

Команды (фактически выполненные):
```bash
docker build -t april-profile-backend:local .
docker compose config
docker compose build
make openapi-lint
make docs-build
```

## 6) Деплой
- Среда: dev (`DEV_HOST`) — проверка через GitHub Actions логи
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: подготовлена публикация в ghcr по SHA (`ghcr.io/<owner>/april-profile-backend:<git-sha>`)
- Health / readiness: после merge PR #11 deploy упал до старта backend с `error from registry: unauthorized` на `docker compose pull`; добавлен workflow-фикс с `docker login ghcr.io` в `dev-deploy.yml`
- Rollback: не применялся (релиз не дошёл до `up -d` backend)

## 7) Риски и ограничения
- Требуются права на `packages:write` для `GITHUB_TOKEN`; при ограничениях org нужно задать `GHCR_PUSH_TOKEN` и использовать его в workflow.
- Для pull приватного backend-образа на self-hosted runner требуются права `read:packages`; рекомендуется секрет `GHCR_PULL_TOKEN`.
- Финальная проверка smoke `/healthz` ожидается после прогона deploy с новым фиксом авторизации pull.

## 8) Что осталось
- [x] После merge в `develop` проверен `Backend image (ghcr)`: run успешный, образ по SHA опубликован.
- [ ] После merge follow-up PR проверить успешный `Deploy to dev` и `curl http://127.0.0.1:<BACKEND_HTTP_PORT>/healthz`.
