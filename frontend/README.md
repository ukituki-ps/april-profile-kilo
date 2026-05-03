# Прикладной фронтенд (SPA)

Минимальный **Vite + React 18** shell на дизайн-системе April: **`@april/tokens`** и **`@april/ui`** сейчас подключены как **`file:vendor/ds-packs/*.tgz`** (зафиксированные архивы из submodule, см. [`package.json`](./package.json)). Для установки **достаточно** `npm ci` **без** токена к GitHub Packages.

Чтобы снова перейти на **только registry** (`npm:@ukituki-ps/…`), задайте **`NODE_AUTH_TOKEN`** (`read:packages`), поменяйте зависимости в `package.json` и выполните `npm install` — см. [`vendor/ds-packs/README.md`](./vendor/ds-packs/README.md) и [`.npmrc`](./.npmrc).

Submodule **`design-system/DisignApril`** нужен для **`ds:prepare`** (SVG в `frontend/public`) и для **`scripts/repack-ds-vendor.sh`** при обновлении vendored tarball’ов.

## Быстрый старт

```bash
cd frontend
npm ci
npm run dev
```

Перед `dev`/`build`/`test` автоматически выполняется **`ds:prepare`** (ассеты; при необходимости сборка через `pnpm` в submodule — см. комментарии в [`scripts/ds-prepare.sh`](./scripts/ds-prepare.sh)).

## Демо виджетов без бэкенда

В режиме **`npm run dev`** поднимается **MSW**: перехватываются запросы к тому же базовому URL, что и у виджета (`VITE_PROFILE_API_BASE_URL` или по умолчанию `/admin/profile/api` на хосте Vite). Примеры данных — в [`src/mocks/handlers.ts`](./src/mocks/handlers.ts).

Индекс всех демо: **`/widget-demos`** (фасады, Api-слой, `WidgetCore` + OpenAPI, **демо по markdown-спекам поверхностей**, showcase DS).

Прямые ссылки:

| Маршрут | Что смотреть |
|---------|----------------|
| `/widget-demos` | Оглавление |
| `/profiles-widget-demo` | `ProfilesWidget` |
| `/entity-types-widget-demo` | `EntityTypesWidget` |
| `/profiles-api-widget-demo` | `ProfilesApiWidget` |
| `/entity-types-api-widget-demo` | `EntityTypesApiWidget` |
| `/profiles-widget-core-demo` | `ProfilesWidgetCore` + `createOpenApiProfilesProvider` |
| `/entity-types-widget-core-demo` | `EntityTypesWidgetCore` + `createOpenApiEntityTypesProvider` |
| `/demo/surfaces/profiles-widget` | Спека `profiles-widget.md` + полный `ProfilesWidget` (MSW) |
| `/demo/surfaces/profiles-widget-list` | Редирект на `/demo/surfaces/profiles-widget` (старый URL без отдельной md-спеки списка) |
| `/demo/surfaces/profiles-widget-profile-detail` | `profiles-widget-profile-detail.md` + самостоятельный `ProfilesWidgetProfileDetail` (MSW) |
| `/demo/surfaces/entity-types-widget-catalog-list` | `entity-types-widget-catalog-list.md` + `EntityTypesWidget` |
| `/demo/surfaces/entity-types-widget-schema-admin` | `entity-types-widget-schema-admin.md` + `EntityTypesWidget` |
| `/demo/surfaces/entity-types-widget-entities-upgrade` | `entity-types-widget-entities-upgrade.md` + `EntityTypesWidget` |
| `/demo/surfaces/entity-types-widget-integration` | `entity-types-widget-integration.md` + вкладки (таблица props, виджеты) |
| `/showcase` | `UIKit` (дизайн-система) |

- Чтобы ходить в **настоящий** API по этому URL: `VITE_PROFILE_DEMO_MOCK=false`.

## Команды

| Команда | Назначение |
| -------- | ---------- |
| `npm run ds:prepare` | Ассеты DS (SVG), при необходимости сборка submodule |
| `npm run dev` | Vite dev server (порт 5173) |
| `npm run build` | Build shell + build `@april/profile-ui` (with OpenAPI generation) |
| `npm run lint` | Typecheck shell + typecheck `@april/profile-ui` |
| `npm test` | Vitest for shell + `@april/profile-ui` |

## Дубликаты React при `file:`-зависимостях

В [`vite.config.ts`](./vite.config.ts) заданы `resolve.dedupe` и алиасы на `react` / `react-dom` из `frontend/node_modules`, чтобы Mantine и `@april/ui` использовали один экземпляр React (и в тестах Vitest).

## Документация

Дизайн-система — [`docs/guides/DESIGN_SYSTEM.md`](../docs/guides/DESIGN_SYSTEM.md). Интеграция с AprilHub, админка и встраиваемые компоненты — [`docs/FRONTEND_STRATEGY.md`](../docs/FRONTEND_STRATEGY.md).

Пакет виджета профиля и его публичный API: [`packages/profile-ui/README.md`](./packages/profile-ui/README.md).
