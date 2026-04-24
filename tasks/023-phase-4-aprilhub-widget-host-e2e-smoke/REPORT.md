## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4.2 (завершение интеграции, AprilHub) — хостинг виджета и e2e smoke
- Репозиторий реализации: `april-worker` (`develop`)
- Основные PR (merged): [#40](https://github.com/ukituki-ps/april-worker/pull/40), [#41](https://github.com/ukituki-ps/april-worker/pull/41), [#42](https://github.com/ukituki-ps/april-worker/pull/42), [#43](https://github.com/ukituki-ps/april-worker/pull/43), [#44](https://github.com/ukituki-ps/april-worker/pull/44)

## 2) Что сделано
- В `april-worker/hub-shell` добавлен host-driven модуль `Профиль (виджет)` в composition layer.
- Реализован совместимый контракт `hostContext` и callback `onSaveSuccess` для сценария сохранения профиля через BFF proxy путь `/api/v1/admin/profile/api/v1/entities/...`.
- Добавлен e2e smoke-кейс в `april-worker/hub-shell/tests/e2e/smoke.spec.ts` (happy-path: login -> widget -> save -> `onSaveSuccess`) и обновлены stubs под реальный proxy path.
- Добавлена UX-обработка ошибок API и сценарий auto-create: при `PUT` -> `404` + `entity_not_found` выполняется `POST /v1/entities` с последующим retry `PUT` (PR #43).
- Добавлен deploy hardening на стороне `april-worker`: auto-recreate `hub-bff` при изменениях в `hub-bff/` и repair прав для `hub-shell` bind-mount, чтобы не допускать runtime-деградации (`404` stale BFF / `EACCES` Vite) на dev (PR #44).
- Добавлены docs в `april-worker/docs-site/docs`: task story `023`, обновления `task-stories-overview` и `getting-started`.

## 3) Изменённые файлы (в repo `april-worker`)
- `hub-shell/src/profile-widget.tsx`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/composition-registry.ts`
- `hub-shell/src/App.tsx`
- `hub-shell/tests/e2e/smoke.spec.ts`
- `docs-site/docs/task-story-023-phase-4-aprilhub-widget-host-e2e-smoke.md`
- `docs-site/docs/task-stories-overview.md`
- `docs-site/docs/getting-started.md`
- `tasks/024-aprilhub-execute-external-task-023-april-profile-1/PLAN.md`
- `tasks/024-aprilhub-execute-external-task-023-april-profile-1/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применимо
- Обратимость: да

## 5) Проверка качества
- Линтер: ok (`cd april-worker/hub-shell && npm run lint`)
- Unit tests: ok (`cd april-worker/hub-shell && npm run test`)
- Build: ok в CI (локально ранее воспроизводился `EACCES`, устранено через стабилизацию deploy/runtime процесса)
- E2E smoke: ok в CI

Команды (фактически выполненные в `april-worker`):
```bash
cd hub-shell && npm run lint && npm run test
cd hub-shell && npm run lint && npm run test && npm run build
./scripts/run-playwright-aprilhub.sh
```

## 6) Деплой
- Среда: `develop` (`april-worker`)
- CI/Deploy после merge:
  - PR #40/#41/#42: `CI` и `Deploy to dev` — success
  - PR #43: `CI` и `Deploy to dev` — success
  - PR #44: `CI` и `Deploy to dev` — success
- Образы/rollback: управляются стандартным pipeline `april-worker` (`deploy.sh`)

## 7) Риски и ограничения
- До подключения опубликованного `@april/profile-ui` package используется локальная реализация с совместимым контрактом.
- Для корректного auto-create на dev требуется заданный и опубликованный `entity_type_id` (`VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID`) на стороне `hub-shell` окружения.

## 8) Что осталось
- [x] Повторный build и e2e smoke после исправления окружения.
- [x] Коммиты/PR в `april-worker` и ссылки на них в этом отчёте.
