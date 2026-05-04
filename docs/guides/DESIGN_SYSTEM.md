---
sidebar_position: 4
---

# Дизайн-система April (`@april/tokens`, `@april/ui`)

Исходники, витрина и полные соглашения — в репозитории **[DisignApril](https://github.com/ukituki-ps/DisignApril)** (pnpm workspace: `packages/tokens`, `packages/ui`, при необходимости `apps/showcase`).

В этом репозитории дизайн-система **по-прежнему доступна как git submodule** `design-system/DisignApril` (исходники, витрина, копирование SVG в shell), а прикладной **минимальный shell** — в каталоге **`frontend/`** (Vite + React + `AprilProviders` из `@april/ui`). **Источник правды для зависимостей shell** сейчас — **vendored tarball’ы** `frontend/vendor/ds-packs/april-*.tgz` (см. `frontend/package.json` и `frontend/vendor/ds-packs/README.md`): так `npm ci` проходит без доступа к GitHub Packages. Целевой режим экосистемы — **`npm:@ukituki-ps/april-ui`** / **`npm:@ukituki-ps/april-tokens`** из **GitHub Packages** (`frontend/.npmrc`, **`NODE_AUTH_TOKEN`** с **`read:packages`**); переключение описано в том же README. Скрипт **`frontend/scripts/repack-ds-vendor.sh`** обновляет архивы из submodule **DisignApril**.

Архитектурное решение по registry для экосистемы April фиксируется в **AprilHub** ([репозиторий april-worker](https://github.com/ukituki-ps/april-worker), эпик `049-april-ds-registry-consumption-epic`; по мере merge — раздел `docs/architecture/` с ADR).

## 1. Первый клон

```bash
git clone --recurse-submodules <url>
# или после обычного clone:
git submodule update --init --recursive
```

Submodule нужен для **ассетов** (`ds:prepare` → `frontend/public`) и опционально для `repack-ds-vendor.sh`; при отсутствии каталога `design-system/DisignApril` shell всё равно может собраться с fallback-токенами (см. `frontend/scripts/ds-prepare.sh`).

## 2. Локальная разработка и CI

Из каталога `frontend/`:

```bash
npm ci
npm run dev    # pre* вызывают ds:prepare
npm run build
```

`ds:prepare` **не** запускает `pnpm install` / `pnpm build` внутри submodule, если в `frontend/package.json` **нет** `file:`-путей к `design-system/DisignApril/packages/ui` или `.../tokens` (режим потребления через **GitHub Packages**). При наличии submodule по-прежнему копируются SVG из `apps/showcase/public`.

Редкий офлайновый апдейт через tarball’ы после изменений только в DisignApril (не основной поток):

```bash
sh frontend/scripts/repack-ds-vendor.sh
```
Далее вручную переключают зависимости в `frontend/package.json` на `file:…` или обновляют опубликованные версии и делают `npm install` с токеном — см. `frontend/vendor/ds-packs/README.md`.

## 3. Пакеты

| Пакет | Назначение |
| ----- | ---------- |
| `@april/tokens` | Токены (цвета, плотность, логотип), CSS для сервисов без React (`import '@april/tokens/css'`) |
| `@april/ui` | Тема Mantine, `AprilProviders`, плотность; peer — `@mantine/core`, `@emotion/react`, React 18 |

Подробности по токенам и паттернам — в `DESIGN_SYSTEM.md` внутри репозитория DisignApril.

**Нижняя mobile-панель (`AprilMobileShellBar`):** в submodule `design-system/DisignApril/DESIGN_SYSTEM.md` — §8 Mobile (**стратегия A**, стек владельца, AprilHub), §11 **нормативный контракт** (таблицы MUST/MUST NOT, все публичные пропсы). Проп **`hideMobileShellBar`** у `CardListColumn` — §13. ADR — [`adr/0006-mobile-chrome-layers-widget-host.md`](../adr/0006-mobile-chrome-layers-widget-host.md); чеклист AprilHub — [`WIDGET_INTEGRATION_CHECKLIST.md`](../WIDGET_INTEGRATION_CHECKLIST.md); контракт виджетов — [`WIDGET_CONTRACTS.md`](../WIDGET_CONTRACTS.md) §8.6; сборка Hub — [`FRONTEND_STRATEGY.md`](../FRONTEND_STRATEGY.md) §5.1.

## 3.1 Политика DS-first (обязательно)

Для продуктовых задач по фронтенду действует приоритет:

1. Использовать готовый компонент/паттерн из `@april/ui`.
2. Если не хватает поведения — сначала сделать тонкую обёртку вокруг DS-компонента.
3. Кастомный UI с нуля — только как исключение, с фиксацией причин в `TASK.md` и `REPORT.md`.

Версии **`@april/ui` и `@april/tokens` должны быть согласованы с AprilHub** (`hub-shell`): одна линия semver в **`frontend/package.json`** и **`frontend/package-lock.json`** (конкретные миноры — см. lock).

## 4. Минимальный shell (корень приложения)

```tsx
import '@mantine/core/styles.css';
import { AprilProviders } from '@april/ui';

export function App() {
  return (
    <AprilProviders>
      {/* маршрутизатор и экраны сервиса */}
    </AprilProviders>
  );
}
```

При экранах с `@xyflow/react` добавьте `import '@xyflow/react/dist/style.css'`.

## 5. GitHub Packages и `.npmrc`

Потребительский поток — **semver** в `frontend/package.json` и установка через **npm.pkg.github.com** (scope **`@ukituki-ps`**, см. **`frontend/.npmrc`** и подстановку **`NODE_AUTH_TOKEN`**). Для локального `npm ci` задайте в окружении `NODE_AUTH_TOKEN` (PAT с `read:packages` или GH CLI с нужным scope). В GitHub Actions см. секрет **`APRIL_NPM_READ_TOKEN`** (опционально) и переменную шага **`NODE_AUTH_TOKEN`** в `.github/workflows/ci.yml` и `bootstrap-ci.yml` (задача **049**).

## 6. Bump версии DS и регрессия UI (чеклист)

| Шаг | Действие |
|-----|----------|
| 1 | Согласовать целевые версии `@april/ui` / `@april/tokens` с владельцем AprilHub (`hub-shell`, эпик 049). |
| 2 | Обновить зависимости и lock в `frontend/` (`npm install` / `npm ci` с рабочим `NODE_AUTH_TOKEN` при установке из registry). |
| 3 | `npm run lint`, `npm run test`, `npm run build` в `frontend/`. |
| 4 | Smoke вручную: админский shell, список профилей / виджеты, переключение темы (светлая/тёмная), локаль с RTL при наличии сценариев. |
| 5 | Если сознательно используете vendored tarball’ы (не основной поток): `sh frontend/scripts/repack-ds-vendor.sh` и решение про `file:` в `frontend/package.json` — см. `frontend/vendor/ds-packs/README.md`. |

## 7. Важно: не тяните витрину в релиз

Компонент **`UIKit`** в `@april/ui` — для разработки и ревью. В продакшене не импортируйте `UIKit`; витрина — `pnpm dev` в DisignApril или внутренний стенд.

## 8. Связка с репозиторием

- Подсказки по структуре — `frontend/vendor/ds-packs/README.md`, `frontend/README.md` (если есть).
- Версии инструментов — [`VERSIONS.md`](./VERSIONS.md).
- Деплой и секреты CI — в репозитории файл `docs/DEPLOYMENT_STRATEGY.md` (§3a: `APRIL_NPM_READ_TOKEN`, `NODE_AUTH_TOKEN` для `frontend/`). На сайте Docusaurus этот файл не в плагине `guides/` — открывайте из корня репозитория или через основную документацию продукта.
