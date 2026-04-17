# Прикладной фронтенд (SPA)

Минимальный **Vite + React 18** shell на дизайн-системе April: зависимости **`@april/tokens`** и **`@april/ui`** подключены как `file:` к git submodule **`../design-system/DisignApril`** (см. корневой [`.gitmodules`](../.gitmodules)).

## Быстрый старт

После `git submodule update --init --recursive` в корне репозитория:

```bash
cd frontend
npm ci
npm run dev
```

Перед `dev`/`build`/`test` автоматически выполняется **`ds:prepare`**: `pnpm install --frozen-lockfile` и `pnpm build` в `design-system/DisignApril` (нужны **corepack** и **pnpm** — `corepack enable` в `scripts/ds-prepare.sh`).

## Команды

| Команда | Назначение |
| -------- | ---------- |
| `npm run ds:prepare` | Сборка пакетов DS в submodule |
| `npm run dev` | Vite dev server (порт 5173) |
| `npm run build` | Typecheck + production bundle |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Vitest |

## Дубликаты React при `file:`-зависимостях

В [`vite.config.ts`](./vite.config.ts) заданы `resolve.dedupe` и алиасы на `react` / `react-dom` из `frontend/node_modules`, чтобы Mantine и `@april/ui` использовали один экземпляр React (и в тестах Vitest).

## Документация

Полное описание — [`docs/guides/DESIGN_SYSTEM.md`](../docs/guides/DESIGN_SYSTEM.md).
