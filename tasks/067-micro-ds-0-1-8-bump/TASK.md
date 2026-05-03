# 067 — micro: дизайн-система 0.1.8 в AprilProfile shell

## Мета
- **ID / ветка:** `067-micro-ds-0-1-8-bump` / `feature/micro-ds-0-1-8-bump`
- **Приоритет:** обычный
- **Связанные файлы:** `design-system/DisignApril`, `frontend/package.json`, `frontend/packages/profile-ui/package.json`, `frontend/vendor/ds-packs/`, `frontend/scripts/repack-ds-vendor.sh`, `frontend/vite.config.ts`, `frontend/packages/profile-ui/vitest.config.ts`

## Цель
Поднять потребление **DisignApril** в этом репозитории до **`@april/ui` / `@april/tokens` 0.1.8**: vendored tarball’ы, lockfile, peer/dev зависимости `@april/profile-ui`, актуальные формулировки в оперативной документации виджетов; обеспечить прохождение Vitest при появлении **`mantine-vaul`** с CSS side-effect в цепочке DS.

## Scope
### Входит
- Submodule `design-system/DisignApril` на коммит релиза **0.1.8** (merge PR release).
- Пересборка архивов `frontend/scripts/repack-ds-vendor.sh`, замена vendored **`0.1.5`** на **0.1.8** (удаление старых `.tgz`).
- Обновление `frontend/package.json`, `package-lock.json`, `packages/profile-ui` (`peerDependencies`, dev `file:` на ui).
- Согласование минимальной версии в README/виджет-доках / шаблоне changelog, где зафиксирован baseline shell.
- **`test.server.deps.inline`** для `@april/ui` и `mantine-vaul` в Vitest (workspace + shell).

### Не входит
- Переход на npm registry вместо `file:` (задача **048**).
- Новые UI-фичи из DS без отдельной постановки.
- Backend / деплой.

## AGENT_MASTER_PROMPT compliance checklist
- [x] Прочитан `docs/AGENT_MASTER_PROMPT.md`.
- [x] DS-first сохранён (только bump поставки DS).
- [x] Scope не расширен.
- [x] Релевантные проверки frontend выполнены.
- [x] Подготовлен `REPORT.md`.

## Acceptance criteria
- [x] Submodule и tarball’ы соответствуют **0.1.8**; архивы **0.1.5** удалены из `vendor/ds-packs/`.
- [x] Shell и `@april/profile-ui` указывают на **`file:…0.1.8.tgz`**; peer **`@april/ui` ≥ 0.1.8**.
- [x] `npm run lint -w @april/profile-ui`, `npm run test -w @april/profile-ui`, `npm run build -w @april/profile-ui` и shell `lint`/`test`/`build` проходят.

## Проверка (команды)
```bash
cd frontend && npm install
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
cd frontend && npm run lint:app && npm run build:app && npm run test:app
```

## Ожидаемый результат в REPORT
Перечень изменённых файлов, результаты команд, риски (breaking DS, Vitest/CSS), follow-up (registry **048**, публикация **0.1.8**).
