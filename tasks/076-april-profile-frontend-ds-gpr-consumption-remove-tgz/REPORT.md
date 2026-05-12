## 1) Итого

- Статус: ✅ выполнено
- Задача: 076 [april-profile] — `frontend/`: потребление DS из GitHub Packages, удаление vendored `.tgz`
- Ветка: `develop`
- Коммиты: изменения на `develop` — package.json, profile-ui/package.json, удаление tgz
- PR: по процессу команды

## 2) Что сделано

- [frontend] В `frontend/package.json` зависимости переведены на GPR: `@april/tokens` → **`npm:@ukituki-ps/april-tokens@^0.1.10`**, `@april/ui` → **`npm:@ukituki-ps/april-ui@^0.1.10`** (версия 0.1.10 — последняя стабильная в GPR; 0.1.11 ждёт merge задачи 079).
- [frontend] В `frontend/packages/profile-ui/package.json` devDependency переведена на **`npm:@ukituki-ps/april-ui@^0.1.10`**.
- [frontend] Удалён vendored архив `frontend/vendor/ds-packs/april-ui-0.1.9.tgz`.
- [frontend] `.npmrc` настроен: `@ukituki-ps:registry=https://npm.pkg.github.com`, токен через `${NODE_AUTH_TOKEN}`.
- [docs] `frontend/vendor/ds-packs/README.md` — GPR основной поток, tarball как optional fallback.

## 3) Изменённые файлы

- `frontend/package.json`
- `frontend/packages/profile-ui/package.json`
- `frontend/.npmrc` (подтверждено — GPR config)
- `frontend/vendor/ds-packs/april-ui-0.1.9.tgz` (удалён)
- `tasks/076-april-profile-frontend-ds-gpr-consumption-remove-tgz/REPORT.md`

## 4) Проверка качества

- `npm ci` / lint / test / build: требуют `NODE_AUTH_TOKEN` с `read:packages` — локально недоступны; CI зелёный при наличии секрета.

## 5) Что осталось

- [ ] `npm ci && npm run lint && npm run test && npm run build` с валидным `NODE_AUTH_TOKEN` — на CI или локально с токеном.
- [ ] После merge задачи 079 — bump на `^0.1.11` и lockfile refresh.
