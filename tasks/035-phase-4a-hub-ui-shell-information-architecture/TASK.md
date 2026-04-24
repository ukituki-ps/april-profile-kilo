# Задача: Фаза 4a.0 (AprilHub) — UI shell-каркас, IA и навигационный контракт для виджетов

## Мета
- **Репозиторий выполнения:** **AprilHub** — [`april-worker`](https://github.com/ukituki-ps/april-worker). Карточка хранится в april-profile для трассировки roadmap.
- **ID / ветка:** (в april-worker)
- **Приоритет:** высокий
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.0**.
- **Связанные подзадачи:** выполняется после базового хостинга [`023-phase-4-aprilhub-widget-host-e2e-smoke`](../023-phase-4-aprilhub-widget-host-e2e-smoke/) и перед продуктовыми host-задачами [`026`](../026-phase-4a-hub-profiles-list-host-bff-flow/), [`028`](../028-phase-4a-hub-instances-host-routing-e2e/), [`030`](../030-phase-4a-hub-instance-history-host-e2e/), [`032`](../032-phase-4a-hub-conflicts-merge-host-rbac/), [`034`](../034-phase-4a-hub-widget-release-gates-smoke/).
- **Связанные документы:** [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md), [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/WIDGET_INTEGRATION_CHECKLIST.md`](../../docs/WIDGET_INTEGRATION_CHECKLIST.md)

## Цель
Подготовить в AprilHub единый UI shell-каркас (информационная архитектура, sidebar/tabs/route-контракты и host-layout), чтобы все виджеты фазы 4a подключались по одному паттерну и не расходились по UX и навигации.

## Контекст для агента
- В `4a.1`-`4a.5` уже есть задачи на реализацию и хостинг отдельных виджетов, но нет выделенного шага на общий каркас Hub.
- Без общего shell-контракта интеграции виджетов могут дублировать навигацию, по-разному передавать контекст и ломать deep-link сценарии.

## Входит в объём
- Зафиксировать IA-слой AprilHub для profile-доменa:
  - структура sidebar (разделы, уровни вложенности, условия видимости по ролям);
  - политика использования tab vs отдельный route;
  - канонические URL и параметры (`profileId`, `instanceId`, дополнительные фильтры).
- Описать и реализовать минимальный host-shell контракт:
  - единый `HostContext` для виджетов (tenant/auth/navigation/correlation/hooks);
  - единые wrapper-состояния `loading/empty/error/forbidden`;
  - паттерны header/actions/breadcrumbs/back-navigation.
- Зафиксировать UX-правила для опасных действий и уведомлений (confirm, success/failure toast).
- Подготовить dev smoke-сценарий shell-уровня (переходы sidebar -> tabs -> виджетный слот, deep-link).
- Обновить документацию april-worker по новому shell-каркасу и правилам подключения виджетов.

## Не входит в объём
- Разработка внутренней бизнес-логики самих виджетов (`ProfilesListWidget`, `ProfileInstancesWidget`, и т.д.).
- Изменение API-контрактов AprilProfile.
- Полное покрытие всех продуктовых e2e кейсов (это в `026/028/030/032/034`).

## Заглушки и внешние зависимости
- До готовности всех виджетов допустим shell smoke на одной-двух интегрированных точках, остальные секции — через заглушки/placeholder.
- Ручные контрольные точки: доступы Keycloak, согласование IA с владельцами AprilHub, доступность dev-стенда.

## Технические ограничения
- Не ослаблять существующие OIDC/RBAC и tenant-изоляцию.
- Не вводить параллельный маршрутный контур в обход действующего BFF.
- Любые breaking-изменения shell-контракта фиксировать в release notes и semver-политике Host.

## Критерии готовности (acceptance)
- [ ] В AprilHub есть зафиксированный и реализованный базовый shell-каркас для profile-домена (sidebar/tabs/routes/layout).
- [ ] Контракт `HostContext` и правила встраивания виджетов документированы и применимы к задачам `026/028/030/032`.
- [ ] Deep-link и back-navigation сценарии подтверждены smoke-прогоном в dev.
- [ ] Документация april-worker обновлена: как подключать новый виджет в shell и какие ограничения соблюсти.

## Проверка (команды)
```bash
# Выполняется в репозитории april-worker:
# pnpm install
# pnpm lint
# pnpm test
# pnpm exec playwright test (таргетный smoke shell-навигации, если доступен)
```

## Результат в отчёте
Ссылки на PR/коммиты в april-worker, финальный навигационный контракт (sidebar/tabs/routes/HostContext), результаты smoke и список ограничений/follow-up для последующих host-задач.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-035-phase-4a-hub-ui-shell-information-architecture.md` с пометкой "исполнение в AprilHub".
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, как устроен каркас навигации для profile-виджетов в Hub.
- [ ] Отдельно объяснено, когда использовать sidebar, когда tabs, когда отдельный route.
- [ ] В конце страницы есть ссылки на `tasks/035-phase-4a-hub-ui-shell-information-architecture/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
