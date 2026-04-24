## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4a.3 (AprilProfile) — виджет истории экземпляра (версии + diff)
- Ветка: `feature/phase-4a-profile-instance-history-widget`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [frontend] Добавлен новый `InstanceHistoryWidget` в `@april/profile-ui` с загрузкой append-only истории версий экземпляра через OpenAPI-клиент (`current` + `by version`).
- [frontend] Реализованы таймлайн версий (`version`, `created_at`, `source`, `actor`), просмотр снапшота выбранной версии и diff относительно `previous` или `current`.
- [frontend] Зафиксировано read-only поведение при отсутствии restore endpoint: виджет явно показывает ограничение контракта.
- [frontend] Добавлена demo-страница `/instance-history-widget-demo` в shell-приложении.
- [tests] Добавлены Vitest/RTL + MSW тесты для таймлайна, выбора версии и compare-режимов diff.
- [docs] Добавлены `PLAN.md`, task story для `029`, обновлены `task-stories-overview`, каталог widget-контрактов и `task_list.md`.

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/components/InstanceHistoryWidget.tsx`
- `frontend/packages/profile-ui/src/components/InstanceHistoryWidget.test.tsx`
- `frontend/packages/profile-ui/src/index.ts`
- `frontend/packages/profile-ui/README.md`
- `frontend/src/App.tsx`
- `docs/widgets/profile/instance-history-widget.md`
- `docs/widgets/README.md`
- `docs-site/docs/task-story-029-phase-4a-profile-instance-history-widget.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/029-phase-4a-profile-instance-history-widget/PLAN.md`
- `tasks/029-phase-4a-profile-instance-history-widget/REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применимо
- Обратимость: да; откат удалением UI и docs-изменений

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не запускались (backend не затронут)
- E2E / smoke: не запускались (Hub-host/e2e в задаче `030`)

Команды (фактически выполненные):
```bash
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui && npm run build -w @april/profile-ui
make openapi-lint
make docs-build
cd frontend && npm run lint && npm run test && npm run build
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применимо (изменения в frontend/docs)
- Rollback: не применялся

## 7) Риски и ограничения
- В текущем API нет restore endpoint, поэтому `InstanceHistoryWidget` intentionally read-only.
- Для сущностей с большим количеством версий клиент загружает каждую версию отдельным запросом; server-side list/pagination остаётся как follow-up.
- Интеграция в AprilHub (роутинг, BFF e2e, smoke) вынесена в задачу `030`.

## 8) Что осталось
- [ ] Создать commit(s) и PR с test plan/рисками в целевую ветку (`develop`).
- [ ] Выполнить сквозную host/e2e проверку после интеграции в AprilHub (`030`).
