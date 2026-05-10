# Прикладной фронтенд (SPA)

Минимальный **Vite + React 18** shell на дизайн-системе April.

- **Текущая ветка разработки (без GPR-токена):** в [`package.json`](./package.json) заданы **`file:../design-system/DisignApril/packages/tokens`** и **`.../ui`** — нужен submodule **`design-system/DisignApril`** (`git submodule update --init --recursive`), после чего **`npm ci`** работает без `NODE_AUTH_TOKEN`. Версия UI в submodule должна совпадать с ожидаемым контрактом (см. задачу **079**, проп **`CardListColumn.hideMobileShellBar`**).
- **Целевой поток CI (GitHub Packages):** aliases **`npm:@ukituki-ps/april-tokens`** / **`npm:@ukituki-ps/april-ui`** и **`NODE_AUTH_TOKEN`** (`read:packages`) — см. [`.npmrc`](./.npmrc); задача **076**.

Каталог [`vendor/ds-packs`](./vendor/ds-packs/) — опциональный fallback (см. README там).

Submodule **`design-system/DisignApril`** нужен для **`ds:prepare`** (SVG в `frontend/public`), для **`file:`**-зависимостей и для **`scripts/repack-ds-vendor.sh`**.

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

## Дубликаты React и `mantine-vaul`

В [`vite.config.ts`](./vite.config.ts): `resolve.dedupe` и алиасы на **`react` / `react-dom`**; явные алиасы на **`mantine-vaul`** и **`mantine-vaul/style.css`** (корневой `node_modules`), плюс прямая зависимость **`mantine-vaul`** в `package.json` — чтобы при `file:` на DS не подмешивался второй React из pnpm-дерева submodule. В **`packages/profile-ui/vitest.config.ts`** те же принципы для workspace-тестов.

## Документация

Дизайн-система — [`docs/guides/DESIGN_SYSTEM.md`](../docs/guides/DESIGN_SYSTEM.md). Интеграция с AprilHub, админка и встраиваемые компоненты — [`docs/FRONTEND_STRATEGY.md`](../docs/FRONTEND_STRATEGY.md).

Пакет виджета профиля и его публичный API: [`packages/profile-ui/README.md`](./packages/profile-ui/README.md).
