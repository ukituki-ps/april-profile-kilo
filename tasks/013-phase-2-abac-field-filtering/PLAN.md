# План: ABAC-фильтрация выдачи по сегментам полей

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-21
- **Статус плана:** согласован с реализацией

## Исходные допущения

- Сегмент полей = namespace верхнего уровня в JSON-документе профиля (как в `internal/profiles/document_paths.go`); корневые скаляры — сегмент `default`.
- Источник прав — realm-роли Keycloak в access token (`realm_access.roles`), уже извлекаемые валидатором JWT.
- Политика задаётся конфигом репозитория/окружения без секретов; пустой конфиг = фильтрация выключена (обратная совместимость для локальной разработки).

## Порядок работ (шаги)

1. Пакет `internal/abac`: разбор JSON-политики, фильтрация `document` и `_meta.authority` по сегментам.
2. HTTP GET `/v1/entities/*` и `/v1/external-mappings/*/entity`: применение фильтра после загрузки снимка из БД.
3. Конфиг `ABAC_SEGMENT_ACCESS_JSON`, разбор при старте в `app.Run`.
4. Тесты: unit (`abac`, `httpapi`), интеграционный сценарий с Postgres + JWT.
5. OpenAPI и `.env.example`, страница docs-site, `REPORT.md`.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | `internal/abac`, `internal/httpapi`, `internal/app`, `internal/config` |
| Frontend | нет |
| БД / Atlas | нет |
| Документация / OpenAPI | `openapi/openapi.yaml`, `docs-site`, `.env.example` |

## Риски и откат

- **Риск:** слишком узкая политика на стенде скрывает нужные поля → **Митигация:** явно задать `default` и нужные namespace в JSON; пустой env отключает ABAC.
- **Риск:** ошибка в JSON политики → сервис не стартует → исправить переменную окружения.
- Откат: убрать или очистить `ABAC_SEGMENT_ACCESS_JSON`, redeploy.

## Проверка после выполнения

- `go test ./...`, `go test -tags=integration ./...`, `go vet ./...`
- `make openapi-lint`, `scripts/check-openapi-compat.sh`, `make docs-build`

## Примечания

- Соответствует ADR-0003 (ABAC по меткам/сегментам полей).
- Админ-ответы (resolve конфликта и т.д.) без изменений в этой задаче — только доменные GET чтения профиля.
