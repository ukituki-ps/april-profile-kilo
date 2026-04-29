# Vendored tarball’ы `@april/ui` и `@april/tokens`

Пока пакеты **не опубликованы** в GitHub Packages, зависимости в `frontend/package.json` указывают на **зафиксированные tarball’ы** в этом каталоге (версия пакетов **0.1.0**, совпадает с текущим submodule `design-system/DisignApril`). Это снимает класс инцидентов «устаревший `dist` в submodule», не требуя `pnpm build` в DisignApril на каждом `npm ci`.

## Обновить tarball’ы после изменений в DisignApril

Из каталога репозитория (с инициализированным submodule):

```bash
sh frontend/scripts/repack-ds-vendor.sh
cd frontend && npm install
```

## Переход на registry (semver в `package.json`)

После публикации `@april/ui` и `@april/tokens` в GitHub Packages:

1. Заменить в `frontend/package.json` зависимости на `^0.1.0` (или согласованный диапазон с AprilHub).
2. Раскомментировать строки в `frontend/.npmrc` для `@april:registry` и `NODE_AUTH_TOKEN`.
3. Удалить tarball’ы из `vendor/ds-packs/` и выполнить `npm install` с рабочим токеном для обновления `package-lock.json`.

Подробности — `tasks/048-phase-7-ds-npm-registry-deps-lock-npmrc/REPORT.md` и задачи **049** / **050**.
