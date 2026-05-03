# 069 — micro: дизайн-система 0.1.9 в AprilProfile shell

## Мета
- **ID / ветка:** `069-micro-ds-0-1-9-bump` / `feature/micro-ds-0-1-9-bump`
- **Приоритет:** обычный
- **Связанные файлы:** `design-system/DisignApril`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/packages/profile-ui/package.json`, `frontend/vendor/ds-packs/`, `frontend/scripts/repack-ds-vendor.sh`, оперативные доки виджетов

## Цель
Поднять потребление **DisignApril** до **`@april/ui` / `@april/tokens` 0.1.9**: vendored tarball’ы, lockfile, peer/dev зависимости `@april/profile-ui`, baseline в README и виджет-доках; синхронизировать постановку **068** с тем, что публичный вид **`collapsed`** у `CardListColumn` снят в DS **0.1.9**.

## Scope
### Входит
- Submodule `design-system/DisignApril` на merge релиза **0.1.9** (`4f5aae4`).
- `repack-ds-vendor.sh` → `april-tokens-0.1.9.tgz`, `april-ui-0.1.9.tgz`; удаление архивов **0.1.8** из `vendor/ds-packs/`.
- Обновление `frontend/package.json`, `package-lock.json`, `packages/profile-ui` (`peerDependencies`, dev `file:`).
- Доки: `vendor/ds-packs/README.md`, `packages/profile-ui/README.md`, `docs/widgets/profile/*`, `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`, `task_list.md`, при необходимости **068** TASK/PLAN (актуальность API вида колонки).
- Мок теста `ProfilesWidgetCore.test.tsx`: тип `onViewChange` без `collapsed`.

### Не входит
- Переход на npm registry (**048**).
- Новые UI-фичи из DS без отдельной постановки.
- Backend / деплой.

## AGENT_MASTER_PROMPT compliance checklist
- [x] Прочитан `docs/AGENT_MASTER_PROMPT.md`.
- [x] DS-first сохранён (только bump поставки DS + согласование док/типов).
- [x] Scope не расширен.
- [x] Релевантные проверки frontend выполнены.
- [x] Подготовлен `REPORT.md`.

## Acceptance criteria
- [x] Submodule и tarball’ы соответствуют **0.1.9**; архивы **0.1.8** удалены из `vendor/ds-packs/`.
- [x] Shell и `@april/profile-ui` указывают на **`file:…0.1.9.tgz`**; peer **`@april/ui` ≥ 0.1.9**.
- [x] `npm run lint -w @april/profile-ui`, `npm run test -w @april/profile-ui -- --run`, `npm run build -w @april/profile-ui` и shell `lint`/`test`/`build` проходят.

## Проверка (команды)
```bash
sh frontend/scripts/repack-ds-vendor.sh
cd frontend && npm install
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run && npm run build -w @april/profile-ui
cd frontend && npm run lint:app && npm run test:app && npm run build:app
```

## Ожидаемый результат в REPORT
Перечень изменённых файлов, результаты команд, риски (breaking DS: снят публичный **`collapsed`** у `CardListColumn`), follow-up (**048** registry **0.1.9**).
