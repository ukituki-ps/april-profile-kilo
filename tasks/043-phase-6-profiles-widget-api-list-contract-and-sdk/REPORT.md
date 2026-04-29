## 1) Итого
- Статус: ✅ выполнено
- Задача: API-ready контур для `ProfilesWidget` (server-side list/search/filter/pagination + SDK)
- Ветка: `develop`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [backend] Добавлен list endpoint `GET /v1/entities` в HTTP-слой:
  - query-параметры `search`, `entity_type_id`, `limit`, `cursor`, `sort`;
  - `422` для невалидного `cursor`/`limit`;
  - единый error envelope с `code`, `message`, `request_id`.
- [backend] В `profiles.Service` реализован `List(...)`:
  - server-side search/filter;
  - cursor pagination (`updated_desc`/`updated_asc`);
  - детерминированный порядок;
  - `next_cursor` и `total_count`.
- [frontend] Обновлен generated OpenAPI SDK в `@april/profile-ui/src/generated`:
  - добавлен метод `ProfilesService.listEntityProfiles(...)`;
  - добавлены новые модели list response/item.
- [docs] Обновлены OpenAPI и пользовательские/docs-site материалы для 043.

## 3) Изменённые файлы
- `internal/profiles/service.go`
- `internal/httpapi/server.go`
- `internal/httpapi/server_test.go`
- `internal/integrationtest/integration_test.go`
- `openapi/openapi.yaml`
- `frontend/packages/profile-ui/src/generated/services/ProfilesService.ts`
- `frontend/packages/profile-ui/src/generated/models/ProfileListItem.ts`
- `frontend/packages/profile-ui/src/generated/models/ProfileListResponse.ts`
- `frontend/packages/profile-ui/src/generated/index.ts`
- `docs/widgets/profile/profiles-widget.md`
- `tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md`
- `tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/REPORT.md`
- `docs-site/docs/task-story-043-phase-6-profiles-widget-api-list-contract-and-sdk.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: схема БД не менялась
- Обратимость: да; откат — revert endpoint/SDK/docs изменений

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (таргетный test под `-tags=integration`)
- E2E / smoke: не запускались

Команды (фактически выполненные):
```bash
go test ./internal/httpapi ./internal/profiles
go test -tags=integration ./internal/integrationtest -run TestProfilesService_ListSupportsSearchFilterAndCursor
go test ./...
cd frontend && npm run lint && npm run test && npm run build
```

## 6) Деплой
- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- Поле `preview` строится из первого строкового значения документа или JSON-строки; при сложных документах может потребоваться отдельная продуктовая настройка preview-логики.
- Полнотекстовый поиск по `document::text` может потребовать индексации/оптимизации на больших объемах данных.
- `429` описан в OpenAPI как контрактная готовность; runtime rate-limit поведение зависит от внешнего middleware/инфра-контура.

## 8) Что осталось
- [ ] Выполнить задачу 044: перевести `ProfilesWidget` на `Core + ApiWidget` и удалить demo-first data flow.
