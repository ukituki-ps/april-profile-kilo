## 1) Итого
- Статус: ✅ выполнено
- Задача: подготовка внедрения Sentry в AprilProfile (внешняя постановка `april-worker` task `036`)
- Ветка: `develop` (локальные изменения без отдельной ветки)
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [docs] Создан runbook подготовки Sentry: `docs/runbooks/APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md`.
- [docs] В `.env.example` добавлен шаблон переменных `SENTRY_*` (без секретов).
- [docs] В `docs/OBSERVABILITY.md` добавлен раздел про подготовительный Sentry baseline и ссылка на runbook.
- [tasks] Создана локальная карточка `tasks/036-phase-4b-profile-sentry-rollout-preparation/TASK.md`.
- [docs-site] Добавлена страница задачи и обновлён обзор `task-stories-overview.md`.
- [cross-repo] Подготовлен зеркальный отчёт в `april-worker/tasks/036-aprilprofile-sentry-rollout-preparation/REPORT.md`.

## 3) Изменённые файлы
- `.env.example`
- `docs/OBSERVABILITY.md`
- `docs/runbooks/APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md`
- `docs-site/docs/task-story-036-phase-4b-profile-sentry-rollout-preparation.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/036-phase-4b-profile-sentry-rollout-preparation/TASK.md`
- `tasks/036-phase-4b-profile-sentry-rollout-preparation/REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; откат через revert документационных изменений

## 5) Проверка качества
- Линтер: не применялось (docs-only scope)
- Сборка: ok
- Unit tests: не применялось
- Integration tests: не применялось
- E2E / smoke: не применялось (подготовлен smoke checklist для runtime-задачи)

Команды (фактически выполненные):
```bash
make docs-build
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: описан в runbook для следующего этапа

## 7) Риски и ограничения
- Runtime-интеграция Sentry пока не сделана; остаётся риск отсутствия централизованного capture до выполнения задачи `038` в `april-worker`.
- Финальные sample rates и фильтры могут потребовать корректировки после первых дней наблюдения на стенде.
- Правило по `tenant_id` (в хэшированном виде или без отправки) нужно подтвердить с владельцем политики данных перед включением SDK.

## 8) Что осталось
- [ ] Выполнить runtime-задачу `038` (`april-worker`): подключение SDK в frontend/backend контурах AprilProfile.
- [ ] Прогнать smoke с синтетическими ошибками и проверить цепочку корреляции `Sentry -> logs(requestId/correlationId)`.
- [ ] Зафиксировать PR/коммиты реализации и обновить оба отчёта фактическими ссылками.
