# План: задача 058 — DS JSON в `profiles-widget`

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-05-01
- **Статус плана:** согласован (реализация по факту)

## Исходные допущения

- Завершена **057**: `EntityTypesDraftJsonEditor`, `peerDependencies` на `@april/ui` ≥ 0.1.5, `mapApiErrorToProfilesProviderError` / `schemaIssues`.
- `ProfilesDataProvider.listEntityTypes` возвращает только `id` и `label` — **без JSON Schema документа** для режима **Form** (`AprilJsonSchemaForm`). Режим **JSON / Form** в объёме 058 **не внедряется**; follow-up при появлении схемы в API или расширении `EntityTypeOption`.

## Порядок работ (шаги)

1. Заменить строковый `Textarea` в `ProfilesWidgetCore` на стек DS: переиспользование **`EntityTypesDraftJsonEditor`** (Tree / Source, `AprilJsonValidationSummary`), **`AprilJsonTreeEditor`** read-only для просмотра текущей/исторической версии вне режима редактирования.
2. Хранить черновик create/edit как **`Record<string, unknown>`** + зеркало source-текста и режим `tree` | `source`; при сохранении из Source — парсинг через **`parseEntityTypeDraftSchemaText`** (как в 057).
3. Обернуть виджет в **`DensityProvider`** (`@april/ui`), как в **057**.
4. Проброс **`schemaIssues`** с ошибок create/update в `serverValidationItems` редактора.
5. Обновить тесты: расширить мок `@april/ui`, стабильные **`data-testid`** для зон create/edit документа.
6. Обновить **`docs/widgets/profile/profiles-widget.md`**, **`task_list.md`**, docs-site, **`REPORT.md`**.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Frontend `@april/profile-ui` | `ProfilesWidgetCore.tsx`, тесты Core/Widget |
| Документация | `docs/widgets/profile/profiles-widget.md`, docs-site, `task_list.md` |
| Backend / OpenAPI | нет |

## Режим JSON ↔ Form

- **Не реализовано:** нет доверенной JSON Schema документа профиля в провайдере без расширения контракта.
- При переключении Tree ↔ Source — правила как в **057** (реализованы внутри `EntityTypesDraftJsonEditor`).

## Риски и откат

- **Риск:** расхождение клиентской проверки `{ type: "object" }` и серверной валидации документа → **Митигация:** сервер остаётся источником истины; `schemaIssues` показываются в summary.
- **Откат:** revert PR с `ProfilesWidgetCore` и доками.

## Проверка после выполнения

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

## Примечания

- Связь: **057** (паттерн DS JSON), **058** TASK (критерии приёмки).
