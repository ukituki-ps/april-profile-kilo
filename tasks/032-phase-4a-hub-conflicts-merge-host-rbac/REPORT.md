## 1) Итого

- Статус: выполнено (интеграция AprilHub в `april-worker`; постановка 032 закрыта по Hub-части).
- Исполнительный репозиторий: https://github.com/ukituki-ps/april-worker
- Задача-зеркало в worker: `tasks/029-aprilhub-execute-external-task-032-april-profile-1/`
- Ветка / PR: см. `tasks/029-aprilhub-execute-external-task-032-april-profile-1/REPORT.md` в `april-worker` (после push).

## 2) Что сделано по чеклисту TASK.md (032)

- [x] Хост-маршрут для конфликтного UI и подключение контекста host (`HubHostContextProvider`, навигация `goToProfileConflicts`).
- [x] RBAC: доступ при роли `admin` в Hub JWT; запрет в shell для пользователей без `admin`; на BFF по-прежнему `RequireAnyRole("admin")` на `/api/v1/admin/profile/*`.
- [x] e2e/smoke: просмотр очереди (stub), одно разрешение конфликта и merge-действие (stubs); негативный кейс с учётной `april-user`.
- [x] Документация запуска: `april-worker/docs-site/docs/getting-started.md`, `docs/WIDGET_CONTRACTS.md`, страница истории в `docs-site` (оба репо).

## 3) Ручные настройки Keycloak

- В `april-worker/infra/keycloak/realm/april-realm.json`: роль `admin` добавлена пользователю `april-dev`; создан `april-user` / `april-user-pass` с ролью только `user` для негативного smoke.
- Для сквозного вызова реального AprilProfile admin API убедиться, что JWT содержит ожидаемую realm-роль из `KEYCLOAK_ADMIN_REALM_ROLE` на стороне Profile (см. риски в task-story-032).

## 4) Риски и follow-up

- Расхождение ролей Hub (`admin`) и Profile (`april-profile-admin` по умолчанию) — настроить composite role или mapper в Keycloak.
- Полная замена host-заглушки на встраивание npm-пакета `ConflictQueueWidget` — отдельный инкремент после стабилизации версии пакета и ленивой загрузки в shell.

## 5) Дублирование отчёта

- Этот файл (`april-profile-1/tasks/032-phase-4a-hub-conflicts-merge-host-rbac/REPORT.md`).
- `april-worker/tasks/029-aprilhub-execute-external-task-032-april-profile-1/REPORT.md`.
