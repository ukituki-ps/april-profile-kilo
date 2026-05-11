---
sidebar_position: 10
---

# Чеклист интеграции виджета в host (AprilHub)

> Каноническая копия: `docs/WIDGET_INTEGRATION_CHECKLIST.md`.

Перед мержем интеграции в приложение host:

## Подготовка

- [ ] Заполнена спецификация по `docs/templates/HOST_INTEGRATION_SPEC_TEMPLATE.md`.
- [ ] Версия виджета согласована с [версионированием](/docs/versioning-and-compatibility).

## Контекст и безопасность

- [ ] `HostContext` передаётся из доверенного слоя (OIDC/BFF); `tenant` совпадает с сессией.
- [ ] Маршруты и guard по ролям Keycloak настроены на host.
- [ ] Нет дублирования `MantineProvider` / корневого `Router` внутри виджета.

## Поведение

- [ ] Обработчики `onSaveSuccess`, `onError`, intent-событий реализованы; навигация выполняется на host.
- [ ] Fallback UI при ошибке загрузки виджета (lazy / error boundary) согласован.

## Mobile chrome (`AprilMobileShellBar`, узкий viewport) — стратегия A

Канон: `docs/WIDGET_INTEGRATION_CHECKLIST.md` в репозитории `april-profile`. Норматив DS: submodule `design-system/DisignApril/DESIGN_SYSTEM.md` — §8 (стек владельца), §11 (нормативный контракт `AprilMobileShellBar`).

- [ ] **Стек:** при sheet/полноэкранном шаге не оставлять активной нижнюю панель родителя параллельно дочерней (`hideMobileShellBar` и т.п.); вложенный `AprilVaulBottomSheet` — вершина стека: панель уровня родителя не показывать, пока лист открыт.
- [ ] **«Назад»:** сначала закрывается верхний слой виджета; глобальный обработчик Hub не перебивает `AprilVaulBottomSheet`.
- [ ] **Маршруты** master–detail: согласовано отображение глобального dock Hub одновременно с dock виджета.
- [ ] **`profiles-widget`:** при необходимости — `cardListColumnMobileLayout="off"` (см. `docs/widgets/profile/profiles-widget.md` в репозитории).
- [ ] **`@april/ui`** в lockfile содержит контрактные пропы; vendored tarball — пересборка DS.
- [ ] [ADR-0006](/adr/mobile-chrome-layers-widget-host), §8.6 [контрактов](/docs/widget-contracts), §5.1 [стратегии фронтенда](/docs/frontend-strategy).

## Наблюдаемость

- [ ] `requestId` / трассировка прокидываются в telemetry ([контракты](/docs/widget-contracts), [наблюдаемость](/docs/widget-observability-guide)).

## Проверка

- [ ] Ручной smoke: сохранение, ошибка API, сценарий «следующий» (если применимо).
- [ ] Lockfile обновлён; CI зелёный.
- [ ] Синхронизация документации выполнена: `docs/widgets/...` (канон) и страницы каталога/модели в docs-site.

## Каталог типов (`profileId`: `entity-types-admin`, `widgetId`: `entity-types-widget`)

- [ ] В конфигурации host зафиксированы **`entity-types-admin`** / **`entity-types-widget`** (см. каталог в репозитории `docs/widgets/README.md`); нет подмены другими идентификаторами.
- [ ] BFF проксирует **полный** набор путей API для виджета по тому же каноническому префиксу, что и для профильных виджетов (обычно `/admin/profile/api` → сервисный `/api`), без «произвольного внешнего URL» без OIDC — см. handoff в репозитории `docs/integration/entity-types-widget-hub-handoff.md`.
- [ ] `EntityTypesWidget` получает тот же паттерн **`hostContext` + `apiBaseUrl` + `accessToken`**, что и `ProfilesWidget`; `tenant` не вводится из полей формы виджета.
- [ ] Host реализует `onAction` / `onOpenEntity` (например переход к `profiles-widget` по `entity_id`) и не полагается на внутренний роутинг виджета.
- [ ] Для операций **publish** и **batch upgrade** согласованы таймауты reverse-proxy/BFF и ожидания UX (виджет блокирует повтор до завершения in-flight запроса).
