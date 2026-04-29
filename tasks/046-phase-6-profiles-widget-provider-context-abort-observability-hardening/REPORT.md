# Отчёт: hardening provider-контекста, отмены запросов и observability в `ProfilesWidget`

## 1) Итого
- Статус: ✅ выполнено
- Задача: hardening provider-контекста, отмены запросов и observability в `ProfilesWidget`
- Ветка: `feature/task-046-phase-6-profiles-widget-provider-context-abort-observability-hardening`
- Коммиты: не создавались в рамках этой сессии
- PR: не создавался

## 2) Что сделано
- [frontend] Контракт `ProviderContext` расширен до `tenantId`, `auth`, `telemetry`, `signal`.
- [frontend] `ProfilesApiWidget` теперь формирует provider context из `hostContext` + `accessToken` и передает его в `ProfilesWidgetCore`.
- [frontend] В `ProfilesWidgetCore` внедрена реальная отмена in-flight list/details запросов через `AbortController` и cleanup на unmount/re-run.
- [frontend] Добавлены transport telemetry события: `list_requested`, `list_succeeded`, `list_failed`, `details_requested`, `details_failed` с метаданными (`operation`, `entity_id`, `row_count`, `has_next_cursor`, `latency_ms`, `error_code`, `phase`).
- [frontend] `openapiProfilesProvider` переведен на request-scoped конфиг через `generated/core/request` без мутации глобального `OpenAPI.BASE/TOKEN`.
- [frontend/tests] Обновлены тесты `ProfilesWidgetCore` для подтверждения abort/race и telemetry поведения.
- [docs] Обновлены docs по контракту и observability (`WIDGET_CONTRACTS`, docs-site mirror, widget card, package README).
- [docs-site] Добавлена task story 046 и обновлен общий overview задач.
- [process/docs] В `task_list.md` задача 046 отмечена как выполненная.

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/providers/profilesDataProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiProfilesProvider.ts`
- `frontend/packages/profile-ui/src/components/ProfilesApiWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/observability.ts`
- `frontend/packages/profile-ui/src/index.ts`
- `frontend/packages/profile-ui/README.md`
- `docs/WIDGET_CONTRACTS.md`
- `docs-site/docs/widget-contracts.md`
- `docs/widgets/profile/profiles-widget.md`
- `docs-site/docs/task-story-046-phase-6-profiles-widget-provider-context-abort-observability-hardening.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/046-phase-6-profiles-widget-provider-context-abort-observability-hardening/TASK.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; изменения обратимы git-revert

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (frontend integration/RTL в рамках `@april/profile-ui`)
- E2E / smoke: не запускались (в scope не требовались)

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
- Generated OpenAPI runtime внутренне использует собственный `AbortController`; в provider реализован bridge `AbortSignal -> cancelable request`, чтобы обеспечить внешнюю отмену без генерации нового SDK.
- Полный release-gate и расширенная тестовая матрица для варианта C остаются задачей 047.

## 8) Что осталось
- [ ] Реализовать задачу 047: test matrix + release gate.
