# Задача: Фаза 4a.4 (AprilHub) — хостинг конфликтного UI и RBAC/e2e проверки

## Мета
- **Репозиторий выполнения:** **AprilHub** — [`april-worker`](https://github.com/ukituki-ps/april-worker).
- **ID / ветка:** (в april-worker)
- **Приоритет:** высокий
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.4**.
- **Связанные подзадачи:** зависит от [`031-phase-4a-profile-conflicts-merge-admin-ui`](../031-phase-4a-profile-conflicts-merge-admin-ui/), OIDC/BFF базы [`021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`](../021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/) и shell-каркаса [`035-phase-4a-hub-ui-shell-information-architecture`](../035-phase-4a-hub-ui-shell-information-architecture/).
- **Связанные документы:** [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)

## Цель
Встроить конфликтный админский UI в AprilHub, проверить RBAC-ограничения и e2e сценарии разрешения конфликтов/merge-дубликатов в dev-контуре через BFF.

## Контекст для агента
- Опора на блок **4a.4** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Реализация ведется в април-worker; задача в этом репозитории отражает интеграционную часть.

## Входит в объём
- Хост-маршрут для конфликтного UI и подключение `HostContext`.
- Проверка RBAC: доступ админа и запрет для нерелевантных ролей.
- e2e/smoke: просмотр очереди конфликтов, одно разрешение или merge-действие.
- Документация запуска и предпосылок в april-worker.

## Не входит в объём
- Разработка внутреннего UI виджета (это [`031`](../031-phase-4a-profile-conflicts-merge-admin-ui/)).
- Изменения backend-логики merge/conflict.

## Заглушки и внешние зависимости
- Если стенд не содержит реальных конфликтов, допускается контролируемая тестовая фикстура/сид.
- Ручные контрольные точки: роли в Keycloak, секреты CI и учетные данные e2e.

## Технические ограничения
- Не ослаблять модели ролей и tenant-изоляцию.
- Секреты/доступы хранить только средствами april-worker.
- Не добавлять отдельные IAM-обходы на уровне UI.

## Критерии готовности (acceptance)
- [ ] Конфликтный UI доступен в Hub под корректной ролью.
- [ ] Проверены позитивный и негативный RBAC-кейсы.
- [ ] E2E/smoke сценарий разрешения конфликта стабилен.

## Проверка (команды)
```bash
# Выполняется в репозитории april-worker:
# pnpm lint
# pnpm test
# pnpm exec playwright test (сценарий conflicts/merge)
```

## Результат в отчёте
Ссылки на PR, результаты RBAC/e2e проверок, какие ручные настройки ролей требуются.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-032-phase-4a-hub-conflicts-merge-host-rbac.md` с пометкой "исполнение в AprilHub".
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, как в Hub проходит разрешение конфликтов.
- [ ] Отдельно описаны роли и риски при неправильной настройке доступа.
- [ ] В конце страницы есть ссылки на `tasks/032-phase-4a-hub-conflicts-merge-host-rbac/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
