## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4.2 (часть 2, AprilProfile) — пакет UI, клиент из OpenAPI, встраиваемый компонент и `onSaveSuccess`
- Ветка: `feature/022-profile-ui-package-openapi-embed` -> `develop`
- Коммиты: `e4ec44f` (feature), `dfd557b` (merge commit в `develop`)
- PR: https://github.com/ukituki-ps/april-profile/pull/64 (merged)

## 2) Что сделано
- [frontend] Добавлен workspace-пакет `frontend/packages/profile-ui` (`@april/profile-ui`) с semver, публичными экспортами и сборкой в `dist`.
- [frontend] Реализован `EntityProfileWidget`: загрузка профиля (`GET /v1/entities/{entityID}`), сохранение (`PUT /v1/entities/{entityID}`), обработка ошибок, callback `onSaveSuccess`.
- [frontend] Подключена генерация OpenAPI-клиента (`openapi-typescript-codegen`) из `openapi/openapi.yaml` в `src/generated`.
- [frontend/tests] Добавлены Vitest/RTL + MSW тесты на сценарий успешного сохранения и валидацию JSON-документа.
- [frontend/shell] Обновлён `frontend/src/App.tsx`: demo-роут `/profile-widget-demo` с использованием `@april/profile-ui` и отображением результата `onSaveSuccess`.
- [docs] Добавлены `frontend/packages/profile-ui/README.md`, story в docs-site и обновлён обзор task stories.

## 3) Изменённые файлы
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/tsconfig.json`
- `frontend/vite.config.ts`
- `frontend/src/App.tsx`
- `frontend/src/vite-env.d.ts`
- `frontend/src/test/setup.ts`
- `frontend/README.md`
- `frontend/packages/profile-ui/package.json`
- `frontend/packages/profile-ui/tsconfig.json`
- `frontend/packages/profile-ui/tsconfig.build.json`
- `frontend/packages/profile-ui/vitest.config.ts`
- `frontend/packages/profile-ui/README.md`
- `frontend/packages/profile-ui/src/index.ts`
- `frontend/packages/profile-ui/src/types.ts`
- `frontend/packages/profile-ui/src/components/EntityProfileWidget.tsx`
- `frontend/packages/profile-ui/src/components/EntityProfileWidget.test.tsx`
- `frontend/packages/profile-ui/src/test/setup.ts`
- `frontend/packages/profile-ui/src/generated/*` (сгенерированный OpenAPI-клиент)
- `tasks/022-phase-4-profile-ui-package-openapi-embed/PLAN.md`
- `tasks/022-phase-4-profile-ui-package-openapi-embed/REPORT.md`
- `docs-site/docs/task-story-022-phase-4-profile-ui-package-openapi-embed.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применимо
- Обратимость: да; откат удалением пакета и rollback изменений `frontend/*`/docs

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не запускались (не затронут backend)
- E2E / smoke: частичный dev smoke выполнен (см. §6), host-driven e2e остаётся в задаче 023
- CI: `CI` / `bootstrap-ci` / `Backend image (ghcr)` / `Deploy to dev` для `dfd557b` — `success`

Команды (фактически выполненные):
```bash
cd frontend && npm install
cd frontend && npm run generate:api -w @april/profile-ui
cd frontend && npm run lint && npm run test && npm run build
cd frontend && npm run test -w @april/profile-ui
make openapi-lint
make docs-build
```

## 6) Деплой
- Среда: dev (`dev.profile.april.ukituki.tech`, `dev.april.ukituki.tech`)
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: применены через workflow `Deploy to dev` (run `24837016745`, SHA `dfd557b2ce52ce2f259373a60c3a96ff8c9b222a`)
- Health / readiness:
  - `https://dev.profile.april.ukituki.tech/healthz` -> `{"status":"ok"}`
  - `https://dev.profile.april.ukituki.tech/readyz` -> `{"database":"ok","redis":"ok","status":"ready"}`
  - `https://dev.profile.april.ukituki.tech/api/v1/system/ping` -> `{"status":"ok"}`
  - `https://dev.april.ukituki.tech/healthz` -> `{"status":"ok"}`
  - `https://dev.april.ukituki.tech/readyz` -> `{"status":"ready","timestamp":"..."}`
  - `https://dev.april.ukituki.tech/profile-widget-demo` -> `HTTP 200` (SPA index.html загружается)
- Доп. наблюдения smoke:
  - `https://dev.profile.april.ukituki.tech/admin/profile/api/v1/system/ping` -> `502` (profile-host без hub BFF слоя).
  - `https://dev.april.ukituki.tech/api/v1/admin/profile/v1/system/ping` -> `404` (маршрут требует уточнения конфигурации Hub BFF для follow-up 023).
- Rollback: не применялся

## 7) Риски и ограничения
- Экспорт `src/generated/index.ts` поддерживается вручную; после смены генератора/контрактов нужен контроль diff.
- В `frontend` build остаётся warning про размер бандла Vite (`>500kB`), функционально не блокирует задачу.
- Полное host-интеграционное и e2e покрытие остаётся в рамках задачи 023 (AprilHub).
- Проверка BFF proxy endpoint на `dev.april` показала `404` для пути `api/v1/admin/profile/v1/*`; нужно синхронизировать smoke URL со свежей конфигурацией Hub BFF в задаче 023.

## 8) Что осталось
- [x] Создать git commit(ы), PR, дождаться CI, выполнить merge в `develop`.
- [ ] Подтвердить сквозной host-driven BFF сценарий (корректный proxy URL + авторизованный `whoami`) и e2e smoke в задаче 023.
