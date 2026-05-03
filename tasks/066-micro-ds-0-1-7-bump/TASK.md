# 066 — micro: дизайн-система 0.1.7 в AprilProfile shell

## Мета
- **ID / ветка:** `066-micro-ds-0-1-7-bump` / `feature/*` (по договорённости репо)
- **Приоритет:** обычный
- **Связанные файлы:** `design-system/DisignApril`, `frontend/package.json`, `frontend/packages/profile-ui/package.json`, `frontend/vendor/ds-packs/`, `frontend/scripts/repack-ds-vendor.sh`, `docs/AGENT_MASTER_PROMPT.md`

## Цель
Поднять потребление **DisignApril** в этом репозитории до **`@april/ui` / `@april/tokens` 0.1.7**: vendored tarball’ы, lockfile, peer/dev зависимости `@april/profile-ui`, актуальные формулировки в оперативной документации виджетов.

## Scope
### Входит
- Submodule `design-system/DisignApril` на коммит релиза **0.1.7** (merge PR release).
- Пересборка архивов `frontend/scripts/repack-ds-vendor.sh`, замена `april-*-0.1.6.tgz` на **0.1.7**.
- Обновление `frontend/package.json`, `package-lock.json`, `packages/profile-ui` (`peerDependencies`, dev `file:` на ui).
- Согласование минимальной версии в README/виджет-доках, где зафиксирован baseline shell.

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
- [x] Submodule и tarball’ы соответствуют **0.1.7**; архивы **0.1.6** удалены из vendor.
- [x] Shell и `@april/profile-ui` указывают на **`file:…0.1.7.tgz`**; peer **`@april/ui` ≥ 0.1.7**.
- [x] `npm run lint -w @april/profile-ui`, `npm run test -w @april/profile-ui`, `npm run build -w @april/profile-ui` проходят (и при необходимости `lint`/`build` корня workspace).

## Проверка (команды)
```bash
cd frontend && npm install
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
cd frontend && npm run lint && npm run build
```

## Ожидаемый результат в REPORT
Перечень изменённых файлов, результаты команд, риски (breaking DS), follow-up (registry **048**, публикация **0.1.7**).
