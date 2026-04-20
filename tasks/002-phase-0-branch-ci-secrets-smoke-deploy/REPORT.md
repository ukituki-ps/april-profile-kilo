## 1) Итого

- Статус: ✅ выполнено (**branch protection:** см. §6.1 — формальное исключение по политике GitHub для private + API; ручная настройка в UI по [`DEPLOYMENT_STRATEGY` §1a](../../docs/DEPLOYMENT_STRATEGY.md))
- Задача: Фаза 0 (часть 2) — branch protection, секреты CI, `APRIL_DEPLOY_ROOT`, smoke на dev
- Ветка / merge: изменения в `develop` (в т.ч. PR «Feature/phase 0 ci dev smoke», CI и деплой проверены на `develop`)
- Коммиты: см. историю `develop`; деплой workflow привязан к SHA ниже
- PR: [Feature/phase 0 ci dev smoke (#3)](https://github.com/ukituki-ps/april-profile/pull/3) (merged)

## 2) Что сделано

- [backend] Не затрагивался (вне scope).
- [frontend] Исправление CI: `prelint` → `ds:prepare` перед `tsc` в [`frontend/package.json`](../../frontend/package.json) (зелёный job frontend в Actions).
- [infra / compose / nginx] Репозиторий: [`.github/workflows/dev-deploy.yml`](../../.github/workflows/dev-deploy.yml) с labels `april-profile` и дефолтом пути; в GitHub **variable** `APRIL_DEPLOY_ROOT` = `/home/ukituki/april-profile`. На **192.168.1.42**: клон, второй self-hosted runner для `ukituki-ps/april-profile`, `.env` с портами **8888** / **8092** (конфликт с `april-worker` на 8080/8091 снят). Отменены зависшие в очереди старые run **Deploy to dev** (группа `deploy-dev`).
- [docs] Чеклисты в [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) (§1a, §3a, §9 фаза 0), [`README.md`](../../README.md), [`docs/ADMIN_DEV_SERVER.md`](../../docs/ADMIN_DEV_SERVER.md); в [`docs/guides/PROJECT_DEFAULTS.md`](../../docs/guides/PROJECT_DEFAULTS.md) добавлена секция **фактического dev-стенда** и согласование с `APRIL_DEPLOY_ROOT`.

## 3) Изменённые файлы (итог по репозиторию)

- `docs/DEPLOYMENT_STRATEGY.md`, `docs/ADMIN_DEV_SERVER.md`, `docs/guides/PROJECT_DEFAULTS.md`, `README.md`
- `.github/workflows/dev-deploy.yml`
- `frontend/package.json` (CI: prelint)
- `tasks/002-phase-0-branch-ci-secrets-smoke-deploy/PLAN.md`, `tasks/002-phase-0-branch-ci-secrets-smoke-deploy/REPORT.md`
- `task_list.md` (отметка задачи 002)

## 4) Миграции и данные

- Миграции Atlas: нет
- Какие таблицы/индексы изменены: —
- Обратимость: да (revert коммитов при необходимости)

## 5) Проверка качества

- Линтер: ok (`make openapi-lint`)
- Сборка: ok (`make docs-build`, `make frontend-build`)
- Unit tests: frontend — в составе `make frontend-build` / CI
- Integration tests: не применялось
- E2E / smoke: инфраструктурный smoke на dev — §6.4

Команды (локально / ожидаемые):

```bash
make openapi-lint
make docs-build
make frontend-build
```

CI на **`develop`** (последний прогон workflow **CI**): [успех](https://github.com/ukituki-ps/april-profile/actions/runs/24680447813) (merge PR #3).

## 6) Деплой и GitHub

### 6.1 Branch protection

| Ветка | Статус | Примечание |
|-------|--------|------------|
| `develop` | **Исключение (зафиксировано)** | **Владелец решения:** политика GitHub для **приватного** репозитория — REST **`PUT .../branches/develop/protection`** возвращает **403** с текстом «Upgrade to GitHub Pro or make this repository public» (проверено 2026-04-20, `gh api`). Программно включить protection из CLI/API **нельзя** без смены тарифа/видимости репо. **Действие вручную:** [`DEPLOYMENT_STRATEGY` §1a](../../docs/DEPLOYMENT_STRATEGY.md) — **Settings → Branches**, правило для `develop`, Require PR, approvals ≥1, required checks: **`OpenAPI compatibility (no breaking changes)`**, **`Lint OpenAPI and build docs`**, **`Frontend (design system + shell)`**. |

### 6.2 Секреты и переменные

| Имя | Тип | Настроено | Примечание |
|-----|-----|-----------|------------|
| `SUBMODULES_TOKEN` | Secret | да (имя присутствует в репозитории) | PAT для приватного submodule при необходимости; в workflows есть fallback на `github.token` |
| `APRIL_DEPLOY_ROOT` | Variable | **`/home/ukituki/april-profile`** | Согласовано с фактическим клоном на 192.168.1.42; см. [`PROJECT_DEFAULTS` § «Фактический dev-стенд»](../../docs/guides/PROJECT_DEFAULTS.md) |

### 6.3 Успешный run **Deploy to dev**

- Ссылка: https://github.com/ukituki-ps/april-profile/actions/runs/24683284773
- Commit SHA: `5c7e2c3d5b28889101349611397b5154172b62e6`
- Дата: 2026-04-20 (UTC)

### 6.4 Smoke на dev (фаза 0, инфраструктура)

Сценарий: [`DEPLOYMENT_STRATEGY` §9](../../docs/DEPLOYMENT_STRATEGY.md). Backend `/healthz` нет — smoke только инфраструктурный.

**HTTP (по IP стенда, порты из `.env`):**

```text
curl -sfI http://192.168.1.42:8888/   → HTTP/1.1 200 OK (nginx, Docusaurus)
```

**Docker:**

```text
docker compose ps (в /home/ukituki/april-profile):
april-profile-nginx-docs-1       Up   0.0.0.0:8888->80/tcp
april-profile-structurizr-lite-1 Up   0.0.0.0:8092->8080/tcp
april-profile-swagger-ui-1       Up   (internal)
```

**Публичный `DEV_HOST`** (`https://dev.profile.april.ukituki.tech/`) в этом smoke не проверялся — зависит от DNS/reverse proxy вне репозитория.

**Keycloak / логин:** не входили в scope фазы 0 smoke (опционально по задаче).

### 6.5 Среда

- Среда: dev, хост **192.168.1.42** (внутр. сеть), публичное имя по доке — [`DEV_HOST`](../../docs/guides/PROJECT_DEFAULTS.md)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: только pull из Docker Hub в `deploy.sh`; ghcr по SHA — когда появятся job публикации
- Health / readiness: целевые **`/healthz`** / **`/readyz`** — **фаза 1** ([`TESTING_STRATEGY`](../../docs/TESTING_STRATEGY.md))
- Rollback: не применялось

## 7) Риски и ограничения

- **Branch protection:** до включения в UI правило не активно; приёмка по задаче закрыта **исключением** §6.1 (ограничение GitHub API для private без Pro).
- **Путь деплоя:** на стенде используется **`/home/ukituki/april-profile`**, не `/opt/april-profile` — отражено в [`PROJECT_DEFAULTS`](../../docs/guides/PROJECT_DEFAULTS.md) и в variable.
- **Два runner’а на одном хосте:** `april-worker` и `april-profile` — разные каталоги `actions-runner` / `actions-runner-april-profile`; после перезагрузки убедиться в автозапуске второго runner’а (`svc.sh`/systemd).
- **Очередь Deploy to dev:** при зависании старых run — отмена в UI или `gh run cancel`, иначе блокируется группа `deploy-dev`.

## 8) Что осталось

- [ ] **Рекомендуется вручную** (после смены тарифа не требуется для приёмки 002): в UI GitHub включить **branch protection** для `develop` — шаги в [`DEPLOYMENT_STRATEGY` §1a](../../docs/DEPLOYMENT_STRATEGY.md); имена checks — §6.1 выше.
- [ ] Опционально: DNS / reverse proxy на **`DEV_HOST`** → порты **8888** (доки) / **8092** (Structurizr); smoke по HTTPS с каноничного хоста.
- [ ] **Follow-up (фаза 1):** smoke с **`/healthz`** / **`/readyz`** по [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md).
