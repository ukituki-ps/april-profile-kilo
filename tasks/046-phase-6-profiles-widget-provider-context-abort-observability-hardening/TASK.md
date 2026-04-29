# Задача 046 (фаза 6): hardening provider-контекста, отмены запросов и observability в `ProfilesWidget`

## Мета
- **ID / ветка:** `feature/task-046-phase-6-profiles-widget-provider-context-abort-observability-hardening`
- **Приоритет:** высокий
- **Связанные документы:** [`task_list.md`](../../task_list.md), [`tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`](../042-phase-6-profiles-widget-production-architecture/TASK.md), [`tasks/045-phase-6-profiles-widget-contract-and-core-hardening/TASK.md`](../045-phase-6-profiles-widget-contract-and-core-hardening/TASK.md), [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md), [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md)

## Цель
Довести транспортный контур варианта C до production-grade: ввести полноценный `ProviderContext`, обеспечить реальную отмену in-flight запросов через `AbortSignal`, устранить риск глобального состояния OpenAPI-клиента, и зафиксировать расширенный набор telemetry-событий/метаданных для list/details/mutations.

## Контекст для агента
- В текущей реализации есть provider abstraction, но контекст и отмена запросов реализованы упрощённо.
- Для устойчивости и трассировки в production необходимо жестко стандартизировать request context и observability.
- Задача выполняется после 045, чтобы не смешивать контракты и transport-hardening в одном change set.

## Входит в объём
- Контракт `ProviderContext` (вариант C):
  - `tenantId`;
  - `auth.accessToken/subject/roles`;
  - `telemetry.requestId/correlationId`;
  - `signal?: AbortSignal`.
- Wiring context:
  - корректное формирование `ProviderContext` в `ProfilesApiWidget`;
  - передача context во все provider-операции.
- Реальная отмена запросов:
  - `AbortController` для list при смене query/filter/sort;
  - `AbortController` для details при смене selection;
  - корректная очистка контроллеров при unmount/re-run.
- `openapiProfilesProvider` hardening:
  - устранить небезопасное глобальное состояние (race на `OpenAPI.BASE/TOKEN`);
  - обеспечить изоляцию конфигурации запроса;
  - прокинуть `signal` в HTTP-вызовы generated клиента (или явно зафиксировать техническое ограничение и безопасный workaround, если генератор не поддерживает напрямую).
- Observability hardening:
  - добавить события `list_requested/list_succeeded/list_failed`, `details_requested/details_failed`;
  - включить метаданные: `operation`, `entity_id`, `row_count`, `has_next_cursor`, `latency_ms`, `error_code`, `phase`;
  - сохранить backward compatibility текущих `view_loaded/save_*`.

## Не входит в объём
- Добавление новых бизнес-операций в UI.
- Рефактор внешних виджетов (`EntityProfileWidget`, `ProfileInstancesWidget` и т.д.), кроме общих переиспользуемых утилит при явной необходимости.
- Полный cross-service observability rollout в hub/infra.

## Технические ограничения
- Никакой transport/env/auth-логики внутри `ProfilesWidgetCore`.
- Нельзя оставлять «fake abort» (только игнор stale response без отмены транспорта) как единственный механизм.
- Нельзя использовать глобально изменяемый OpenAPI runtime как источник гонок между виджетами.
- Все новые telemetry поля должны быть документированы и покрыты тестами.

## Требования к дизайн-системе (для frontend-задачи)
- [x] UX loading/error states после внедрения abort остаются в текущей DS-модели.
- [x] Никаких новых визуальных паттернов без обоснования.
- [x] Тексты ошибок и retry-стейты консистентны с существующими компонентами.
- [x] Документация поведения пользователя обновлена.

## Критерии готовности (acceptance)
- [x] `ProviderContext` реализован в полном составе и используется всеми provider-методами.
- [x] list/details запросы реально отменяются при смене состояния и unmount.
- [x] Отсутствуют гонки из-за глобального OpenAPI-конфига в сценарии нескольких виджетов.
- [x] Расширенные observability-события и мета эмитятся в нужных точках.
- [x] Unit/integration тесты подтверждают abort/race/telemetry behavior.
- [x] Документация контракта и observability актуализирована.

## Проверка (команды)
```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## Результат в отчёте
Кратко: как реализован новый context, как обеспечена отмена запросов, как устранены race-condition риски, какие telemetry-события/мета добавлены, чем подтверждено тестами.

## Человекопонятная история в docs-site (обязательно)
- [x] Создана/обновлена страница `docs-site/docs/task-story-046-phase-6-profiles-widget-provider-context-abort-observability-hardening.md`.
- [x] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и статус.
- [x] Простым языком объяснено, почему «настоящая отмена запросов и контекст» критичны для production.
- [x] В конце страницы даны ссылки на `tasks/046-phase-6-profiles-widget-provider-context-abort-observability-hardening/TASK.md`, `PLAN.md`, `REPORT.md`.
