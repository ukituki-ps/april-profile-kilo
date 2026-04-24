## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4a.2 (AprilHub) — хостинг виджета экземпляров и e2e через BFF
- Ветка: `develop` (выполнение в `april-worker`)
- Коммиты: не создавались в рамках этой сессии
- PR: не создавался

## 2) Что сделано
- [frontend] В `april-worker/hub-shell` реализован рабочий экран экземпляров на маршруте `/app/profile/instances/:instanceId` вместо заглушки.
- [frontend] Добавлен host-виджет `ProfileInstancesHostWidget` с BFF/OIDC-контекстом (`tenant`, `auth`, `telemetry`) и create-flow через `/api/v1/admin/profile/api/v1/entities`.
- [frontend] Обновлены shell-навигация и breadcrumbs: пункт `Профиль — экземпляры` теперь ведёт в рабочий сценарий.
- [tests] Добавлен Playwright smoke happy-path по задаче 028: логин -> переход в раздел экземпляров -> create экземпляра -> подтверждение host callback.
- [docs] Добавлена история `april-worker/docs-site/docs/task-story-028-phase-4a-hub-instances-host-routing-e2e.md`, обновлён индекс `task-stories-overview.md`.
- [tooling] Стабилизирован smoke-скрипт `april-worker/scripts/run-playwright-aprilhub.sh`:
  - fallback на root user при проблемах прав `node_modules`;
  - подавление шумных `wget connection refused` при ожидании health;
  - поддержка `VITE_PROFILE_INSTANCE_IDS`.

## 3) Изменённые файлы
- `april-worker/hub-shell/src/widgets.tsx`
- `april-worker/hub-shell/src/shell/AuthorizedHubContent.tsx`
- `april-worker/hub-shell/src/shell/ShellBreadcrumbs.tsx`
- `april-worker/hub-shell/src/shell/shell-nav-config.ts`
- `april-worker/hub-shell/tests/e2e/smoke.spec.ts`
- `april-worker/scripts/run-playwright-aprilhub.sh`
- `april-worker/docker-compose.yml`
- `april-worker/.env.example`
- `april-worker/docs/WIDGET_CONTRACTS.md`
- `april-worker/docs-site/docs/task-story-028-phase-4a-hub-instances-host-routing-e2e.md`
- `april-worker/docs-site/docs/task-stories-overview.md`
- `april-worker/tasks/027-aprilhub-execute-external-task-028-april-profile-1/PLAN.md`
- `april-worker/tasks/027-aprilhub-execute-external-task-028-april-profile-1/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применимо
- Обратимость: да (реверт frontend/docs/scripts изменений)

## 5) Проверка качества
- Линтер: ok
- Сборка: не запускалась отдельно
- Unit tests: ok
- Integration tests: не запускались
- E2E / smoke: ok

Команды (фактически выполненные в `april-worker`):
```bash
cd hub-shell && npm run lint && npm run test
DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh
```

## 6) Деплой
- Среда: нет
- Согласовано с: `april-worker/docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: проверка выполнена в smoke-скрипте до запуска Playwright
- Rollback: не применялся

## 7) Риски и ограничения
- Пакетный виджет экземпляров из `april-profile-1` ещё не интегрирован как внешний артефакт в `april-worker`; текущий host-виджет реализован локально для закрытия phase 4a.2.
- Для стабильного локального smoke может потребоваться альтернативный `DOCS_HTTP_PORT` при занятом `8080`.

## 8) Что осталось
- [ ] Создать commit(ы) и PR в `april-worker` по результатам задачи.
