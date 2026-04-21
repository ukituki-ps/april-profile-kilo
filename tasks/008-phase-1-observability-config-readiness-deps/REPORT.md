## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 1 (часть 5) — структурированные логи, `request_id`, readiness (БД/Redis), конфиг только через env
- Ветка: `feature/phase-1-logs-requestid-readiness`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [backend] Добавлен middleware `X-Request-Id` (проброс входящего или генерация нового) с сохранением в контекст запроса.
- [backend] Добавлено структурированное HTTP-логирование (`method`, `path`, `status`, `duration_ms`, `request_id`, при наличии `tenant_id`).
- [backend] `GET /readyz` переведён на фактические dependency checks: ping PostgreSQL (`pgxpool`) и Redis (`go-redis`) с таймаутом.
- [backend] Добавлена инициализация/закрытие подключений PostgreSQL и Redis в `app.Run`.
- [backend/config] Расширена env-конфигурация: `DATABASE_URL`, `REDIS_ADDR`, `REDIS_PASSWORD`, `REDIS_DB`, `READINESS_TIMEOUT`, `READYZ_ALLOW_WITHOUT_REDIS` с валидацией.
- [infra/docs] Обновлены `docker-compose.yml`, `.env.example`, `openapi/openapi.yaml`, docs-site история задачи и overview.
- [tests] Обновлены/добавлены тесты readiness и валидации env.

## 3) Изменённые файлы
- `internal/httpapi/server.go`
- `internal/httpapi/server_test.go`
- `internal/app/run.go`
- `internal/config/config.go`
- `internal/config/config_test.go`
- `go.mod`
- `go.sum`
- `docker-compose.yml`
- `.env.example`
- `openapi/openapi.yaml`
- `docs-site/docs/task-story-008-observability-config-readiness-deps.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/008-phase-1-observability-config-readiness-deps/PLAN.md`
- `tasks/008-phase-1-observability-config-readiness-deps/REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; откат — revert изменений по задаче 008 (изменений схемы БД нет)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (в составе текущего `go test ./...`)
- E2E / smoke: частично (автотесты и контрактные проверки выполнены; ручной сценарий с отключением БД/Redis описан)

Команды (фактически выполненные):
```bash
go vet ./...
go test ./...
make openapi-lint
make docs-build
```

## 6) Деплой
- Среда: нет (в рамках этой задачи деплой не выполнялся)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: readiness проверяет PostgreSQL и Redis; при недоступности зависимости возвращается `503`
- Rollback: не применялся

## 7) Риски и ограничения
- Если Redis не развернут на dev, нужен явный feature-flag `READYZ_ALLOW_WITHOUT_REDIS=true`; по умолчанию проверка Redis строгая.
- В текущем инкременте не добавлялись метрики `/metrics`; это отдельный follow-up фазы 4.1.

## 8) Что осталось
- [ ] При необходимости dev-deploy: подтвердить ручным smoke, что `/readyz` даёт `503` при остановке Postgres/Redis на стенде.
- [ ] Фаза 1 (6/6): интеграционные тесты с Testcontainers для БД/Redis (задача 009).
