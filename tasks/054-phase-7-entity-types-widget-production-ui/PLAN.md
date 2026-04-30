# План: `entity-types-widget` (production UI, DS-first)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-30
- **Статус плана:** согласован с выполнением

## Исходные допущения

- OpenAPI/SDK после задачи **053** уже в репозитории; апгрейд сущностей — `ProfilesService`, каталог типов — `EntityTypesService` + прямые `request()` там, где операции разнесены по сервисам.
- Паттерн эталона — `ProfilesWidgetCore` / `openapiProfilesProvider` / `ProviderContext` / `AbortController` в Core.
- Тексты UI на английском в коде (как в `ProfilesWidgetCore`), без отдельной i18n-инициативы.

## Порядок работ (шаги)

1. Контракт данных: `EntityTypesDataProvider` + типы домена (семейство, ревизия, batch upgrade).
2. Транспорт: `createOpenApiEntityTypesProvider` (`openapiEntityTypesProvider.ts`) с `withSignal`, маппингом ошибок и `request_id`.
3. UI: `EntityTypesWidgetCore` (master–detail, Tabs Draft/Revisions/Upgrade, 409 draft, модалки create/patch/delete).
4. Wiring: `EntityTypesApiWidget`, фасад `EntityTypesWidget`, экспорты пакета, semver **minor** `0.3.0`.
5. Telemetry: расширение `ProfileWidgetTelemetryKind` / `ProfileWidgetTelemetryEventName`, `EntityTypesWidgetAction` в `types.ts`.
6. Тесты: Core (мок-провайдер, конфликт черновика, abort list), provider (fetch mock).
7. Документация: `docs/widgets/profile/entity-types-widget.md`, `frontend/packages/profile-ui/README.md`, `REPORT.md`.

## Затрагиваемые области

| Область | Что меняется |
|--------|----------------|
| Frontend `@april/profile-ui` | Новые компоненты, провайдеры, тесты, экспорты, bump `0.3.0` |
| Документация | Карточка виджета, README пакета |
| Backend / БД | Нет |

## Риски и откат

- **Риск:** расхождение сгенерированного SDK с ручными `openApiRequest` → **Митигация:** тела запросов сверены с `openapi.yaml`.
- Откат: revert коммита(ов) ветки `feature/task-054-phase-7-entity-types-widget-production-ui`.

## Проверка после выполнения

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

## Примечания

- ADR-0005 — модель ревизий и привязки сущностей.
- Handoff Hub/BFF — задача **055**.
