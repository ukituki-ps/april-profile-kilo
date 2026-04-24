# Задача: Фаза 4a.3 (AprilProfile) — виджет истории экземпляра (версии + diff)

## Мета
- **ID / ветка:** (например `feat/phase-4a-instance-history-widget`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.3**.
- **Связанные подзадачи:** зависит от [`027-phase-4a-profile-instances-crud-widget`](../027-phase-4a-profile-instances-crud-widget/) и контрактов версионирования из [`011-phase-2-entity-crud-versioning`](../011-phase-2-entity-crud-versioning/); интеграция в Hub — [`030-phase-4a-hub-instance-history-host-e2e`](../030-phase-4a-hub-instance-history-host-e2e/).
- **Связанные документы:** [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)

## Цель
Добавить `InstanceHistoryWidget` в `@april/profile-ui`: таймлайн append-only версий экземпляра, просмотр выбранной версии и diff с текущей/предыдущей для прозрачного аудита изменений.

## Контекст для агента
- Опора на блок **4a.3** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Реализация выполняется в пределах AprilProfile UI-пакета.

## Входит в объём
- Таймлайн версий с ключевыми метаданными (кто/когда/источник).
- Просмотр снапшота версии и diff (с текущей или предыдущей).
- Если контракт API допускает restore, добавить явный защищенный UI-сценарий.
- Unit/RTL тесты для таймлайна и diff-представления.
- Документация контракта виджета.

## Не входит в объём
- Реализация хост-роутинга и e2e в AprilHub (это [`030`](../030-phase-4a-hub-instance-history-host-e2e/)).
- Изменение правил версионирования backend.

## Заглушки и внешние зависимости
- При отсутствии restore endpoint в контракте ограничиться read-only историей и зафиксировать это в отчете.
- Для локальных тестов использовать MSW-фикстуры исторических версий.

## Технические ограничения
- Не нарушать append-only модель данных.
- OpenAPI клиент и UI-контракты должны оставаться синхронными.
- Секреты через env, без hardcode токенов/URL.

## Критерии готовности (acceptance)
- [ ] История версий отображается корректно и предсказуемо.
- [ ] Просмотр версии и diff покрыты тестами.
- [ ] Ограничения (если restore недоступен) явно описаны в docs/REPORT.

## Проверка (команды)
```bash
make openapi-lint
make docs-build
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## Результат в отчёте
Какие сценарии истории реализованы, какие ограничения контракта действуют, какие follow-up нужны на стороне Hub.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-029-phase-4a-profile-instance-history-widget.md`.
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком объяснено, как смотреть историю изменений экземпляра.
- [ ] Отдельно указано, есть ли restore и при каких условиях.
- [ ] В конце страницы есть ссылки на `tasks/029-phase-4a-profile-instance-history-widget/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
