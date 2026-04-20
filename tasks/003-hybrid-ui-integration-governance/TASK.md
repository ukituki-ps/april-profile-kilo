# Задача: Документировать гибридную UI-архитектуру (Host + Widgets + API/BFF-first) и ввести governance-артефакты

## Мета

- **ID:** `003-hybrid-ui-integration-governance`
- **Приоритет:** высокий
- **Тип:** документация/архитектура/guidelines
- **Связанные материалы:**
  - [`tasks/000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md)
  - [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md)
  - [`docs/DESIGN_AprilProfile.md`](../../docs/DESIGN_AprilProfile.md)
  - [`docs/структура сервиса.md`](../../docs/структура%20сервиса.md)
  - ADR по AprilProfile (0002/0003)

## Цель

Обновить документацию под гибридную модель UI-интеграции:

1. `Host-driven` (классический экран в host),
2. `Widget-driven` (`@april/*-ui` переиспользуемые виджеты),
3. `API/BFF-first` (без развитого слоя виджетов),

и создать комплект артефактов, который задает единые правила принятия решений, контракты и процесс изменений, чтобы модель не деградировала в хаос.

## Контекст

В проекте одновременно нужны:
- админские/оркестрационные экраны (часто уникальные),
- часто переиспользуемые пользовательские блоки между микросервисами (Profile/NFlow/OrgFlow/...),
- переходный режим, где часть экранов еще не виджетизирована.

Нужно явно закрепить, когда какой подход выбирать, как передавать контекст host -> widget, как обрабатывать события widget -> host, как управлять версиями и совместимостью.

## Входит в объем

### 1) Обновление стратегических документов
- Обновить [`tasks/000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md):
  - добавить раздел про 3 модели интеграции UI;
  - добавить decision matrix (критерии выбора варианта);
  - добавить фазирование внедрения гибрида.
- Обновить [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md):
  - закрепить HostContext, event contracts, versioning policy;
  - описать принципы composition в AprilHub;
  - описать границы ответственности DS vs domain widgets vs host pages.

### 2) Новый ADR
Создать ADR (следующий номер по порядку), например:
- `docs/adr/000X-hybrid-ui-integration-model.md`

Содержание ADR:
- статус, контекст, решение;
- 3 варианта и причины выбора гибрида;
- последствия (trade-offs, риски);
- migration path;
- rollback/exit strategy.

### 3) Контрактные артефакты (документация)
Добавить отдельный документ (например `docs/WIDGET_CONTRACTS.md`) с:
- **HostContext v1** (минимум: `tenant`, `auth`, `theme`, `locale`, `telemetry/requestId`);
- **Widget Props Contract v1**;
- **Widget Events Contract v1** (`onSaveSuccess`, `onAction`, `onError`, навигационные intent-события);
- правила владения state/nav (host owns navigation; widget emits intent/events).

### 4) Governance-артефакты (anti-chaos)
Добавить:
- `docs/DECISION_MATRIX_UI_INTEGRATION.md`
- `docs/VERSIONING_AND_COMPATIBILITY.md`
- `docs/WIDGET_RELEASE_CHECKLIST.md`
- `docs/WIDGET_INTEGRATION_CHECKLIST.md`
- `docs/WIDGET_OBSERVABILITY_GUIDE.md` (минимальные telemetry/логирование/корреляция)

### 5) Шаблоны для масштабирования
Добавить шаблоны:
- `docs/templates/WIDGET_SPEC_TEMPLATE.md`
- `docs/templates/HOST_INTEGRATION_SPEC_TEMPLATE.md`
- `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`

### 6) Индексация и связность документации
- Обновить `README.md` (или docs index), чтобы новые документы были доступны из одной точки.
- Обновить [`task_list.md`](../../task_list.md) ссылкой на задачу.
- Добавить cross-links между ADR, frontend strategy и контрактами.

## Не входит в объем

- Реализация кода виджетов/SDK/пакетов.
- Публикация npm-пакетов.
- Изменение runtime-инфраструктуры.
- Breaking changes API сервисов.

## Технические требования к содержанию

1. Термины зафиксировать единообразно:
   - Host-driven
   - Widget-driven
   - API/BFF-first

2. Для каждого варианта явно описать:
   - когда применять;
   - anti-patterns;
   - риски;
   - стоимость владения.

3. Обязательные правила:
   - Design System не содержит доменную логику;
   - domain widgets живут в `@april/*-ui`;
   - host владеет маршрутизацией/страничным state;
   - widget сообщает intent/event, но не управляет глобальной навигацией.

4. Версионирование:
   - semver policy;
   - compatibility matrix (Host version x Widget version);
   - правила deprecation и срок поддержки.

5. Качество и эксплуатация:
   - telemetry contract (trace/request correlation);
   - минимальный набор событий для мониторинга;
   - правила error boundary и fallback UI.

## Ожидаемые артефакты (минимальный список файлов)

- `docs/adr/000X-hybrid-ui-integration-model.md`
- `docs/WIDGET_CONTRACTS.md`
- `docs/DECISION_MATRIX_UI_INTEGRATION.md`
- `docs/VERSIONING_AND_COMPATIBILITY.md`
- `docs/WIDGET_RELEASE_CHECKLIST.md`
- `docs/WIDGET_INTEGRATION_CHECKLIST.md`
- `docs/WIDGET_OBSERVABILITY_GUIDE.md`
- `docs/templates/WIDGET_SPEC_TEMPLATE.md`
- `docs/templates/HOST_INTEGRATION_SPEC_TEMPLATE.md`
- `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`
- изменения в `tasks/000-full-service-aprilhub-roadmap/PLAN.md`
- изменения в `docs/FRONTEND_STRATEGY.md`
- изменения в `README.md`/индексе документации
- обновление `task_list.md`

## Критерии готовности (acceptance)

- [x] В документации явно зафиксированы 3 варианта интеграции.
- [x] Есть decision matrix с четкими критериями выбора.
- [x] Есть ADR с обоснованием гибридной модели и последствиями.
- [x] Есть формализованные HostContext/Props/Events contracts v1.
- [x] Есть versioning + compatibility policy.
- [x] Есть release/integration checklists.
- [x] Есть observability guide для виджетов.
- [x] Есть шаблоны спецификаций для новых виджетов и их интеграции.
- [x] Все документы связаны перекрестными ссылками.
- [x] [`task_list.md`](../../task_list.md) обновлен ссылкой на задачу.
- [x] Документация собирается без ошибок (`make docs-build`).

## Проверка

```bash
make docs-build
```

Дополнительно (если есть):
```bash
make docs-lint
```

## Формат отчета агента

В `REPORT.md` по задаче агент должен отразить:
1. список измененных/созданных документов;
2. кратко, какие правила приняты;
3. decision matrix в сжатом виде;
4. открытые вопросы (если остались);
5. что стоит сделать следующим шагом (пилотный widget v1).
