# Vendored tarball’ы `@april/ui` и `@april/tokens`

**Сейчас (версия 0.1.5):** в `frontend/package.json` зависимости заданы как **`file:vendor/ds-packs/april-tokens-0.1.5.tgz`** и **`file:vendor/ds-packs/april-ui-0.1.5.tgz`** — `npm ci` не требует **`NODE_AUTH_TOKEN`**.

Архивы получают из submodule **`design-system/DisignApril`**:

```bash
sh frontend/scripts/repack-ds-vendor.sh
cd frontend && npm install   # обновит package-lock.json при смене содержимого .tgz
```

## Переход обратно на GitHub Packages (один источник — npm)

1. Опубликовать **`@ukituki-ps/april-tokens`** и **`@ukituki-ps/april-ui`** **0.1.5** (или ту же сборку, что в tarball’ах).
2. В `frontend/package.json` заменить `file:…` на **`npm:@ukituki-ps/april-tokens@^0.1.5`** и **`npm:@ukituki-ps/april-ui@^0.1.5`**.
3. С **`NODE_AUTH_TOKEN`** (`read:packages`): `cd frontend && rm -rf node_modules && npm install`.
4. Закоммитить обновлённый **`package-lock.json`**, при желании удалить `.tgz` из репозитория.

Подробнее — задачи **048–050**, эпик **049**.
