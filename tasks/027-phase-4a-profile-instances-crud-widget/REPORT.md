## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4a.2 (AprilProfile) — виджет списка экземпляров профиля и CRUD экземпляра
- Ветка: `feature/phase-4a-profile-instances-widget`
- Коммиты: `5541d6b`
- PR: https://github.com/ukituki-ps/april-profile/pull/73

## 2) Что сделано
- [frontend] Добавлен новый `ProfileInstancesWidget` в `@april/profile-ui` с загрузкой по `instanceIds` в контексте `profileId`, поиском, пагинацией и навигационным callback `onOpenInstance`.
- [frontend] Реализован CRUD экземпляра через OpenAPI-клиент (`createEntityProfile`, `updateEntityProfile`, `deleteEntityProfile`) и событийный контракт `onAction`.
- [frontend] Добавлено явное ABAC-поведение: `hidden` (пропуск скрытых/404 строк), `readonly` (блок write-операций после `403`), `denied` (баннер при `401/403` на чтении).
- [frontend] В demo shell добавлен маршрут `/profile-instances-widget-demo` и пример локального запуска с env.
- [tests] Добавлены Vitest/RTL + MSW тесты для `ProfileInstancesWidget`: happy-path, readonly и denied сценарии.
- [docs] Обновлены README пакета, docs-site story/overview, добавлен `PLAN.md`, обновлён `task_list.md` (задача `027` отмечена выполненной).

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/components/ProfileInstancesWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfileInstancesWidget.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.tsx`
- `frontend/packages/profile-ui/src/index.ts`
- `frontend/packages/profile-ui/src/types.ts`
- `frontend/packages/profile-ui/README.md`
- `frontend/src/App.tsx`
- `tasks/027-phase-4a-profile-instances-crud-widget/PLAN.md`
- `tasks/027-phase-4a-profile-instances-crud-widget/REPORT.md`
- `docs-site/docs/task-story-027-phase-4a-profile-instances-crud-widget.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применимо
- Обратимость: да; откат удалением изменений UI-пакета/demo/docs

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не запускались (backend не затронут)
- E2E / smoke: локальный smoke подготовлен через demo-route; Hub e2e остаётся в задаче `028`

Команды (фактически выполненные):
```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применимо (изменения только в frontend-пакете и документации)
- Rollback: не применялся

## 7) Риски и ограничения
- В текущем API нет server-side list endpoint по `profileId`, поэтому список экземпляров собирается по входному массиву `instanceIds`.
- На больших объёмах потребуется расширение backend-контракта list/search/pagination по профилю (follow-up вне scope этой задачи).
- Хостинг в AprilHub, OIDC/BFF и e2e-маршрутизация остаются в `028` и связанных hub-задачах.

## 8) Что осталось
- [x] Создать коммит(ы) и PR в целевую ветку (`develop`) с test plan и рисками.
- [ ] Проверить сквозной сценарий после встраивания виджета в AprilHub (`028`).
