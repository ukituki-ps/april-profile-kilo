## 1) Итого

- Статус: ✅ выполнено
- Задача: 057 — JSON-редакторы `@april/ui` в `entity-types-widget`
- Ветка: выполнение в рабочей копии; merge — через PR в `feature/*` → `develop` (см. `DEPLOYMENT_STRATEGY.md`)
- Коммиты: см. историю ветки после `git commit`
- PR: не создавался из среды агента

## 2) Что сделано

- [frontend] `EntityTypesWidgetCore`: черновик и начальный черновик в модалке — **`EntityTypesDraftJsonEditor`** (Tree / Source на **`AprilJsonTreeEditor`** + **`AprilJsonCollectionTextEditor`**), **`DensityProvider`** вокруг виджета; вкладка **Revisions** — выбор строки + read-only **`AprilJsonTreeEditor`** для `schema`.
- [frontend] Новый модуль **`EntityTypesDraftJsonEditor.tsx`**, константа **`ENTITY_TYPE_DRAFT_ROOT_JSON_SCHEMA`** (`{ type: "object" }`), парсер **`parseEntityTypeDraftSchemaText`**.
- [frontend] **`apiErrorMapping.ts`**: **`mapApiErrorToProfilesProviderError`** с поддержкой **`issues`** из тела ошибки; **`ProfilesProviderError.schemaIssues`**; **`openapiEntityTypesProvider`** и **`openapiProfilesProvider`** переведены на общий маппер.
- [docs] Обновлены **`docs/widgets/profile/entity-types-widget.md`** §5, **`frontend/packages/profile-ui/README.md`** (peer/host), **`PLAN.md`** задачи 057.
- [docs-site] Страница **`task-story-057-phase-7-profile-ui-ds-json-entity-types.md`**, строка в **`task-stories-overview.md`**; **`task_list.md`** — задача 057 отмечена выполненной.

## 3) Изменённые файлы

- `frontend/packages/profile-ui/src/components/EntityTypesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/EntityTypesDraftJsonEditor.tsx`
- `frontend/packages/profile-ui/src/components/EntityTypesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/providers/apiErrorMapping.ts`
- `frontend/packages/profile-ui/src/providers/profilesDataProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiEntityTypesProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiProfilesProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiEntityTypesProvider.test.ts`
- `frontend/packages/profile-ui/package.json`
- `docs/widgets/profile/entity-types-widget.md`
- `tasks/057-phase-7-profile-ui-ds-json-entity-types-integration/PLAN.md`
- `docs-site/docs/task-story-057-phase-7-profile-ui-ds-json-entity-types.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные

- Нет.

## 5) Проверка качества

- Линтер `@april/profile-ui`: ok (`tsc --noEmit`)
- Сборка `@april/profile-ui`: ok (`npm run build -w @april/profile-ui`)
- Unit tests `@april/profile-ui`: ok (23 теста)
- Линтер shell-приложения: ok (`npm run lint:app`)
- Vitest shell: ok
- Go: ok (`go test ./...`)

Команды:

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
cd frontend && npm run lint:app && npm run test:app
go test ./...
```

## 6) Деплой

- Не применялся (задача только фронтенд-пакет и документация).

## 7) Риски и ограничения

| Риск | Комментарий |
|------|-------------|
| Двойной Ajv | Клиентская проверка в `AprilJsonTreeEditor` + сервер; возможны расхождения по полной семантике JSON Schema. |
| Вложенный `DensityProvider` | Если host уже оборачивает в `AprilProviders`, контекст плотности будет вложенным — приемлемо для изоляции виджета. |
| `schemaIssues` из API | Маппинг рассчитан на поле `issues` в JSON-теле; иной формат не отобразится в summary. |

## 8) Компоненты `@april/ui` по экранам

| Компонент | Где |
|-----------|-----|
| `DensityProvider` | Корень `EntityTypesWidgetCore` |
| `CardListColumn` | Список семейств (без изменений) |
| `AprilJsonTreeEditor` | Draft (режим Tree), Revisions (read-only), Create (режим Tree) |
| `AprilJsonCollectionTextEditor` | Draft / Create (режим Source) через `EntityTypesDraftJsonEditor` |
| `AprilJsonValidationSummary` | Внутри `EntityTypesDraftJsonEditor` (серверные `issues` + пустой блок скрывается) |

## 9) Что осталось

- [ ] Задача **058** — тот же стек для **`ProfilesWidget`** (документ профиля).
