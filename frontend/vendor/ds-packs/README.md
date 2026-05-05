# Vendored tarball’ы `@april/ui` и `@april/tokens` (fallback)

**Основной поток:** зависимости в `frontend/package.json` и `frontend/packages/profile-ui/package.json` заданы через registry aliases — **`npm:@ukituki-ps/april-tokens@^0.1.9`** и **`npm:@ukituki-ps/april-ui@^0.1.9`**. Для `npm ci` нужен **`NODE_AUTH_TOKEN`** (`read:packages`) согласно `frontend/.npmrc`.

Vendored `.tgz` в этом каталоге — **опциональный fallback** для офлайн/аварийных сценариев.

Архивы получают из submodule **`design-system/DisignApril`**:

```bash
sh frontend/scripts/repack-ds-vendor.sh
cd frontend && npm install   # обновит package-lock.json при смене содержимого .tgz
```

## Временный переход на `.tgz` (если registry недоступен)

1. Обновить архивы из submodule:

   ```bash
   sh frontend/scripts/repack-ds-vendor.sh
   ```

2. Временно переключить зависимости `@april/tokens` и `@april/ui` на `file:vendor/ds-packs/*.tgz`.
3. Выполнить `cd frontend && npm install` и зафиксировать lock.
4. После восстановления registry вернуть aliases `npm:@ukituki-ps/...` и повторно обновить lock.
