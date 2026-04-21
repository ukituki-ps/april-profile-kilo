## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 1 (часть 4) — образ в ghcr, compose, деплой на dev по DEPLOYMENT_STRATEGY
- Ветка: `develop`
- Коммиты: `4a69bcb`, `8e205b7`, `a370e92`, `7523318`, `2f4dc60`, `92c49aa`, `0101aeb`
- PR: [#11](https://github.com/ukituki-ps/april-profile/pull/11) (merged), [#12](https://github.com/ukituki-ps/april-profile/pull/12) (merged), [#13](https://github.com/ukituki-ps/april-profile/pull/13) (merged), [#14](https://github.com/ukituki-ps/april-profile/pull/14) (merged), [#15](https://github.com/ukituki-ps/april-profile/pull/15) (merged), [#16](https://github.com/ukituki-ps/april-profile/pull/16) (merged), [#17](https://github.com/ukituki-ps/april-profile/pull/17) (merged)

## 2) Что сделано
- [backend] Добавлен production-oriented `Dockerfile` (multi-stage, финальный образ distroless/nonroot) для `cmd/april-profile`.
- [infra / compose / nginx] Backend интегрирован в `docker-compose.yml` с переменными `BACKEND_IMAGE_REPO`, `IMAGE_TAG_BACKEND`, `BACKEND_HTTP_PORT`; добавлен локальный `build` для `docker compose build`.
- [ci/cd] Добавлен workflow `.github/workflows/backend-image-ghcr.yml` (build+push в `ghcr.io` с тегом `${{ github.sha }}`), затем расширен до multi-arch (`linux/amd64,linux/arm64`); обновлён `.github/workflows/dev-deploy.yml` (передаёт `IMAGE_TAG_BACKEND=${{ github.sha }}` в `deploy.sh` и логинится в ghcr перед pull).
- [docs] Обновлены `docs/DEPLOYMENT_STRATEGY.md` (секрет `GHCR_PUSH_TOKEN`, fallback на `GITHUB_TOKEN`), `.env.example`, `images.env.example`.
- [docs-site] Добавлена человекопонятная история задачи `docs-site/docs/task-story-007-docker-ghcr-compose-deploy.md` и обновлён индекс `docs-site/docs/task-stories-overview.md`.
- [dev runtime] На сервере обновлены `KEYCLOAK_ISSUER`, `KEYCLOAK_JWKS_URL`, `KEYCLOAK_AUDIENCE` в `/home/ukituki/april-profile/.env`, backend перезапущен, `healthz` подтверждён.

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
- Health / readiness: 
  - после merge PR #11 deploy упал до старта backend с `error from registry: unauthorized` на `docker compose pull`; добавлен workflow-фикс с `docker login ghcr.io` в `dev-deploy.yml` (PR #12);
  - после merge PR #12 deploy снова упал на `docker compose pull` с `no matching manifest for linux/arm64/v8`; причина — образ публиковался только для `amd64`; добавлен multi-arch build (`linux/amd64,linux/arm64`) в workflow backend image.
  - после merge PR #13 deploy упал с `ghcr.io/...:<sha>: not found`; причина — гонка: `Deploy to dev` стартует раньше окончания `Backend image (ghcr)` для того же SHA. Добавлен шаг ожидания публикации image-тега в ghcr перед `deploy.sh`.
  - после merge PR #14 шаг ожидания сработал корректно, но 5-минутного окна не хватило: image-job завершился через ~5m53s, а deploy прекратил ожидание примерно за 13 секунд до появления тега. Увеличен таймаут ожидания до 10 минут.
  - после merge PR #15 image ожидание и pull прошли, но `docker compose up -d` упал на `Bind for 0.0.0.0:8081 failed: port is already allocated`. Обновлён дефолт `BACKEND_HTTP_PORT` до `18081` (менее конфликтный порт для dev-host).
  - после merge PR #16 контейнер backend создаётся, но уходит в restart с `exec /usr/local/bin/april-profile: exec format error`. Причина: в `Dockerfile` был жёсткий `GOARCH=amd64`, из-за чего arm64 image содержал amd64 бинарник. Исправлено на сборку под `TARGETOS/TARGETARCH`.
  - после merge PR #17 деплой успешен: `april-profile-backend-1` в статусе `Up`, порт `18081->8080`, `curl http://127.0.0.1:18081/healthz` вернул `200 {"status":"ok"}`.
- Rollback: не применялся

## 7) Риски и ограничения
- Требуются права на `packages:write` для `GITHUB_TOKEN`; при ограничениях org нужно задать `GHCR_PUSH_TOKEN` и использовать его в workflow.
- Для pull приватного backend-образа на self-hosted runner требуются права `read:packages`; рекомендуется секрет `GHCR_PULL_TOKEN`.
- Для защищённых endpoint нужен внешний Keycloak (из AprilHub) в переменных `KEYCLOAK_*`; дефолт compose `keycloak:8080` для текущего dev-стенда неприменим.

## 8) Что осталось
- [x] После merge в `develop` проверен `Backend image (ghcr)`: run успешный, образ по SHA опубликован.
- [x] После merge follow-up PR (Dockerfile target arch) проверены успешный `Deploy to dev` и `curl http://127.0.0.1:18081/healthz`.
