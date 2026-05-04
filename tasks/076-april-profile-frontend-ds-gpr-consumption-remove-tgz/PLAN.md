# План задачи 076 [april-profile] — GPR в `frontend/`

## Шаги
1. Убедиться, что **075** выполнена: пакеты видны через `npm view`.
2. Заменить в **`frontend/package.json`** зависимости на `npm:@ukituki-ps/april-tokens@^0.1.9` и `npm:@ukituki-ps/april-ui@^0.1.9` с алиасами на ключи `@april/tokens` и `@april/ui` (синтаксис npm: `"@april/ui": "npm:@ukituki-ps/april-ui@^0.1.9"`).
3. Удалить из dependencies дублирующую строку `@ukituki-ps/april-tokens: file:…`, если она больше не нужна.
4. В **`frontend/packages/profile-ui/package.json`**: devDependency `@april/ui` — тот же npm-алиас.
5. `npm install` в `frontend/` с `NODE_AUTH_TOKEN`; закоммитить `package-lock.json`.
6. `git rm` файлов `frontend/vendor/ds-packs/april-*.tgz` (если больше не используются).
7. Обновить README и каноничные docs; прогнать CI-эквивалент локально.

## Проверки после merge
- PR в `develop`; job `frontend` в `ci.yml` зелёный с `NODE_AUTH_TOKEN`.
