## 1) Итого

- Статус: ✅ выполнено
- Задача: 059 — `AprilJsonSchemaForm` (RJSF) для `document` в `profiles-widget`
- Ветка: `feature/task-059-phase-7-profiles-widget-rjsf-document-form`
- Коммиты: см. `git log` на ветке `feature/task-059-phase-7-profiles-widget-rjsf-document-form` (после squash/merge в `develop` — хеш изменится)
- PR: не создавался из среды агента (ожидается PR в `develop` по политике репозитория)

## 2) Что сделано

- **[frontend]** Расширен **`EntityTypesDraftJsonEditor`**: режим **`form`**, опционально **`withFormMode`** + **`rjsfSchema`**, рендер **`AprilJsonSchemaForm`** (`hideDefaultSubmit`, синхронизация через `value`/`onChange` с Tree/Source), сегменты **Tree | Source | Form** только при доступной схеме.
- **[frontend]** **`ProfilesWidgetCore`**: условие Form = наличие **`provider.getEntityTypePublishedSchema`** и успешный снимок **`published_schema`**; подсказки **`Alert`** при `none` / `error`; сброс **Form** при потере схемы, смене **`createTypeId`**, snapshot/cancel (как в **`PLAN.md`**).
- **[docs]** Обновлены **`docs/widgets/profile/profiles-widget.md`**, **`task_list.md`**, docs-site (**`task-story-059-...`**, **`task-stories-overview.md`**).
- **[deps]** В **`@april/profile-ui`** добавлен **`@rjsf/utils`** (^6.5.1) в **devDependencies** для типа **`RJSFSchema`** (согласован с зависимостями **`@april/ui`**).

## 3) Где какой компонент DS

| Область UI | Компонент DS |
|------------|----------------|
| Форма документа по JSON Schema | **`AprilJsonSchemaForm`** |
| Дерево / Source (как в 058) | **`AprilJsonTreeEditor`**, **`AprilJsonCollectionTextEditor`**, **`AprilJsonValidationSummary`** |
| Обёртка плотности | **`DensityProvider`** |

## 4) Изменённые файлы

- `frontend/packages/profile-ui/package.json`
- `frontend/packages/profile-ui/src/components/EntityTypesDraftJsonEditor.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `docs/widgets/profile/profiles-widget.md`
- `task_list.md`
- `tasks/059-phase-7-profiles-widget-rjsf-document-form/PLAN.md`
- `tasks/059-phase-7-profiles-widget-rjsf-document-form/REPORT.md`
- `docs-site/docs/task-story-059-phase-7-profiles-widget-rjsf-document-form.md`
- `docs-site/docs/task-stories-overview.md`
- `frontend/package-lock.json` (если обновлялся при `npm install`)

## 5) Миграции и данные

- Миграции Atlas: нет

## 6) Проверка качества

- Линтер (`tsc --noEmit` для `@april/profile-ui`): ok
- Сборка (`npm run build -w @april/profile-ui`): ok
- Unit tests (`npm run test -w @april/profile-ui`): ok
- Go (`go test ./...`): ok

Команды:

```bash
cd /home/ukituki/april-profile-1/frontend && npm run lint -w @april/profile-ui
cd /home/ukituki/april-profile-1/frontend && npm run test -w @april/profile-ui
cd /home/ukituki/april-profile-1/frontend && npm run build -w @april/profile-ui
cd /home/ukituki/april-profile-1 && go test ./...
```

## 7) Деплой

- Не выполнялся (не входило в постановку).

## 8) Риски и ограничения

- **Двойная валидация** (Ajv в RJSF и сервер): клиент не блокирует merge; при расхождении — **422** и **`schemaIssues`** в **`AprilJsonValidationSummary`**.
- **ABAC-усечённый `document`** против полной схемы типа: возможны «лишние» поля в Tree относительно формы или наоборот; сервер финальный.
- **Ревизия схемы**: в 059 используется последняя published-схема семейства типа по `entity_type_id`, не привязка к ревизии сущности — **follow-up** при расширении API (**`TASK.md`**).

## 9) Что осталось

- [ ] PR + merge по процессу команды
- [ ] При появлении поля схемы ревизии на снимке профиля — сменить источник `rjsfSchema` и обновить документацию
