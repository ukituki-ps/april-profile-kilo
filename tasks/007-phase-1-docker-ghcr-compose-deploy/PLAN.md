# План: Фаза 1 (часть 4) — Docker, ghcr, compose, деплой

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-20
- **Статус плана:** черновик

## Исходные допущения
- Self-hosted runner с labels из [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md); `APRIL_DEPLOY_ROOT` и `deploy.sh` уже в контуре фазы 0.
- Теги образов — **git SHA**; источник истины для запущенных версий — `images.env` / env на сервере ([`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) §5).

## Порядок работ (шаги)
1. Добавить production-oriented `Dockerfile` для Go-сервиса (non-root user, минимальный образ при возможности).
2. Включить backend-сервис в `docker-compose.yml` с переменными образа и env-файлом для секретов (шаблон в репо без значений).
3. Расширить CI: job сборки и `docker push` в `ghcr.io/<org>/<repo>/...` с тегом `${{ github.sha }}`; задокументировать необходимые Secrets.
4. Проверить `docker compose config` локально; при доступе — пробный деплой на dev и smoke `/healthz`.
5. Обновить `DEPLOYMENT_STRATEGY.md` §3a списком секретов для registry.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend | Точка сборки, возможно `embed` версии |
| Инфра / Compose | Сервис backend, сети, зависимости от Postgres/Redis |
| CI | Новый или расширенный workflow |
| Документация | Секреты, smoke после деплоя |

## Риски и откат
- **Риск:** нехватка прав у `GITHUB_TOKEN` на ghcr → **Митигация:** отдельный PAT в Secrets, как в доке.
- **Риск:** ломается существующий deploy → **Митигация:** изменения за feature-flag или поэтапно; откат образа по `images.env` ([`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)).

## Проверка после выполнения
- Успешный `docker compose config`, зелёный CI, при возможности — smoke на dev.

## Примечания
- Ручные шаги: создание секретов в GitHub, первичный `docker login` на runner при необходимости.
