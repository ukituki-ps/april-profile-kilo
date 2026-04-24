## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4a.5 — observability-события виджетов и semver readiness (`@april/profile-ui`)
- Ветка: `feature/phase-4a-widget-observability-semver`
- Коммиты: один коммит на ветке `feature/phase-4a-widget-observability-semver` (актуальный SHA — `git log -1` после merge/rebase)
- PR: не создавался (локальная ветка от `develop`)

## 2) Что сделано
- [frontend] В `frontend/packages/profile-ui` добавлен модуль `observability.ts`: типы `ProfileWidgetTelemetryEvent`, эмиссия с `request_id` / `correlation_id` из `HostContext.telemetry`, опционально `api_request_id` для ошибок админ-API.
- [frontend] Во все целевые виджеты 4a и `EntityProfileWidget` добавлен опциональный `onObservability`; события `view_loaded`, `save_submitted`, `save_succeeded`, `save_failed` согласованы с операциями (в т.ч. без дублирующего `view_loaded` после resolve/merge в `ConflictQueueWidget`).
- [frontend] Версия пакета **0.2.0** (minor); экспорт типов и хелперов из `index.ts`; в `HostContext.telemetry` — опциональное поле `correlationId`.
- [frontend] `npm run test` во `frontend/`: сначала Vitest только для `src/` shell, затем `vitest` workspace `@april/profile-ui` (исключён двойной прогон через `vite.config.ts`).
- [docs] Обновлены `WIDGET_OBSERVABILITY_GUIDE.md`, `VERSIONING_AND_COMPATIBILITY.md` (§1.1 для profile-ui), `WIDGET_CONTRACTS.md`; зеркала в `docs-site/docs/`.
- [docs-site] Страница `task-story-033-…`, запись в `task-stories-overview.md`.
- [tasks] `PLAN.md`, обновлены `TASK.md` и `task_list.md`.

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/observability.ts`, `observability.test.ts`
- `frontend/packages/profile-ui/src/types.ts`, `src/index.ts`
- `frontend/packages/profile-ui/src/components/EntityProfileWidget.tsx`, `EntityProfileWidget.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfileInstancesWidget.tsx`
- `frontend/packages/profile-ui/src/components/InstanceHistoryWidget.tsx`
- `frontend/packages/profile-ui/src/components/ConflictQueueWidget.tsx`
- `frontend/packages/profile-ui/package.json`, `README.md`
- `frontend/package.json`, `frontend/vite.config.ts`
- `docs/WIDGET_OBSERVABILITY_GUIDE.md`, `docs/VERSIONING_AND_COMPATIBILITY.md`, `docs/WIDGET_CONTRACTS.md`
- `docs-site/docs/widget-observability-guide.md`, `widget-contracts.md`, `versioning-and-compatibility.md`, `task-stories-overview.md`, `task-story-033-phase-4a-profile-widget-observability-semver.md`
- `tasks/033-phase-4a-profile-widget-observability-semver/TASK.md`, `PLAN.md`, `REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok (shell `src/App.test.tsx` + все тесты `@april/profile-ui`)
- Integration tests: не запускались (не затрагивали backend)
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
make docs-build
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md` — деплой не входил в задачу

## 7) Риски и ограничения
- Полная e2e-корреляция с логами Profile зависит от того, что Hub прокидывает те же id в заголовках HTTP и в `telemetry` виджета; без этого события остаются полезными на стороне UI, но цепочка с бэкендом неполная.
- `InstanceHistoryWidget` в текущем API не эмитит `save_*` (только `view_loaded`).

## 8) Что осталось
- [ ] Задача `034` (`tasks/034-phase-4a-hub-widget-release-gates-smoke/TASK.md`): release gates, smoke/e2e и проверка semver на стороне AprilHub.
- [ ] Подключить `onObservability` в host AprilHub и канал агрегации (по runbook april-worker).

## Таблица событий по виджетам

| Виджет (`widget`) | `view_loaded` | `save_submitted` / `save_succeeded` / `save_failed` |
|-------------------|---------------|------------------------------------------------------|
| `entity_profile` | После успешной загрузки снапшота | `PUT` профиля (включая валидация JSON до API) |
| `profiles_list` | После загрузки списка по `entityIds` | create / update / delete профиля |
| `profile_instances` | После загрузки экземпляров | create / update / delete |
| `instance_history` | После построения таймлайна версий | Нет (read-only UI) |
| `conflict_queue` | После успешного list conflicts (и при Refresh) | resolve conflict, merge duplicates |

## Semver (кратко для Hub)

См. `docs/VERSIONING_AND_COMPATIBILITY.md` §1.1: **PATCH** — исправления без смены контракта; **MINOR** — новые optional props/поля telemetry/события, обратно совместимые; **MAJOR** — ломающие изменения props или схемы `ProfileWidgetTelemetryEvent`. Релизы с пользовательски значимыми изменениями сопровождаются записями в changelog пакета.
