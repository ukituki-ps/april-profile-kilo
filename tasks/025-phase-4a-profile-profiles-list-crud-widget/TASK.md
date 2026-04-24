# Задача: Фаза 4a.1 (AprilProfile) — виджет списка профилей и базовый CRUD

## Мета
- **ID / ветка:** (например `feat/phase-4a-profiles-list-widget`)
- **Приоритет:** высокий
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.1**.
- **Связанные подзадачи:** зависит от завершения [`022-phase-4-profile-ui-package-openapi-embed`](../022-phase-4-profile-ui-package-openapi-embed/) и контрактов API фазы 2 (`010`-`013`); для хостинга в Hub продолжение в [`026-phase-4a-hub-profiles-list-host-bff-flow`](../026-phase-4a-hub-profiles-list-host-bff-flow/).
- **Связанные документы:** [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md), [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)

## Цель
Добавить в `@april/profile-ui` виджет списка профилей (`ProfilesListWidget`) с поиском/фильтрами/пагинацией и базовыми CRUD-действиями, чтобы в AprilHub можно было использовать готовый продуктовый блок поверх уже настроенного BFF-контура.

## Контекст для агента
- Опора на фразу "Сначала/Затем" из **4a.1** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Реализация только на стороне AprilProfile (пакет виджета, клиент, тесты, docs).

## Входит в объём
- Реализация `ProfilesListWidget` в пакете `@april/profile-ui` с состояниями `loading/empty/error`.
- Подключение OpenAPI-клиента для list/create/update/delete (или archive при контрактном запрете delete).
- UI-обработка ошибок `401/403/409` без раскрытия внутренних деталей.
- README/пример использования виджета и контракта `props/events`.
- Unit/RTL тесты виджета с MSW.

## Не входит в объём
- Встраивание маршрута и OIDC-обвязки в AprilHub (это [`026`](../026-phase-4a-hub-profiles-list-host-bff-flow/)).
- Расширение доменного API вне текущих контрактов фазы 2.
- Полный Playwright e2e в контуре AprilHub.

## Заглушки и внешние зависимости
- До полной готовности хост-маршрута Hub допустим локальный demo/shell для smoke.
- Если BFF dev-стенд нестабилен, использовать MSW и фикстуры для UI-тестов; ограничение фиксировать в `REPORT.md`.

## Технические ограничения
- Стек: React + TypeScript + Vite + April DS (`@april/tokens`, `@april/ui`).
- RBAC и tenant не обходить на клиенте: источник прав остается Keycloak/BFF.
- OpenAPI синхронизировать с реальным REST-контрактом; не вводить ручные расхождения.
- Секреты и URL окружений только через env.

## Критерии готовности (acceptance)
- [ ] Виджет списка профилей работает в локальном/demo контуре с list + CRUD сценариями.
- [ ] Для неуспешных ответов есть предсказуемое UX-поведение (`401/403/409`).
- [ ] Публичный контракт виджета описан в README пакета.
- [ ] Проверки фронтенда и документации проходят.

## Проверка (команды)
```bash
make openapi-lint
make docs-build
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## Результат в отчёте
Список измененных файлов пакета и demo, подтверждение CRUD-сценариев, известные ограничения перед интеграцией в Hub.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-025-phase-4a-profile-profiles-list-crud-widget.md`.
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, зачем нужен виджет списка профилей и как его проверить.
- [ ] Описаны границы: что сделано в AprilProfile и что остается для AprilHub.
- [ ] В конце страницы есть ссылки на `tasks/025-phase-4a-profile-profiles-list-crud-widget/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
