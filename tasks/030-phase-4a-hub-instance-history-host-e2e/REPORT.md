## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4a.3 (AprilHub) — хостинг истории экземпляра и e2e smoke
- Репозиторий реализации: `april-worker`
- Ветка: `develop` (локальная рабочая; merge через PR в `april-worker`)
- Ветка трассировки в `april-profile`: `feature/report-030-hub-instance-history`
- PR (черновик сравнения, GitHub): https://github.com/ukituki-ps/april-profile/compare/develop...feature/report-030-hub-instance-history

## 2) Что сделано в AprilHub (`april-worker`)
- Добавлен host-экран `InstanceHistoryHostWidget` для маршрута `/app/profile/instances/:instanceId/history`.
- Реализована загрузка истории версий через BFF-контур (`GET /v1/entities/{id}` + `GET /v1/entities/{id}/versions/{version}`), просмотр snapshot и diff.
- Зафиксировано ограничение read-only (restore endpoint не доступен в текущем контракте API).
- В экран экземпляров добавлено update-действие, чтобы покрыть happy-path "изменение данных -> новая версия -> просмотр истории".
- Обновлён Playwright smoke-сценарий под новый путь истории.
- Обновлены docs в `april-worker`: `docs/WIDGET_CONTRACTS.md`, `docs-site/docs/task-story-030-phase-4a-hub-instance-history-host-e2e.md`, `docs-site/docs/task-stories-overview.md`.
- Стабилизирован локальный smoke-скрипт `april-worker/scripts/run-playwright-aprilhub.sh` (ожидание JWKS Keycloak перед стартом `hub-bff`, чтобы не ловить race на cold start).

## 3) Проверки
- `cd hub-shell && npm run lint && npm run test` — ✅ успешно.
- `DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh` — ✅ успешно (7/7 Playwright smoke после стабилизации ожидания Keycloak JWKS).

## 4) Ограничения и ручные условия
- Restore не реализован (нет контрактного endpoint в текущей версии API).
- Для smoke нужен Docker (скрипт поднимает compose-профиль `aprilhub` и однократно тянет образ `busybox:1.36` для проверки JWKS внутри сети compose).
- Для login smoke требуются рабочие креды Keycloak (`PLAYWRIGHT_USER`/`PLAYWRIGHT_PASSWORD`).

## 5) Ссылки
- Реализация в april-worker: `tasks/028-aprilhub-execute-external-task-030-april-profile-1/`
- Постановка в april-worker: `tasks/028-aprilhub-execute-external-task-030-april-profile-1/TASK.md`
- План в april-worker: `tasks/028-aprilhub-execute-external-task-030-april-profile-1/PLAN.md`
- Отчёт в april-worker: `tasks/028-aprilhub-execute-external-task-030-april-profile-1/REPORT.md`
- Ветка реализации в `april-worker`: `feature/aprilhub-phase-4a3-instance-history-host-e2e` (ключевой коммит реализации: `ad08248`)
