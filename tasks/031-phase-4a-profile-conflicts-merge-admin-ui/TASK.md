# Задача: Фаза 4a.4 (AprilProfile) — UI потока конфликтов и merge-дубликатов

## Мета
- **ID / ветка:** (например `feat/phase-4a-conflict-queue-widget`)
- **Приоритет:** высокий
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.4**.
- **Связанные подзадачи:** зависит от API конфликтов/merge [`012-phase-2-authority-merge-conflicts`](../012-phase-2-authority-merge-conflicts/) и ABAC ограничений [`013-phase-2-abac-field-filtering`](../013-phase-2-abac-field-filtering/); интеграция в Hub — [`032-phase-4a-hub-conflicts-merge-host-rbac`](../032-phase-4a-hub-conflicts-merge-host-rbac/).
- **Связанные документы:** [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)

## Цель
Реализовать в `@april/profile-ui` админский UI для очереди конфликтов и ручного разрешения/merge-дубликатов, чтобы API-функциональность фазы 2 стала доступна в операционной работе.

## Контекст для агента
- Опора на блок **4a.4** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Реализация только на стороне AprilProfile UI-пакета.

## Входит в объём
- Виджет очереди конфликтов (`ConflictQueueWidget`) с фильтрами и деталями конфликтов.
- Действия resolve conflict и merge duplicates с явным подтверждением.
- Явное отображение аудиторного результата операции (id операции/статус).
- Негативные сценарии прав (`401/403`) и гонок (`409`) в UI.
- Unit/RTL тесты на ключевые кейсы.

## Не входит в объём
- Хостинг в AprilHub и e2e в контуре Hub (это [`032`](../032-phase-4a-hub-conflicts-merge-host-rbac/)).
- Изменение бизнес-правил authority/merge на backend.

## Заглушки и внешние зависимости
- До готовности полного потока в Hub допускается локальная demo-страница.
- Если часть API действий ограничена на стенде, использовать mock-ответы и зафиксировать gap в `REPORT.md`.

## Технические ограничения
- RBAC и ABAC должны уважаться, никаких обходов в клиенте.
- OpenAPI-клиент синхронизировать с актуальной спецификацией.
- Секреты только через env.

## Критерии готовности (acceptance)
- [ ] Очередь конфликтов отображается и фильтруется.
- [ ] Разрешение конфликта и merge дубликатов доступны с корректной обработкой ошибок.
- [ ] Тесты покрывают позитивные и негативные сценарии.

## Проверка (команды)
```bash
make openapi-lint
make docs-build
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## Результат в отчёте
Описание поддержанных операций resolve/merge, UX ошибок прав/конфликтов, список открытых рисков до интеграции в Hub.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-031-phase-4a-profile-conflicts-merge-admin-ui.md`.
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, как оператор видит и решает конфликты данных.
- [ ] Указаны ограничения ролей и почему они важны.
- [ ] В конце страницы есть ссылки на `tasks/031-phase-4a-profile-conflicts-merge-admin-ui/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
