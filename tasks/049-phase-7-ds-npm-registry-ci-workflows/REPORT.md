## 1) Итого

- Статус: **выполнено** (секрет и `permissions` для установки `@april/*` из GitHub Packages; при текущем `frontend/.npmrc` с закомментированным registry токен не обязателен, но передаётся для готовности к следующему шагу после публикации пакетов.)
- Задача: 049 — CI: `NODE_AUTH_TOKEN` и права `packages:read` для frontend job’ов
- Ветка: `feature/049-phase-7-ds-npm-registry-ci-workflows`
- Коммиты: см. `git log develop..HEAD` на ветке
- PR: не создавался из среды агента

## 2) Что сделано

- **[CI]** Job `frontend` в [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): `permissions: contents: read`, `packages: read`; для шага `npm ci`… задан `NODE_AUTH_TOKEN: ${{ secrets.APRIL_NPM_READ_TOKEN || secrets.GITHUB_TOKEN }}`.
- **[CI]** Job `docs-and-compose` в [`.github/workflows/bootstrap-ci.yml`](../../.github/workflows/bootstrap-ci.yml): те же `permissions` на job; `NODE_AUTH_TOKEN` на шаге frontend.
- **[CI]** Job `warmup` в [`.github/workflows/runner-cache-warmup.yml`](../../.github/workflows/runner-cache-warmup.yml): те же `permissions` и `NODE_AUTH_TOKEN` для `npm ci` в `frontend/`.
- **[docs]** [`.env.example`](../../.env.example) — блок про `NODE_AUTH_TOKEN` для локального `npm ci` при активном GitHub Packages в `frontend/.npmrc`.
- **[docs]** [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) — обновлён пункт про job `frontend` (токен, поведение `ds:prepare` после 048).

## 3) Изменённые файлы

- `.github/workflows/ci.yml`
- `.github/workflows/bootstrap-ci.yml`
- `.github/workflows/runner-cache-warmup.yml`
- `.env.example`
- `docs/TESTING_STRATEGY.md`
- `tasks/049-phase-7-ds-npm-registry-ci-workflows/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да (revert правок в workflows)

## 5) Проверка качества

- Линтер: не применялся к YAML отдельно
- Сборка frontend: ok локально (`cd frontend && npm ci && npm run build`)
- Полный CI: ожидается на PR (self-hosted)

Команды:

```bash
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## 6) Деплой

- Не выполнялся

## 7) Риски и ограничения

- **Секрет `APRIL_NPM_READ_TOKEN`:** опционально; если не задан, используется `GITHUB_TOKEN`. Для PR из **форка** токен форка может **не** иметь доступа к пакетам org — тогда задайте в базовом репозитории org secret `APRIL_NPM_READ_TOKEN` (PAT с `read:packages`) и выдайте доступ fork’ам по политике org или не полагайтесь на fork CI для этого шага.
- **Job-level `permissions`:** у job `docs-and-compose` и `warmup` явно заданы только `contents` и `packages`; остальные scope для `GITHUB_TOKEN` в этих job сброшены в `none` (поведение GitHub). Для перечисленных шагов этого достаточно.

## 8) Секреты и имена (контракт для maintainers)

| Имя | Назначение |
|-----|------------|
| `GITHUB_TOKEN` (встроенный) | По умолчанию для `NODE_AUTH_TOKEN`, если хватает `packages: read` к пакетам `@april/*` в том же org. |
| `APRIL_NPM_READ_TOKEN` (опционально) | PAT с минимумом **read:packages** для `npm.pkg.github.com`, если `GITHUB_TOKEN` недостаточен. |
| `SUBMODULES_TOKEN` | Без изменений: checkout submodule DisignApril (ассеты showcase и т.д.). |

**Rotation:** при компрометации PAT — перевыпустить `APRIL_NPM_READ_TOKEN` в GitHub → Settings → Secrets; обновить описание владельцу runner’ов при self-hosted.

## 9) Что осталось

- [ ] Задача **050**: полный раздел в `DEPLOYMENT_STRATEGY.md`, docs-site.
- [ ] После публикации `@april/*` в registry: раскомментировать `frontend/.npmrc`, убрать vendored tarball’ы (048), обновить lock и убедиться, что зелёный CI с только `GITHUB_TOKEN` на PR из основного репозитория.
