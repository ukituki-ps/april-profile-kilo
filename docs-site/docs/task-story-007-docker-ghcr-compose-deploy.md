---
sidebar_position: 21
---

# 007 — Docker-образ backend, ghcr и compose-деплой

## Что поменялось

В этом шаге backend стал разворачиваться как нормальный контейнерный сервис, а не как ручной `go run` на стенде:

- появился `Dockerfile` для `cmd/april-profile`;
- backend добавлен в `docker-compose.yml` с переменными `BACKEND_IMAGE_REPO` и `IMAGE_TAG_BACKEND`;
- в CI добавлен workflow публикации образа в `ghcr.io` с тегом ровно по git SHA;
- `dev-deploy.yml` передаёт SHA в `deploy.sh`, чтобы compose поднимал нужную версию контейнера.

## Зачем это команде

- Убрали ручной труд по выкладке бинарника на dev.
- Версия на стенде стала однозначной: всегда можно понять, какой commit запущен.
- Откат проще: достаточно вернуть предыдущий SHA в `images.env` и перезапустить deploy.

## Границы задачи

Сделано в рамках 007:

- контейнеризация backend;
- push образов в ghcr по SHA;
- интеграция compose/deploy с переменными тегов;
- обновление документации по секретам и процессу.

Осознанно оставлено на follow-up:

- фактическая настройка секретов/прав в GitHub UI (делает владелец репозитория);
- расширенные readiness-проверки с реальными зависимостями (задача 008);
- полный smoke на удалённом dev в этой сессии (нужен доступ к runner/стенду).

## Как проверить без чтения кода

```bash
docker build -t april-profile-backend:local .
docker compose config
docker compose build
make openapi-lint
make docs-build
```

Для CI-потока:

1. Сделать merge в `develop`.
2. Проверить, что workflow `Backend image (ghcr)` собрал и запушил `ghcr.io/<owner>/april-profile-backend:<commit_sha>`.
3. Проверить, что `Deploy to dev` запустился с тем же SHA и сервис отвечает по `/healthz`.

## Официальные артефакты

- Постановка: `tasks/007-phase-1-docker-ghcr-compose-deploy/TASK.md`
- План: `tasks/007-phase-1-docker-ghcr-compose-deploy/PLAN.md`
- Отчёт: `tasks/007-phase-1-docker-ghcr-compose-deploy/REPORT.md`
