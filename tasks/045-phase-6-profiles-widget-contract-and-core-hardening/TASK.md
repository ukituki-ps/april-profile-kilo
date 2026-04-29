# Задача 045 (фаза 6): hardening контракта `ProfilesWidget` и поведения `ProfilesWidgetCore` до целевого варианта C

## Мета
- **ID / ветка:** `feature/task-045-phase-6-profiles-widget-contract-and-core-hardening`
- **Приоритет:** срочно
- **Связанные документы:** [`task_list.md`](../../task_list.md), [`tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`](../042-phase-6-profiles-widget-production-architecture/TASK.md), [`tasks/043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md`](../043-phase-6-profiles-widget-api-list-contract-and-sdk/TASK.md), [`tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md`](../044-phase-6-profiles-widget-core-api-refactor/TASK.md), [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md), [`frontend/packages/profile-ui/README.md`](../../frontend/packages/profile-ui/README.md)

## Цель
Довести публичный и внутренний контракт `ProfilesWidget` до точного соответствия варианту C и устранить оставшиеся архитектурные расхождения в `ProfilesWidgetCore`: сортировка/инициализация/автовыбор/обработка ошибок/конкурентное обновление должны работать строго по спецификации, без сокращённых или «временных» реализаций.

## Контекст для агента
- 042 и 043 утвердили архитектуру и API-контракт, 044 сделал основной рефактор, но часть требований варианта C реализована неполно.
- Запрещено «закрывать задачу быстро» через локальные упрощения, которые расходятся с контрактом (например, игнор `expectedVersion`, урезанный `onError`, фиксированная сортировка).
- Нужен предсказуемый, контрактно-строгий baseline, который одинаково работает в демо и production.

## Входит в объём
- Контракты пропсов и типов:
  - добавить в `ProfilesWidgetCoreProps`: `initialSort`, `autoSelectFirst`, `onOpenEntity`;
  - добавить `code` в payload `onError`;
  - синхронизировать `ProfilesApiWidgetProps` и `ProfilesWidgetProps` с новым контрактом;
  - зафиксировать типы без «устных» допущений в README/docs.
- Контракт мутаций:
  - расширить `UpdateProfileInput` полем `expectedVersion?: number`;
  - прокинуть `expectedVersion` из `Core` в `provider.update(...)`;
  - корректно отрабатывать conflict-flow (`409`) как optimistic concurrency сценарий.
- Core-поведение:
  - поддержать `initialSort` при list-запросах (а не хардкод `updated_desc`);
  - поддержать `autoSelectFirst` (включаемое поведение, не всегда принудительное);
  - добавить вызов `onOpenEntity(entityId)` в точке пользовательского открытия карточки;
  - унифицировать `onError` payload: `message`, `requestId`, `code`.
- Документация:
  - обновить `docs/WIDGET_CONTRACTS.md`, `docs/widgets/profile/profiles-widget.md`, `frontend/packages/profile-ui/README.md`;
  - отразить изменённые поля и обязательные semantics в явном виде.

## Не входит в объём
- Перепроектирование UI layout, добавление новых кнопок/экранов.
- Изменение backend API-контракта (если требуется API change — отдельный follow-up).
- Большой рефактор провайдера/Abort/observability beyond scope (идёт отдельной задачей 046).

## Технические ограничения
- `ProfilesWidgetCore` не импортирует OpenAPI/generated/env.
- Все сетевые операции только через `ProfilesDataProvider`.
- Запрещён silent fallback, скрывающий несоответствие контракту (например, «если нет версии — обновляем без expectedVersion» без явной политики).
- Ошибки UI только безопасные, но `code` и `requestId` обязаны передаваться в `onError`.
- Нельзя менять public API «по факту реализации»; сначала типы/контракт, затем поведение.

## Требования к дизайн-системе (для frontend-задачи)
- [x] Поведение реализовано в существующем DS-каркасе (`@april/ui` + Mantine) без редизайна.
- [x] Новые состояния (если появятся) выражены через текущие паттерны `Alert/Loader/Button`.
- [x] Нет обходов DS ради «быстрого фиксa».
- [x] Документация и тесты обновлены в соответствии с фактическим DS-поведением.

## Критерии готовности (acceptance)
- [x] `ProfilesWidgetCoreProps`, `ProfilesApiWidgetProps`, `ProfilesWidgetProps` полностью отражают вариант C (`initialSort`, `autoSelectFirst`, `onOpenEntity`, `onError.code`).
- [x] `UpdateProfileInput.expectedVersion` поддержан сквозным потоком `Core -> provider`.
- [x] `409 conflict` обрабатывается как сценарий optimistic concurrency с безопасным UX-сообщением и корректным telemetry/error payload.
- [x] В list-запросах используется `initialSort`/текущая сортировка, а не фиксированный литерал.
- [x] `autoSelectFirst=false` не выбирает запись автоматически.
- [x] `onOpenEntity` вызывается при пользовательском открытии карточки.
- [x] Все релевантные unit/integration тесты обновлены и проходят.
- [x] Документация обновлена и совпадает с кодом.

## Проверка (команды)
```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## Результат в отчёте
Кратко: какие контракты ужесточены, какие несовпадения с вариантом C устранены, какие тесты доказывают отсутствие регрессий и соответствие спецификации.

## Человекопонятная история в docs-site (обязательно)
- [x] Создана/обновлена страница `docs-site/docs/task-story-045-phase-6-profiles-widget-contract-and-core-hardening.md`.
- [x] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и статус.
- [x] Простым языком объяснено, какие «скрытые неполные места» устранены и почему это важно для production.
- [x] В конце страницы даны ссылки на `tasks/045-phase-6-profiles-widget-contract-and-core-hardening/TASK.md`, `PLAN.md`, `REPORT.md`.
