# Чеклист интеграции виджета в host (AprilHub)

> Опубликованная копия: `docs-site/docs/widget-integration-checklist.md`.

Перед мержем интеграции в приложение host:

## Подготовка

- [ ] Заполнена спецификация по [`templates/HOST_INTEGRATION_SPEC_TEMPLATE.md`](./templates/HOST_INTEGRATION_SPEC_TEMPLATE.md).
- [ ] Версия виджета согласована с [`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md).

## Контекст и безопасность

- [ ] `HostContext` передаётся из доверенного слоя (OIDC/BFF); `tenant` совпадает с сессией.
- [ ] Маршруты и guard по ролям Keycloak настроены на host.
- [ ] Нет дублирования `MantineProvider` / корневого `Router` внутри виджета.

## Поведение

- [ ] Обработчики `onSaveSuccess`, `onError`, intent-событий реализованы; навигация выполняется на host.
- [ ] Fallback UI при ошибке загрузки виджета (lazy / error boundary) согласован.

## Mobile chrome (`AprilMobileShellBar`, узкий viewport) — стратегия A

**Норматив:** `design-system/DisignApril/DESIGN_SYSTEM.md` — §8 Mobile (встраивание, стек владельца), §11 **«Нормативный контракт `AprilMobileShellBar`»** (MUST/MUST NOT, таблица пропсов). Встраивание в **AprilHub** следует **стратегии A**: одна видимая капсула на ветку контента у нижнего края; глобальный dock Hub — отдельное продуктовое решение.

- [ ] **Стек:** при открытии sheet/полноэкранного шага виджет **не** оставляет нижнюю панель родительского уровня активной параллельно дочерней (например `hideMobileShellBar` у `CardListColumn`, см. [`widgets/profile/profiles-widget.md`](./widgets/profile/profiles-widget.md)).
- [ ] **«Назад»:** кнопка в слоте `leading` / закрытие листа **снимает верхний слой** до обработки смены маршрута в Hub; глобальный обработчик back/popstate **не** перебивает закрытие `AprilVaulBottomSheet`.
- [ ] **Маршруты** с master–detail / редактором на узкой ширине: зафиксировано, показывается ли глобальный нижний shell Hub **одновременно** с dock виджета; при риске двух конкурирующих рядов иконок — immersive (скрыть host dock) или full-bleed.
- [ ] **`profiles-widget`:** при необходимости отключить только shell списка — `cardListColumnMobileLayout="off"` на `ProfilesWidgetCore` (панель детали на узком **не** отключается этим пропом).
- [ ] **`@april/ui`** в lockfile Hub соответствует контракту (проп `hideMobileShellBar` и др.); vendored tarball — пересборка DS и обновление архива в shell.
- [ ] Прочитаны ADR-0006 и §8.6 [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md); спорные случаи — только с явным ADR/исключением в задаче.

## Наблюдаемость

- [ ] `requestId` / трассировка прокидываются в [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md) telemetry ([`WIDGET_OBSERVABILITY_GUIDE.md`](./WIDGET_OBSERVABILITY_GUIDE.md)).

## Проверка

- [ ] Ручной smoke: сохранение, ошибка API, сценарий «следующий» (если применимо).
- [ ] Lockfile обновлён; CI зелёный.
- [ ] Синхронизация документации выполнена: `docs/widgets/...` (канон) и `docs-site/docs/widget-catalog.md` / `docs-site/docs/widget-docs-operating-model.md` (человекопонятный слой).

## Каталог типов (`profileId`: `entity-types-admin`, `widgetId`: `entity-types-widget`)

- [ ] В конфигурации host зафиксированы **`entity-types-admin`** / **`entity-types-widget`** (см. [`docs/widgets/README.md`](./widgets/README.md)); нет подмены другими идентификаторами.
- [ ] BFF проксирует **полный** набор путей API для виджета по тому же каноническому префиксу, что и для профильных виджетов (обычно `/admin/profile/api` → сервисный `/api`), без «произвольного внешнего URL» без OIDC и tenant из JWT — см. [`docs/integration/entity-types-widget-hub-handoff.md`](./integration/entity-types-widget-hub-handoff.md).
- [ ] `EntityTypesWidget` получает тот же паттерн **`hostContext` + `apiBaseUrl` + `accessToken`**, что и `ProfilesWidget`; `tenant` не вводится из полей формы виджета.
- [ ] Host реализует `onAction` / `onOpenEntity` (например переход к `profiles-widget` по `entity_id`) и не полагается на внутренний роутинг виджета.
- [ ] Для операций **publish** и **batch upgrade** согласованы таймауты reverse-proxy/BFF и ожидания UX (виджет блокирует повтор до завершения in-flight запроса).
