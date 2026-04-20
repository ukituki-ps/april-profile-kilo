## 1) Итого

- Статус: ⚠️ частично (в репозитории: документация, чеклисты и согласование с workflow; **настройки GitHub и фактический smoke на dev** — действия владельца репозитория / стенда; см. разделы 6–8)
- Задача: Фаза 0 (часть 2) — branch protection, секреты CI, `APRIL_DEPLOY_ROOT`, smoke на dev
- Ветка: `feature/phase-0-ci-dev-smoke` (ожидается push и PR в `develop`)
- Коммиты: один коммит на ветке `feature/phase-0-ci-dev-smoke` (SHA — `git rev-parse HEAD` после checkout)
- PR: создать из ветки: https://github.com/ukituki-ps/april-profile/pull/new/feature/phase-0-ci-dev-smoke

## 2) Что сделано

- [backend] Не затрагивался (вне scope).
- [frontend] Не затрагивался (вне scope).
- [infra / compose / nginx] [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) и [`.github/workflows/bootstrap-ci.yml`](../../.github/workflows/bootstrap-ci.yml) без изменений логики — согласованы с политикой токена submodule (`SUBMODULES_TOKEN` с fallback на `github.token`). [`.github/workflows/dev-deploy.yml`](../../.github/workflows/dev-deploy.yml): `runs-on: [self-hosted, dev, april-profile]`, `vars.APRIL_DEPLOY_ROOT` с дефолтом `/opt/april-profile` — синхронизировано с [`PROJECT_DEFAULTS`](../../docs/guides/PROJECT_DEFAULTS.md).
- [docs] Добавлены §**1a** (branch protection), расширены §**3** / **3a** (секреты и переменные Actions), §**9** дополнен **фазой 0** (инфраструктурный smoke без Go API) и ссылкой на целевой набор после появления backend; краткая отсылка в [`README.md`](../../README.md); в [`docs/ADMIN_DEV_SERVER.md`](../../docs/ADMIN_DEV_SERVER.md) §1 — ссылки на чеклисты и секреты; [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md) приведён к каноничным значениям **AprilProfile** (согласование с задачей **001** и `APRIL_DEPLOY_ROOT`).

## 3) Изменённые файлы

- `docs/DEPLOYMENT_STRATEGY.md`
- `docs/ADMIN_DEV_SERVER.md`
- `docs/guides/PROJECT_DEFAULTS.md`
- `README.md`
- `.github/workflows/dev-deploy.yml`
- `tasks/002-phase-0-branch-ci-secrets-smoke-deploy/PLAN.md`
- `tasks/002-phase-0-branch-ci-secrets-smoke-deploy/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Какие таблицы/индексы изменены: —
- Обратимость: да (revert коммита)

## 5) Проверка качества

- Линтер: ok (`make openapi-lint`)
- Сборка: ok (`make docs-build`, `make frontend-build`)
- Unit tests: не запускались отдельно (frontend в `make frontend-build` включает скрипты пакета)
- Integration tests: не применялось
- E2E / smoke: на dev не выполнялся из этой среды (нет доступа к GitHub Actions UI и серверу); сценарий зафиксирован в [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) §9

Команды (фактически выполненные):

```bash
make openapi-lint
make docs-build
make frontend-build
```

## 6) Деплой и GitHub (для владельца репозитория)

Заполните таблицы после применения настроек и прогона smoke; значения секретов **не** вставлять в git.

### 6.1 Branch protection

| Ветка | Require PR | Status checks (имена jobs) | Примечание |
|-------|------------|----------------------------|------------|
| `develop` | да / нет | … | см. [`DEPLOYMENT_STRATEGY` §1a](../../docs/DEPLOYMENT_STRATEGY.md) |
| `main` | да / нет | … | по политике команды |

### 6.2 Секреты и переменные

| Имя | Тип | Настроено (да/нет) | Примечание |
|-----|-----|-------------------|------------|
| `SUBMODULES_TOKEN` | Secret | … | PAT на DisignApril при необходимости |
| `APRIL_DEPLOY_ROOT` | Variable | … | Ожидаемое значение для AprilProfile: `/opt/april-profile` (= [`DEPLOY_ROOT`](../../docs/guides/PROJECT_DEFAULTS.md)) |

### 6.3 Успешный run **Deploy to dev**

- Ссылка на run (GitHub Actions): …
- Commit SHA: …
- Дата: …

### 6.4 Smoke на dev (фаза 0, инфраструктура)

Выполнить на сервере / с рабочей станции по [`DEPLOYMENT_STRATEGY` §9](../../docs/DEPLOYMENT_STRATEGY.md) (фаза 0). Пример команд (подставьте `DEV_HOST` из [`PROJECT_DEFAULTS`](../../docs/guides/PROJECT_DEFAULTS.md)):

```bash
# HTTP: главная доков, OpenAPI и Swagger (если маршруты включены)
curl -sfI "https://dev.profile.april.ukituki.tech/"
curl -sfI "https://dev.profile.april.ukituki.tech/openapi/openapi.yaml"
curl -sfI "https://dev.profile.april.ukituki.tech/swagger/"

# На сервере в DEPLOY_ROOT (после SSH)
# cd /opt/april-profile && docker compose ps
```

Результат (кратко): …

### 6.5 Среда

- Среда: dev (`DEV_HOST` = `dev.profile.april.ukituki.tech` по [`PROJECT_DEFAULTS`](../../docs/guides/PROJECT_DEFAULTS.md))
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: теги по git SHA в ghcr — когда появятся job публикации; текущий `dev-deploy` синхронизирует репозиторий и вызывает `deploy.sh`
- Health / readiness: целевые **`/healthz`** / **`/readyz`** — после фазы 1 (Go API); до этого — smoke из §9 «фаза 0»
- Rollback: не применялось

## 7) Риски и ограничения

- Настройки **GitHub** (branch protection, secrets, variables) и **доступ к dev-хосту** недоступны агенту из среды выполнения; отчёт содержит шаблон для владельца.
- **Keycloak** в smoke до готовности маршрутов — опционален; блокер — зафиксировать в §6.4 с владельцем стенда.
- После появления backend обновить DoD smoke: вызовы health/readiness и сценарии из [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md).

## 8) Что осталось

- [ ] Владелец репозитория: включить branch protection по §1a [`DEPLOYMENT_STRATEGY`](../../docs/DEPLOYMENT_STRATEGY.md), задать `SUBMODULES_TOKEN` (при необходимости) и `APRIL_DEPLOY_ROOT` (= `/opt/april-profile`), убедиться что CI на `develop` зелёный после merge.
- [ ] Владелец стенда: клон в `/opt/april-profile`, права runner/deploy user, успешный **Deploy to dev**, заполнить §6 этого отчёта и выполнить smoke §6.4.
- [ ] Отметить задачу в [`task_list.md`](../../task_list.md) после закрытия приёмки.
- [ ] **Follow-up (фаза 1):** дополнить smoke вызовами `/healthz` / `/readyz` и интеграционными проверками по [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md).
