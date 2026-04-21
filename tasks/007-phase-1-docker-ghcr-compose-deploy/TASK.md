# Задача: Фаза 1 (часть 4) — образ в ghcr, compose, деплой на dev по DEPLOYMENT_STRATEGY

## Мета
- **ID / ветка:** (например `feat/phase-1-docker-ghcr-deploy`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 1**, блок **«Сначала»** (образ в ghcr; деплой по [`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)).
- **Связанные подзадачи:** зависит от наличия собираемого бинарника/сервиса — минимум [`004-phase-1-go-mod-atlas-migrations-tenant`](../004-phase-1-go-mod-atlas-migrations-tenant/), практически — после [`006-phase-1-health-openapi-system`](../006-phase-1-health-openapi-system/) (чтобы образ был смыслен для smoke). Связь с [`008-phase-1-observability-config-readiness-deps`](../008-phase-1-observability-config-readiness-deps/) — переменные окружения и health.
- **Связанные документы:** [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md), [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md), `.github/workflows/`

## Цель
Backend **собирается в Docker-образ**, публикуется в **ghcr.io** с тегом по **git SHA**, а деплой на **dev** следует принятой схеме: `docker compose`, `images.env` / переменные тегов, обновление клона в `APRIL_DEPLOY_ROOT`, **`SKIP_GIT_PULL=1 ./deploy.sh`** — без отхода от [`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md).

## Контекст для агента
- Registry и теги: только **SHA**, без обязательного `latest` ([`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) §4–5).
- Секреты `docker login ghcr.io` — в GitHub Secrets; имена зафиксировать в документе при появлении job ([`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) §3a уже намекает на расширение списка).

## Входит в объём
- `Dockerfile` (multi-stage при необходимости) для backend.
- Интеграция сервиса в **`docker-compose.yml`** (и при необходимости overrides) с переменными образа `IMAGE_TAG_*` / `images.env` по стратегии репозитория.
- CI: job **build + push** в ghcr на события, согласованные с командой (часто merge в `develop` или workflow из существующих паттернов).
- Обновление [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) §3a: имена секретов для ghcr (после фактической реализации).
- Согласование с **существующим** `dev-deploy.yml`: чтобы после деплоя на dev был доступен **smoke по `/healthz`** (когда сервис поднят).

## Не входит в объём
- Полная observability (Prometheus метрики, Loki) — фаза 4.1.
- Продакшен-кластер и HA — вне scope.
- Настройка секретов в UI GitHub — **ручная контрольная точка** владельца репозитория (агент может описать имена).

## Заглушки и внешние зависимости
- Если push в ghcr **не может быть проверен** из среды агента: в `REPORT.md` зафиксировать, что осталось владельцу (секреты, права `GITHUB_TOKEN`/PAT).
- Keycloak/Postgres на dev должны быть описаны в compose или ссылаться на существующие сервисы стенда — без выдуманных URL.

## Технические ограничения
- Debian/Docker Compose стек из архитектурного контекста; не вводить k8s-манифесты без отдельного решения.
- Не коммитить `images.env` с реальными секретами и тегами продакшена.

## Критерии готовности (acceptance)
- [ ] `docker build` воспроизводимо собирает образ локально (или в CI).
- [ ] Образ пушится в ghcr с тегом **SHA** (как минимум в основной ветке/после merge — по принятому триггеру).
- [ ] Compose поднимает сервис с корректными портами и env; health доступен согласно [`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) §7.
- [ ] Документация обновлена: секреты registry перечислены по именам.
- [ ] Команды проверки проходят (см. ниже).

## Проверка (команды)
```bash
# Локально
docker build -t april-profile-backend:local .

# Compose (имена сервисов уточнить после правок)
docker compose config
docker compose build

# Регрессия репозитория
make openapi-lint
make docs-build
```

## Результат в отчёте
Путь к Dockerfile; имя образа в ghcr; как задать тег на сервере; что проверено на dev (curl health); блокеры (секреты, runner).
