## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4.2 (часть 1, AprilProfile) — контракт «за BFF»: tenant, маршруты, документация для dev
- Ветка: `feature/020-phase-4-profile-contract-bff-docs` (merged -> `develop`)
- Коммиты: `ca3adf5` (feature), `b0da384` (merge commit в `develop`)
- PR: https://github.com/ukituki-ps/april-profile/pull/62

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
- CI после merge в `develop`: **ok** — https://github.com/ukituki-ps/april-profile/actions/runs/24833169716

Команды (фактически выполненные):
```bash
go vet ./...
go test ./...
make openapi-lint
make docs-build
```

## 6) Деплой
- Среда: dev (`develop` pipeline)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: backend image собран успешно (`Backend image (ghcr)` run success) — https://github.com/ukituki-ps/april-profile/actions/runs/24833169710
- Deploy to dev: **ok после rerun** — https://github.com/ukituki-ps/april-profile/actions/runs/24833169697
- Health / readiness: выполнены в рамках успешного `deploy.sh` на dev-runner
- Rollback: не применялся

## 7) Риски и ограничения
- До выполнения задачи 021 в AprilHub реальный BFF-маршрут и OIDC-поток остаются внешней зависимостью.
- Dev smoke использует локальный proxy и предполагает доступный AprilProfile на `127.0.0.1:8080`.
- Инцидент по правам `docs-site/build` на dev-runner закрыт: после исправления owner/permissions повторный запуск `Deploy to dev` завершился успехом.

## 8) Что осталось
- [ ] Выполнить задачу `tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/TASK.md` на стороне AprilHub: реализовать BFF-проксирование и один OIDC-клиент по зафиксированному контракту.
- [ ] Продолжить smoke-проверки BFF-сценария после реализации задачи 021 на стороне Hub.
