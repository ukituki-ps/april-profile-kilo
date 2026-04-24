# Задача: Фаза 4a.2 (AprilHub) — хостинг виджета экземпляров и e2e через BFF

## Мета
- **Репозиторий выполнения:** **AprilHub** — [`april-worker`](https://github.com/ukituki-ps/april-worker).
- **ID / ветка:** (в april-worker)
- **Приоритет:** высокий
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.2**.
- **Связанные подзадачи:** зависит от [`027-phase-4a-profile-instances-crud-widget`](../027-phase-4a-profile-instances-crud-widget/), стабильного BFF-контура [`021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`](../021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/) и shell-каркаса [`035-phase-4a-hub-ui-shell-information-architecture`](../035-phase-4a-hub-ui-shell-information-architecture/).
- **Связанные документы:** [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md)

## Цель
Встроить в AprilHub виджет списка экземпляров профиля и обеспечить e2e/smoke сценарий по CRUD экземпляра через BFF с корректной передачей tenant/OIDC-контекста.

## Контекст для агента
- Опора на блок **4a.2** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Работы выполняются в april-worker; в этом репозитории фиксируется постановка и отчёт.

## Входит в объём
- Подключение виджета экземпляров к маршруту Hub в контексте конкретного профиля.
- Проверка BFF-маршрутизации для endpoints экземпляров.
- e2e/smoke happy-path: открыть профиль, увидеть экземпляры, выполнить одну CRUD-операцию.
- Фиксация инструкций запуска теста в април-worker docs.

## Не входит в объём
- Разработка логики виджета экземпляров (это [`027`](../027-phase-4a-profile-instances-crud-widget/)).
- Изменение API контрактов AprilProfile.

## Заглушки и внешние зависимости
- До публикации артефакта допустимо временное подключение зависимости (`file:`/git dependency).
- Ручные контрольные точки: тестовый пользователь, доступ к dev-стенду, секреты CI.

## Технические ограничения
- Использовать существующий OIDC/BFF контур, не вводить альтернативные источники tenant.
- Секреты не коммитить; хранить по правилам april-worker.
- Не ломать существующие хост-маршруты Hub.

## Критерии готовности (acceptance)
- [ ] Сценарий экземпляров работает в dev Hub через BFF.
- [ ] Есть стабильный e2e/smoke на ключевой путь экземпляров.
- [ ] В документации april-worker описаны запуск и ограничения.

## Проверка (команды)
```bash
# Выполняется в репозитории april-worker:
# pnpm lint
# pnpm test
# pnpm exec playwright test (таргетный e2e по маршруту экземпляров)
```

## Результат в отчёте
Ссылки на PR, доказательство прохождения e2e/smoke, список ручных предпосылок для прогона.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-028-phase-4a-hub-instances-host-routing-e2e.md` с пометкой "исполнение в AprilHub".
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, как сценарий экземпляров работает в Hub.
- [ ] Описаны ручные шаги и что делать при недоступности стенда.
- [ ] В конце страницы есть ссылки на `tasks/028-phase-4a-hub-instances-host-routing-e2e/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
