# Задача: Фаза 4a.3 (AprilHub) — хостинг истории экземпляра и e2e smoke

## Мета
- **Репозиторий выполнения:** **AprilHub** — [`april-worker`](https://github.com/ukituki-ps/april-worker).
- **ID / ветка:** (в april-worker)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.3**.
- **Связанные подзадачи:** зависит от [`029-phase-4a-profile-instance-history-widget`](../029-phase-4a-profile-instance-history-widget/), базового хостинга виджетов [`023-phase-4-aprilhub-widget-host-e2e-smoke`](../023-phase-4-aprilhub-widget-host-e2e-smoke/) и shell-каркаса [`035-phase-4a-hub-ui-shell-information-architecture`](../035-phase-4a-hub-ui-shell-information-architecture/).
- **Связанные документы:** [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md)

## Цель
Подключить виджет истории экземпляра в AprilHub и подтвердить e2e/smoke сценарий "изменение данных -> новая версия -> просмотр истории" через BFF-контур.

## Контекст для агента
- Опора на блок **4a.3** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Исполнение в april-worker, в этом репозитории ведется трассировка задачи.

## Входит в объём
- Роутинг/хостинг `InstanceHistoryWidget` в админском сценарии Hub.
- Проверка прохождения запросов истории через BFF.
- e2e/smoke сценарий просмотра таймлайна версии и diff.
- Обновление инструкции запуска теста в документации april-worker.

## Не входит в объём
- Изменение внутренней логики виджета истории (это [`029`](../029-phase-4a-profile-instance-history-widget/)).
- Расширение backend API истории вне текущих контрактов.

## Заглушки и внешние зависимости
- Если сценарий restore еще не доступен контрактно, e2e ограничить read-only историей.
- Ручные контрольные точки: рабочий dev-стенд, тестовые учетные данные, доступ к CI секретам.

## Технические ограничения
- Не обходить существующие OIDC и tenant правила.
- Секреты и доступы только по процессу april-worker.

## Критерии готовности (acceptance)
- [ ] Виджет истории доступен в Hub и корректно получает данные через BFF.
- [ ] e2e/smoke покрывает ключевой путь истории.
- [ ] Ограничения по restore (если есть) зафиксированы в документации и отчете.

## Проверка (команды)
```bash
# Выполняется в репозитории april-worker:
# pnpm lint
# pnpm test
# pnpm exec playwright test (сценарий истории экземпляра)
```

## Результат в отчёте
Ссылка на PR в april-worker, результат прогона e2e/smoke, список ручных условий.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-030-phase-4a-hub-instance-history-host-e2e.md` с пометкой "исполнение в AprilHub".
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, как история версий стала доступна в Hub.
- [ ] Отдельно указаны ограничения и ручные условия запуска.
- [ ] В конце страницы есть ссылки на `tasks/030-phase-4a-hub-instance-history-host-e2e/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
