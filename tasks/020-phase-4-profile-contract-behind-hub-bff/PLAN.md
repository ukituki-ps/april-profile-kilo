# План: Фаза 4.2 (часть 1, AprilProfile) — контракт «за BFF»

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-23
- **Статус плана:** согласован

## Исходные допущения
- AprilProfile остаётся backend-сервисом с API под базой `/api`, а BFF AprilHub публикует маршрут для админ-зоны как `/admin/profile/...`.
- `tenant_id` извлекается только из доверенного JWT контекста (claims), не из query/body/кастомных заголовков от браузера.
- Задача покрывает контракт и документацию в репозитории AprilProfile; реализация прокси и OIDC-клиента в Hub остаётся в задаче 021.

## Порядок работ (шаги)
1. Зафиксировать контракт Hub BFF → Profile в документации (маршрут, заголовки, доверенная цепочка, CORS, tenant).
2. Синхронизировать OpenAPI (`servers`, описание security и BFF-path), чтобы контракт совпадал с фактическими путями API.
3. Добавить воспроизводимый dev smoke через локальный reverse proxy (команды + `curl`) без готового Hub.
4. Обновить артефакты задачи: `REPORT.md`, история в docs-site, overview задач, статус в `task_list.md`.
5. Прогнать проверки из постановки (`go vet`, `go test`, `make openapi-lint`, `make docs-build`).

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Без изменений runtime-кода |
| Frontend | Без изменений |
| БД / Atlas | Нет изменений |
| Инфра / Compose | Только описание локального reverse proxy для smoke |
| Документация / OpenAPI | Контракт BFF, trusted headers, smoke, task-story, отчёт |

## Риски и откат
- **Риск:** неконсистентность между текстовым контрактом и OpenAPI. → **Митигация:** правки в одном PR + `make openapi-lint`.
- **Риск:** ложное доверие недоверенным источникам tenant. → **Митигация:** явно зафиксировать запрет на tenant из query/body/браузерных headers.
- При необходимости отката: revert документирующих изменений и вернуть прежний `openapi/openapi.yaml`.

## Проверка после выполнения
- Команды: `go vet ./...`, `go test ./...`, `make openapi-lint`, `make docs-build`.
- Smoke (dev-local): запуск временного nginx proxy и `curl` вызовы через `/admin/profile/api/v1/...` с Bearer-токеном.

## Примечания
- Связанный follow-up: реализация маршрутизации BFF и OIDC в [AprilHub] задаче [`../021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/TASK.md`](../021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/TASK.md).
