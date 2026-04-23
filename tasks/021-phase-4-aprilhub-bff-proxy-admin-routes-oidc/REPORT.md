## 1) Итого
- Статус: ✅ выполнено (реализация в `april-worker`)
- Задача: Фаза 4.2 (часть 1) — BFF proxy к Profile, admin routes, один OIDC-клиент
- Ветка: `april-worker: feature/task-023-external-021-profile-proxy`
- Коммиты: `не созданы (рабочая копия)`
- PR: не создавался

## 2) Что сделано
- [backend] В `april-worker/hub-bff` добавлен admin proxy маршрут `/api/v1/admin/profile/*` в upstream AprilProfile.
- [backend] Маршрут защищён существующим Keycloak RBAC (`admin`), дополнительный OIDC-клиент не вводился.
- [backend] Проброс заголовков в upstream: `Authorization`, `X-Correlation-Id`, `X-Request-Id`, tenant заголовки (`X-Tenant-*`).
- [backend/tests] Добавлены unit-тесты на rewrite пути, header passthrough и fallback-поведение при пустом upstream.
- [docs] Обновлены env/OpenAPI/доки в `april-worker`, добавлена task-story страница:
  - `docs-site/docs/task-story-021-phase-4-aprilhub-bff-proxy-admin-routes-oidc.md`
  - `docs-site/docs/task-stories-overview.md`

## 3) Изменённые файлы
- `april-worker/hub-bff/internal/config/config.go`
- `april-worker/hub-bff/cmd/hub-bff/main.go`
- `april-worker/hub-bff/internal/http/profile_proxy.go`
- `april-worker/hub-bff/internal/http/profile_proxy_test.go`
- `april-worker/.env.example`
- `april-worker/openapi/aprilhub-bff.yaml`
- `april-worker/docs-site/docs/getting-started.md`
- `april-worker/docs-site/docs/task-story-021-phase-4-aprilhub-bff-proxy-admin-routes-oidc.md`
- `april-worker/docs-site/docs/task-stories-overview.md`
- `april-worker/tasks/023-aprilhub-execute-external-task-021-april-profile-1/PLAN.md`
- `april-worker/tasks/023-aprilhub-execute-external-task-021-april-profile-1/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применимо
- Обратимость: да; откат удалением proxy-маршрута и env-конфига

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (в контуре `go test ./...` для `hub-bff`)
- E2E / smoke: не запускались

Команды (фактически выполненные в `april-worker`):
```bash
gofmt -w hub-bff/internal/http/profile_proxy.go hub-bff/internal/http/profile_proxy_test.go
cd hub-bff && go test ./...
make openapi-lint
```

## 6) Деплой
- Среда: нет
- Согласовано с: `april-worker/docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применимо
- Rollback: нет

## 7) Риски и ограничения
- Нужен валидный `APRIL_PROFILE_ADMIN_URL` и сетевой доступ Hub -> Profile.
- Полноценный e2e smoke с реальным dev Profile остаётся отдельной проверкой после PR/деплоя.

## 8) Что осталось
- [ ] Создать commits/PR в `april-worker` и приложить ссылки в эту задачу.
- [ ] Выполнить runtime smoke на dev стенде и зафиксировать лог успешного proxy-вызова.
