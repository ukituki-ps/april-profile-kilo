# Задача: Фаза 4a.1 (AprilHub) — хостинг виджета списка профилей через BFF/OIDC

## Мета
- **Репозиторий выполнения:** **AprilHub** — [`april-worker`](https://github.com/ukituki-ps/april-worker). Карточка хранится в april-profile для трассировки roadmap.
- **ID / ветка:** (в april-worker)
- **Приоритет:** высокий
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.1**.
- **Связанные подзадачи:** зависит от [`025-phase-4a-profile-profiles-list-crud-widget`](../025-phase-4a-profile-profiles-list-crud-widget/), базового BFF/OIDC контура [`021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`](../021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/) и shell-каркаса [`035-phase-4a-hub-ui-shell-information-architecture`](../035-phase-4a-hub-ui-shell-information-architecture/).
- **Связанные документы:** [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md)

## Цель
Подключить `ProfilesListWidget` в AprilHub на админ-маршруте с корректным проксированием через BFF и tenant/RBAC-контекстом, чтобы сценарий list+CRUD профилей проходил в dev-стенде Hub.

## Контекст для агента
- Опора на блок **4a.1** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Эта задача закрывает только слой Host/BFF/OIDC и smoke в AprilHub.

## Входит в объём
- Подключение зависимости на пакет виджета профилей.
- Хост-маршрут и `HostContext` для виджета в AprilHub.
- Проверка прохождения запросов через BFF (`/admin/profile/...` или согласованный префикс).
- Smoke/e2e happy-path: открыть список профилей, выполнить одну CRUD-операцию.
- Документация запуска сценария в april-worker.

## Не входит в объём
- Разработка самого виджета и его внутренней логики (это [`025`](../025-phase-4a-profile-profiles-list-crud-widget/)).
- Изменение доменного API AprilProfile.

## Заглушки и внешние зависимости
- До публикации пакета допускается временное подключение `file:`/git dependency.
- Ручные контрольные точки: доступы Keycloak, секреты CI e2e, сетевой доступ Hub -> Profile.

## Технические ограничения
- OIDC-клиент и tenant-правила не дублировать и не ослаблять.
- Секреты только через механизмы april-worker.
- Не вносить breaking изменения в контракты без согласования semver.

## Критерии готовности (acceptance)
- [ ] Виджет списка профилей открывается в Hub и работает через BFF.
- [ ] CRUD-сценарий подтвержден smoke/e2e прогоном в dev.
- [ ] Документация в april-worker обновлена (как запустить и какие env нужны).

## Проверка (команды)
```bash
# Выполняется в репозитории april-worker:
# pnpm install
# pnpm lint
# pnpm test
# pnpm exec playwright test (или команда smoke по README april-worker)
```

## Результат в отчёте
Ссылки на PR в april-worker, подтверждение успешного smoke/e2e, список требуемых env и ручных шагов.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md` с пометкой "исполнение в AprilHub".
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, как виджет профилей стал доступен в Hub.
- [ ] Описаны ручные точки: доступы/секреты/стенд.
- [ ] В конце страницы есть ссылки на `tasks/026-phase-4a-hub-profiles-list-host-bff-flow/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
