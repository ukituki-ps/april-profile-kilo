# Спецификация виджета: `<@april/package-name>`

> **Как пользоваться шаблоном:** скопируйте файл в `docs/widgets/...`, замените заголовок и все значения, которые не относятся к вашему виджету. Ниже в столбце «Значение» приведён **пример** для реального пакета **`@april/profile-ui`**, виджет **`profiles-widget`** — ориентир по полноте и формулировкам.

## Мета

| Поле | Значение |
|------|----------|
| Пакет npm | `@april/profile-ui` |
| Версия контракта | HostContext v1; публичные пропсы/события виджета v1 |
| Владелец (команда) | Команда AprilProfile; интеграция в AprilHub (`april-worker`) |
| Репозиторий | `github.com:<org>/april-profile` |
| Связанный OpenAPI / домен | `openapi/openapi.yaml` — домен профилей сущностей (`/v1/profiles`, `/v1/entity-types`) |

## Назначение

Кратко: какую пользовательскую задачу решает виджет и где встраивается (Hub, админка).

**Пример:** master-detail для списка профилей сущностей: поиск, фильтр по типу, пагинация, карточка версий и JSON-документа, создание/редактирование/удаление; встраивается в админ-маршрут host за OIDC/BFF.

## Границы

- Что **входит** в ответственность виджета.
- Что остаётся на **host** (навигация, глобальный layout).
- Что обеспечивает **API/BFF** (авторизация, фильтрация полей по ABAC).

**Пример:**

- **Виджет:** отображение списка и карточки, локальный UI форм, вызовы API через провайдер, эмиссия `onAction` / `onError`.
- **Host:** маршрут страницы, `hostContext` (tenant, telemetry), передача `apiBaseUrl` / токена, реакция на intent (например toast или переход к связанной сущности).
- **BFF/API:** проверка JWT, ABAC, сериализация ошибок с `request_id`.

## Публичный API

### Props

| Имя | Тип | Обязательность | Описание |
|-----|-----|----------------|----------|
| `hostContext` | `ProfileWidgetHostContext` | да | `tenant.id`, обязательный `telemetry.requestId`; опционально `auth`, `locale`, `theme` — см. `docs/WIDGET_CONTRACTS.md` |
| `apiBaseUrl` | `string` | да | Базовый URL BFF для префикса `/v1/...` |
| `accessToken` | `string` | нет | Access token для `Authorization: Bearer`; host обновляет при refresh OIDC |
| `pageSize` | `number` | нет | Размер страницы списка (например `20`) |
| `initialSearch` | `string` | нет | Начальная строка поиска |
| `initialTypeId` | `string` | нет | Предвыбор фильтра типа сущности или `"all"` |
| `initialSort` | `"updated_desc" \| "updated_asc" \| …` | нет | Начальная сортировка списка |
| `initialCreateEntityTypeId` | `string \| null` | нет | UUID типа для предвыбора в модалке создания |
| `autoSelectFirst` | `boolean` | нет | Автовыбор первой строки после загрузки |
| `onAction` | `(action: ProfilesListAction) => void` | нет | `created` / `updated` / `deleted` после успешной мутации |
| `onError` | `(payload: { message; requestId?; code? }) => void` | нет | Безопасное сообщение для UI + корреляция |
| `onObservability` | handler | нет | См. `docs/WIDGET_OBSERVABILITY_GUIDE.md` |
| `onOpenEntity` | `(entityId: string) => void` | нет | Intent для host-навигации к другому экрану |

### События (callbacks / `onEvent`)

| Событие | Payload | Когда эмитится |
|---------|---------|----------------|
| `onAction` | `{ type: "created"; item: ProfilesListItem }` | Успешное создание профиля |
| `onAction` | `{ type: "updated"; item: ProfilesListItem }` | Сохранена новая версия документа |
| `onAction` | `{ type: "deleted"; entityId: string }` | Профиль удалён |
| `onError` | `{ message: string; requestId?: string; code?: string }` | Ошибка сети, 4xx/5xx, конфликт версий и т.п. |

## Зависимости

- `@april/ui`, `@april/tokens` — версии как в `frontend/package.json` стенда.
- Peer: `react` / `react-dom` 18.x, `@mantine/core` (совместимая с DS).

## Нефункциональные требования

- Локаль: строки UI на английском в baseline-пакете; i18n — зона host или последующих задач.
- Доступность (a11y): фокус в модалках, подписи полей, кнопки с `aria-label` для иконок.
- Производительность: список с пагинацией; без загрузки полного каталога сущностей в браузер.

## Риски и ограничения

- Клиентская уникальность `document.name` проверяется только по текущей странице списка; финальная уникальность — на сервере.
- Виджет не вызывает `navigate` сам; навигация только через колбэки host.

## Ссылки

- [`docs/WIDGET_CONTRACTS.md`](../WIDGET_CONTRACTS.md)
- ADR-0004, ADR-0003 (при работе с данными профиля)
