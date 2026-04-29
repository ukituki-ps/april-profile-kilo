# Отчёт: финальная тестовая матрица и release-gate для `ProfilesWidget` варианта C

## 1) Итого
- Статус: ✅ выполнено
- Задача: финальная тестовая матрица и release-gate для `ProfilesWidget` варианта C
- Ветка: `feature/task-047-phase-6-profiles-widget-test-matrix-and-release-gate`
- Коммиты: не создавались в рамках этой сессии
- PR: не создавался

## 2) Что сделано
- [frontend/tests] Добавлены integration tests для `openapiProfilesProvider`:
  - mapping list payload;
  - status->normalized error mapping;
  - requestId extraction;
  - context token/baseUrl wiring;
  - `AbortSignal` behavior.
- [frontend/tests] Матрица `ProfilesWidgetCore` и `ProfilesWidget` подтверждена в полном прогоне (`race/abort`, `error payload`, `observability`, CRUD/smoke).
- [docs] В `docs/TESTING_STRATEGY.md` добавлен обязательный release-blocking раздел для `ProfilesWidget variant C`:
  - must-pass матрица;
  - обязательные команды;
  - blocking fail conditions.
- [docs] Усилен `docs/WIDGET_RELEASE_CHECKLIST.md` требованиями variant C gate и evidence в отчёте.
- [docs-site] Синхронизирована опубликованная копия release checklist.
- [docs] Обновлена карточка виджета `profiles-widget` разделом release gate variant C.
- [docs-site] Добавлена человекопонятная story по задаче 047 и обновлён overview задач.
- [process/docs] В `task_list.md` задача 047 отмечена как выполненная.

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/providers/openapiProfilesProvider.test.ts`
- `docs/TESTING_STRATEGY.md`
- `docs/WIDGET_RELEASE_CHECKLIST.md`
- `docs-site/docs/widget-release-checklist.md`
- `docs/widgets/profile/profiles-widget.md`
- `docs-site/docs/task-story-047-phase-6-profiles-widget-test-matrix-and-release-gate.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/047-phase-6-profiles-widget-test-matrix-and-release-gate/TASK.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; изменения обратимы git-revert

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok
- E2E / smoke: ok (локальный smoke в рамках `ProfilesWidget` test suite)

Команды (фактически выполненные):
```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

## 6) Деплой
- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не применялся

## 7) Риски и ограничения
- E2E smoke в этой задаче ограничен репозиторием `april-profile-1`; cross-repo проверки хоста AprilHub остаются вне scope.
- Для следующих изменений `ProfilesWidget` необходимо поддерживать актуальность матрицы и checklist в том же change set.

## 8) Что осталось
- [ ] Отдельно оформить commit/PR с test plan и рисками по политике репозитория.
