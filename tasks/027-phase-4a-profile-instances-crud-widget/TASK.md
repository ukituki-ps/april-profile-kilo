# Задача: Фаза 4a.2 (AprilProfile) — виджет списка экземпляров профиля и CRUD экземпляра

## Мета
- **ID / ветка:** (например `feat/phase-4a-profile-instances-widget`)
- **Приоритет:** высокий
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.2**.
- **Связанные подзадачи:** зависит от [`025-phase-4a-profile-profiles-list-crud-widget`](../025-phase-4a-profile-profiles-list-crud-widget/) и API версии/CRUD из фазы 2; для хостинга в Hub продолжение в [`028-phase-4a-hub-instances-host-routing-e2e`](../028-phase-4a-hub-instances-host-routing-e2e/).
- **Связанные документы:** [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)

## Цель
Реализовать в `@april/profile-ui` виджет `ProfileInstancesWidget`, который в контексте `profileId` показывает список экземпляров и поддерживает CRUD экземпляра с корректной обработкой ABAC-ограничений.

## Контекст для агента
- Опора на блок **4a.2** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Задача закрывает только сторону AprilProfile (пакет + тесты + документация).

## Входит в объём
- Реализация списка экземпляров по `profileId` с сортировкой и навигацией к карточке.
- Create/update/delete или archive для экземпляра по контракту API.
- Явное UI-поведение для `hidden/readonly/denied` в ABAC-кейсах.
- Контракт `props/events` и пример использования в README пакета.
- Unit/RTL тесты с MSW для основных и негативных сценариев.

## Не входит в объём
- Роутинг и e2e в AprilHub (это [`028`](../028-phase-4a-hub-instances-host-routing-e2e/)).
- Изменение правил ABAC на backend (это зона фазы 2/отдельных задач).

## Заглушки и внешние зависимости
- До готовности полного Host-потока допустим локальный запуск в demo shell.
- При отсутствии готового ответа внешних систем использовать фиксированные mock-данные в MSW.

## Технические ограничения
- Не обходить RBAC/ABAC на клиенте; источник прав остается в токене/контексте.
- OpenAPI-клиент держать синхронным со спецификацией.
- Секреты и адреса окружений через env.

## Критерии готовности (acceptance)
- [ ] Виджет экземпляров работает в контексте выбранного `profileId`.
- [ ] CRUD и ABAC-сценарии покрыты тестами и документированы.
- [ ] Пакет собирается и готов к встраиванию в Hub.

## Проверка (команды)
```bash
make openapi-lint
make docs-build
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## Результат в отчёте
Описание контрактов виджета и ABAC-поведения, список покрытых сценариев, известные ограничения до хостинга в Hub.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-027-phase-4a-profile-instances-crud-widget.md`.
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, как работать со списком экземпляров и CRUD.
- [ ] Отдельно указано, где поведение ограничивается ABAC.
- [ ] В конце страницы есть ссылки на `tasks/027-phase-4a-profile-instances-crud-widget/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
