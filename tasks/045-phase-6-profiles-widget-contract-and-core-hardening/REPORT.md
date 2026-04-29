# Отчёт: hardening контракта `ProfilesWidget` и поведения `ProfilesWidgetCore` до целевого варианта C

## 1) Итого
- Статус: ✅ выполнено
- Задача: hardening контракта `ProfilesWidget` и поведения `ProfilesWidgetCore` до варианта C
- Ветка: `feature/task-045-profiles-widget-contract-and-core-hardening`
- Коммиты: не создавались в рамках этой сессии
- PR: не создавался

## 2) Что сделано
- [frontend] В `ProfilesWidgetCore` добавлены контрактные поля `initialSort`, `autoSelectFirst`, `onOpenEntity`, расширен `onError` payload (`code`), list-запросы переведены на `initialSort`.
- [frontend] Обновлён update flow: `Core` передаёт `expectedVersion` в `provider.update(...)`.
- [frontend] Расширен тип `UpdateProfileInput` полем `expectedVersion?: number`.
- [frontend] Обновлён `ProfilesApiWidget`: новый props wiring (`initialSort`, `autoSelectFirst`, `onOpenEntity`).
- [frontend/tests] Обновлены тесты `ProfilesWidgetCore` и `ProfilesListWidget` под новый контракт (включая `autoSelectFirst=false`, `onOpenEntity`, `onError.code`, `expectedVersion`).
- [docs] Обновлены контрактные документы и README пакета.
- [docs-site] Добавлена человекопонятная история задачи 045 и обновлён обзор `task-stories-overview`.
- [process/docs] В `task_list.md` задача 045 отмечена как выполненная.

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/providers/profilesDataProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiProfilesProvider.ts`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesApiWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.test.tsx`
- `frontend/packages/profile-ui/README.md`
- `docs/WIDGET_CONTRACTS.md`
- `docs-site/docs/widget-contracts.md`
- `docs/widgets/profile/profiles-widget.md`
- `docs-site/docs/task-story-045-phase-6-profiles-widget-contract-and-core-hardening.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/045-phase-6-profiles-widget-contract-and-core-hardening/TASK.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; изменения обратимы git-revert соответствующих файлов

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (frontend integration/RTL в рамках `@april/profile-ui`)
- E2E / smoke: не запускались (в scope задачи не требовались)

Команды (фактически выполненные):
```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## 6) Деплой
- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не применялся

## 7) Риски и ограничения
- `expectedVersion` добавлен в provider-контракт и передаётся из Core, но текущий OpenAPI update endpoint пока не принимает это поле явно (подготовка к следующему этапу контрактного усиления).
- Полный hardening `ProviderContext + Abort + расширенная observability` вынесен в задачу 046.

## 8) Что осталось
- [ ] Реализовать задачу 046: provider-context/abort/observability hardening.
- [ ] Реализовать задачу 047: тестовая матрица и release-gate.
