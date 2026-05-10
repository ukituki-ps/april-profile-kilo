# Отчёт по задаче 077 [april-worker] — hub-shell: DS из GitHub Packages

## Статус

✅ Реализация выполнена в репозитории **[april-worker](https://github.com/ukituki-ps/april-worker)** (ветка/PR — по процессу команды; локальный отчёт агента: `tasks/053-aprilhub-execute-external-task-077-april-profile-1/REPORT.md` в том репозитории).

## Суть изменений

- `hub-shell/package.json`: **`@april/tokens`** / **`@april/ui`** → **`npm:@ukituki-ps/april-tokens@^0.1.9`** и **`npm:@ukituki-ps/april-ui@^0.1.9`** (как `frontend/` april-profile после **076**); добавлен **`@mantine/hooks`** под peer DS.
- `hub-shell/.npmrc`: GPR для `@ukituki-ps`, токен через **`${NODE_AUTH_TOKEN}`** (секрет не в git).
- `hub-shell/package-lock.json`: без `file:` на DisignApril; lock согласован с транзитивами из **`april-profile-1/frontend`** + зависимости hub-shell.
- `hub-shell/scripts/ds-prepare.sh`: при потреблении из registry **не** выполняется `pnpm install && pnpm build` в корне DisignApril и **не** синхронизируется `dist` из submodule в `node_modules`.
- `hub-shell/scripts/assert-ui-dist-exports.mjs`: gate по **`node_modules/@april/ui`** при установке из registry.
- CI **april-worker**: `NODE_AUTH_TOKEN`, scope GPR для `npm ci` hub-shell; alpine preflight упрощён под закоммиченный `.npmrc`.

## Проверка (acceptance)

- Критерий **`npm ci && npm run lint && npm run test && npm run build`** с токеном GPR — на **GitHub Actions** self-hosted с секретом **`GPR_READ_TOKEN`** (или эквивалентным доступом `read:packages`). Локальный прогон без такого токена упирается в **403** к `npm.pkg.github.com` — ожидаемо.

## PR / коммиты

- Указать в описании PR **april-worker** после merge: ссылка на PR и короткий changelog (дублирует отчёт **053** в april-worker).

## Риски / follow-up

- Поддержка lock: при bump версий `@ukituki-ps/april-*` — обновлять `hub-shell/package-lock.json` с авторизованным `npm install` или согласованной процедурой слияния с lock **frontend** april-profile.
