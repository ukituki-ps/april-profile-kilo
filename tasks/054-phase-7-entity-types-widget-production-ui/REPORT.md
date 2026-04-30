## 1) Итого

- Статус: ✅ выполнено
- Задача: 054 — `@april/profile-ui`: production-first виджет `entity-types-widget` (Core + ApiWidget + Provider + фасад)
- Ветка: `feature/task-054-phase-7-entity-types-widget-production-ui` (рекомендуется для PR)
- Коммиты: *(заполнить после `git commit`)*
- PR: не создавался из среды агента

## 2) Что сделано

- **[frontend]** Реализованы `EntityTypesWidgetCore` (state machine, `AbortController` для списка семейств и параллельной загрузки detail+revisions), `EntityTypesApiWidget`, публичный фасад `EntityTypesWidget`; контракт данных `EntityTypesDataProvider`; OpenAPI-провайдер `createOpenApiEntityTypesProvider` (типы, черновик с `if_draft_schema_version`, publish, ревизии, список профилей по `entity_type_id`, single/batch upgrade).
- **[frontend]** Обработка **401/403/409/422** через нормализованные коды (`ProfilesProviderError` / `isProfilesProviderError`) и пользовательские сообщения без сырого тела API; конфликт черновика **409** — предупреждение и «Reload draft».
- **[frontend]** Telemetry: `widget: "entity_types"`, события `list_*`, `details_*`, `draft_save_*`, `publish_*`, `upgrade_*`, `batch_upgrade_*` в `observability.ts`; колбэк `onAction` типа `EntityTypesWidgetAction`.
- **[docs]** Обновлены [`docs/widgets/profile/entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md) (props/events, `lifecycleStatus: beta`) и README пакета.
- **[semver]** Версия пакета `@april/profile-ui`: **0.2.0 → 0.3.0** (новые публичные экспорты).

### Чеклист дизайн-системы (TASK / REPORT)

Использованы компоненты **`@april/ui`**: `CardListColumn` (master-список семейств, `heightMode="fill"`).

Использованы компоненты **Mantine v7** (`@mantine/core`): `Stack`, `Box`, `Group`, `Text`, `Title`, `Button`, `Alert`, `Loader`, `Modal`, `Tabs`, `Textarea`, `TextInput`, `Select`, `Table`, `ScrollArea`, `Checkbox`, `ActionIcon`, `Tooltip`, `Card`.

Иконки: **`@tabler/icons-react`** с осмысленными `aria-label` на кнопках/иконках действий.

Проверка в Storybook DS: в рамках задачи не запускалась (артефакт submodule/организации); опора на те же примитивы, что и в эталонном `ProfilesWidgetCore`.

**Отходы от DS:** не вводились; JSON-редактор — `Textarea` с моноширинным стилем (как договорено в карточке виджета).

## 3) Изменённые и добавленные файлы

- `frontend/packages/profile-ui/src/components/EntityTypesWidget.tsx`
- `frontend/packages/profile-ui/src/components/EntityTypesApiWidget.tsx`
- `frontend/packages/profile-ui/src/components/EntityTypesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/EntityTypesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/providers/entityTypesDataProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiEntityTypesProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiEntityTypesProvider.test.ts`
- `frontend/packages/profile-ui/src/index.ts`
- `frontend/packages/profile-ui/src/types.ts`
- `frontend/packages/profile-ui/src/observability.ts`
- `frontend/packages/profile-ui/package.json`
- `frontend/packages/profile-ui/README.md`
- `docs/widgets/profile/entity-types-widget.md`
- `tasks/054-phase-7-entity-types-widget-production-ui/PLAN.md`
- `tasks/054-phase-7-entity-types-widget-production-ui/REPORT.md`
- При `npm run build` может обновляться каталог `frontend/packages/profile-ui/src/generated/*` из текущего `openapi/openapi.yaml` (как в скрипте пакета).

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: нет изменений схемы

## 5) Проверка качества

- Линтер (`tsc --noEmit`): ok
- Сборка пакета: ok
- Unit tests (Vitest): ok
- Integration / E2E: не расширялись сверх матрицы пакета (аналог 047: Core + provider)

Команды:

```bash
cd /home/ukituki/april-profile-1/frontend && npm run lint -w @april/profile-ui
cd /home/ukituki/april-profile-1/frontend && npm run test -w @april/profile-ui
cd /home/ukituki/april-profile-1/frontend && npm run build -w @april/profile-ui
cd /home/ukituki/april-profile-1 && go test ./...
```

## 6) Деплой

- Не выполнялся (вне scope задачи 054).

## 7) Риски и ограничения

- Список профилей на вкладке Upgrade не содержит признака «отстаёт от latest» в DTO list item — фильтрация «только отстающие» выполняется сервером через batch `only_behind_latest`, как в API.
- `GET /v1/entity-types` без пагинации: при очень большом каталоге список целиком в памяти UI (ограничение контракта API).

## 8) Сценарии «как пользоваться» (для docs-site / задачи 055)

1. Встроить `<EntityTypesWidget hostContext={…} apiBaseUrl={…} accessToken={…} />` в host с тем же BFF base, что и для `ProfilesWidget`.
2. Выбрать семейство слева; на **Draft** править JSON схемы, **Save draft**; при конфликте версии — **Reload draft**, затем снова сохранить.
3. **Publish** создаёт новую immutable-ревизию; история на вкладке **Revisions**.
4. **Upgrade**: выбрать целевую ревизию в `Select`, апгрейд одной сущности кнопкой со стрелкой, выбор чекбоксов + **Upgrade selected**, либо **Upgrade all behind latest** (батч).
5. Подписать `onOpenEntity` для перехода к виджету профиля по `entity_id`.

## 9) Что осталось

- [ ] PR в `develop`, smoke на стенде при интеграции Hub (задача **055**).
