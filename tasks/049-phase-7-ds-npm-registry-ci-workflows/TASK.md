# Задача 049 (фаза 7): CI и кеш runner — аутентификация npm для `@april/*`

## Мета

- **Репозиторий выполнения:** `april-profile-1` (текущий).
- **Карточка-источник (эпик AprilHub):** [`april-worker/tasks/049-april-ds-registry-consumption-epic/EXTERNAL_APRILPROFILE_TASK.md`](https://github.com/ukituki-ps/april-worker/blob/develop/tasks/049-april-ds-registry-consumption-epic/EXTERNAL_APRILPROFILE_TASK.md).
- **Приоритет:** обычный.
- **ID / ветка:** `049-phase-7-ds-npm-registry-ci-workflows`.
- **Связанные документы:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), [`.github/workflows/bootstrap-ci.yml`](../../.github/workflows/bootstrap-ci.yml), [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md).

## Цель

Обеспечить **воспроизводимый** `npm ci` в GitHub Actions (и при необходимости на self-hosted runner) с доступом к приватному registry для scope `@april`, **без коммита секретов**, в соответствии с внешней постановкой эпика 049 (Dockerfile / workflows).

## Контекст для агента

- Сейчас workflows делают checkout с submodules и `npm ci` в `frontend/`; `ds:prepare` вызывает pnpm в submodule ([`frontend/scripts/ds-prepare.sh`](../../frontend/scripts/ds-prepare.sh)).
- После задачи **048** зависимости `@april/*` приходят из registry; CI должен экспортировать **`NODE_AUTH_TOKEN`** (или согласованное имя) до `npm ci`, с минимальными правами `packages:read`.
- Корневой [`Dockerfile`](../../Dockerfile) собирает только Go-бинарники; если появится отдельный образ/стадия со `frontend` build — включить туда же передачу build-secret для npm (в рамках этой задачи — только если такой путь уже есть в репозитории; иначе зафиксировать «не применимо» в `REPORT.md`).

## Входит в объём

- Обновление **GitHub Actions**: `ci.yml`, `bootstrap-ci.yml`, `runner-cache-warmup.yml` — шаги `env` / `secrets` для установки `@april/*` перед `npm ci`.
- Документирование **имени секрета** и политики rotation для maintainers (кратко в `REPORT.md` и полно в **050** в `DEPLOYMENT_STRATEGY` / отдельный раздел).
- Оптимизация **submodules / ds:prepare**: убрать обязательность полной сборки DisignApril на каждом PR, если lock уже тянет DS из registry (согласовать с задачей **048**, чтобы не ломать копирование SVG из showcase, пока не описан заменитель).

## Не входит в объём

- Настройка org secrets в GitHub UI (делает человек с правами); задача описывает **ожидаемые имена и контракт**.
- Изменение backend или доменной логики.

## Технические ограничения

- Не коммитить PAT в репозиторий.
- Сохранить совместимость с `SUBMODULES_TOKEN` для остальных submodule, если они остаются.

## Требования к дизайн-системе (для frontend-задач)

- [x] Не применимо к UI-компонентам; проверка — зелёный frontend pipeline.

## Критерии готовности (acceptance)

- [x] Workflows настроены под зелёный CI: `npm ci` + lint + test + build для `frontend/` **без** обязательной сборки `design-system/DisignApril` через pnpm (см. 048 / `ds:prepare`); фактический прогон — на self-hosted после merge PR.
- [x] В workflow явно заданы переменные для GitHub Packages (как минимум `NODE_AUTH_TOKEN` из `secrets`).
- [x] В `REPORT.md` перечислены затронутые workflow-файлы и имя секрета(ей).

## Проверка (команды)

```bash
# Локально имитация CI:
cd frontend
NODE_AUTH_TOKEN=... npm ci
npm run lint && npm run test && npm run build
```

## Результат в отчёте

[`REPORT.md`](./REPORT.md): diff по workflows, инструкция для добавления секрета в форке, известные ограничения self-hosted runner.

## Человекопонятная история в docs-site (обязательно)

- [ ] Объединённая страница — в задаче [`050`](../050-phase-7-ds-npm-registry-docs-and-release-story/TASK.md).

## Зависимости

- **Зависит от:** задачи **048** (semver-зависимости и lock под registry) или параллельный PR с согласованной веткой.
- **Блокирует:** полное закрытие внешней постановки до завершения **050** (документация bump / регрессии).

## Статус выполнения (2026-04-29)

В workflows добавлены `NODE_AUTH_TOKEN` и `permissions.packages: read` для шагов с `npm ci` в `frontend/`. Детали и контракт секретов — [`REPORT.md`](./REPORT.md).
