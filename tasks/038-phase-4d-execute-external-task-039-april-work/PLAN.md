# План: исполнение внешней task 039 (error telemetry architecture/docs)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-28
- **Статус плана:** согласован

## Исходные допущения

- Внешняя `task 39` находится в `april-worker/tasks/039-aprilprofile-observability-error-telemetry-architecture-docs/`.
- Scope задачи — документация и архитектурная фиксация, без дополнительной runtime-реализации.
- Текущее внедрение Sentry из предыдущей задачи уже присутствует в кодовой базе и используется как контекст.

## Порядок работ (шаги)

1. Изучить постановку `task 39` и релевантные документы в `april-worker` и `april-profile-1`.
2. Подготовить в `april-profile-1` архитектурный документ по error telemetry с обязательными полями корреляции.
3. Обновить runbook triage в `april-profile-1` с цепочкой `Sentry -> Loki/Grafana -> root cause`.
4. Синхронизировать индексные/контекстные документы `april-profile-1` и task tracking.
5. Оформить дублирующий `REPORT.md` в `april-worker/tasks/039...`.
6. Обновить зеркальный отчёт в `april-profile-1/tasks/038.../REPORT.md`.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Нет runtime-изменений |
| Frontend | Нет runtime-изменений |
| БД / Atlas | Не применяется |
| Инфра / Compose | Не применяется |
| Документация / OpenAPI | Архитектурная модель error telemetry, runbook triage, task reports |

## Риски и откат

- **Риск:** несогласованность полей корреляции между AprilHub и AprilProfile → **Митигация:** фиксированный список полей в архитектурном документе.
- **Риск:** пересечение scope с runtime-задачами `038` → **Митигация:** явно зафиксировать out-of-scope.
- При необходимости отката: revert только markdown-изменений в docs/tasks.

## Проверка после выполнения

- Команды:
  - `make docs-build`
- Ручная проверка:
  - ссылки на новые документы валидны;
  - оба отчёта (`april-worker` и `april-profile-1`) содержат кросс-ссылки и перечень проверок.

## Примечания

- Связанная внешняя постановка: `april-worker/tasks/039-aprilprofile-observability-error-telemetry-architecture-docs/TASK.md`.
- Обновления плана: 2026-04-28 — первичная версия.
