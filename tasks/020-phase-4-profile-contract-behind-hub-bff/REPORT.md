## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4.2 (часть 1, AprilProfile) — контракт «за BFF»: tenant, маршруты, документация для dev
- Ветка: `feature/020-phase-4-profile-contract-bff-docs`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [docs] В `docs/FRONTEND_STRATEGY.md` (и синхронно в `docs-site/docs/frontend-strategy.md`) добавлен явный контракт Hub BFF -> Profile: публичный префикс `/admin/profile/api/v1/...`, снятие `/admin/profile` на прокси, trusted headers и правила по tenant.
- [docs] Зафиксировано требование same-origin CORS для режима через BFF; расширение CORS под прямой браузерный вызов вынесено за рамки задачи (только через ADR).
- [openapi] Обновлён `openapi/openapi.yaml`: добавлен server `/admin/profile/api`, уточнено описание прямого dev URL, расширено описание `bearerAuth` про `tenant_id` только из JWT claim.
- [infra / smoke-docs] Добавлен воспроизводимый dev smoke через локальный nginx reverse proxy: `docs/guides/PROFILE_BFF_DEV_SMOKE.md` и конфиг `docs/guides/nginx.profile-bff-smoke.conf`.
- [tasks/docs-site] Добавлены `PLAN.md`, человекопонятная история в `docs-site`, обновлён `task-stories-overview`, обновлён статус в `task_list.md`, чекбоксы acceptance и docs-story в `TASK.md`.

## 3) Изменённые файлы
- `tasks/020-phase-4-profile-contract-behind-hub-bff/PLAN.md`
- `tasks/020-phase-4-profile-contract-behind-hub-bff/REPORT.md`
- `tasks/020-phase-4-profile-contract-behind-hub-bff/TASK.md`
- `openapi/openapi.yaml`
- `docs/FRONTEND_STRATEGY.md`
- `docs-site/docs/frontend-strategy.md`
- `docs/guides/PROFILE_BFF_DEV_SMOKE.md`
- `docs/guides/nginx.profile-bff-smoke.conf`
- `docs-site/docs/task-story-020-phase-4-profile-contract-behind-hub-bff.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert документирующих и OpenAPI-изменений)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (в составе `go test ./...`)
- E2E / smoke: ok (описан и зафиксирован воспроизводимый dev smoke-сценарий через локальный reverse proxy)

Команды (фактически выполненные):
```bash
go vet ./...
go test ./...
make openapi-lint
make docs-build
```

## 6) Деплой
- Среда: нет (задача на контракт/документацию без деплоя)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- До выполнения задачи 021 в AprilHub реальный BFF-маршрут и OIDC-поток остаются внешней зависимостью.
- Dev smoke использует локальный proxy и предполагает доступный AprilProfile на `127.0.0.1:8080`.

## 8) Что осталось
- [ ] Выполнить задачу `tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/TASK.md` на стороне AprilHub: реализовать BFF-проксирование и один OIDC-клиент по зафиксированному контракту.
