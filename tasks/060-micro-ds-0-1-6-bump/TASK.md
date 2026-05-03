# 060 — micro: дизайн-система 0.1.6 в AprilProfile shell

## Мета

- **ID:** `060-micro-ds-0-1-6-bump`
- **Ветка:** `feature/060-micro-ds-0-1-6-bump` (или текущая feature-ветка разработчика)
- **Приоритет:** низкий / техдолг версий
- **Связанные файлы:** `design-system/DisignApril` (submodule), `frontend/package.json`, `frontend/package-lock.json`, `frontend/vendor/ds-packs/*`, `frontend/packages/profile-ui/package.json`, `docs/widgets/profile/*.md`, `frontend/packages/profile-ui/README.md`, `frontend/vendor/ds-packs/README.md`, `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`, при необходимости `tasks/059-…/TASK.md` (ограничения по версии DS)

## Цель

Поднять потребление **DisignApril** в этом репозитории до **`@april/ui` / `@april/tokens` 0.1.6**: vendored tarball’ы, lockfile, peer/dev зависимости `@april/profile-ui`, актуальные формулировки в оперативной документации виджетов и шаблонах.

## Scope

### Входит

- Submodule `design-system/DisignApril` на коммит релиза **0.1.6** (merge PR release).
- Пересборка архивов `frontend/scripts/repack-ds-vendor.sh`, замена `april-*-0.1.5.tgz` на **0.1.6** в репозитории.
- Обновление `frontend/package.json`, `frontend/package-lock.json`, `frontend/packages/profile-ui/package.json`.
- Обновление README vendor, profile-ui, порогов в спеках виджетов и шаблоне changelog (минимальная версия для host).

### Не входит

- Публикация в GitHub Packages и переключение с `file:` на `npm:` (задача **048**).
- Новые UI-фичи из DS-0.1.6 (например `AprilGradientSegmentedControl`) без отдельной постановки.
- Правка архивных `TASK.md` задач **057–058** (исторический текст).

## AGENT_MASTER_PROMPT compliance checklist

- [x] Прочитан `docs/AGENT_MASTER_PROMPT.md`, границы scope соблюдены.
- [x] DS-first: только bump зависимостей и доков, без обхода `@april/ui`.
- [x] Отчёт `REPORT.md` в этой папке по духу `docs/AGENT_REPORT_TEMPLATE.md`.
- [x] Проверки: `npm ci`, `npm run lint`, `npm run test`, `npm run build` из `frontend/`.

## Acceptance criteria

- `npm ci` в `frontend/` проходит без токена registry.
- Shell и `@april/profile-ui` собираются и проходят тесты на **0.1.6**.
- Документация «текущего минимума» для виджетов согласована с **≥ 0.1.6** там, где описан baseline host.

## Проверка

```bash
cd frontend && rm -rf node_modules packages/profile-ui/node_modules && npm ci
npm run lint
npm run test
npm run build
```

## Ожидаемый результат в REPORT

Список изменённых путей, хэш submodule, факт прогона команд, риски (breaking DS), follow-up при необходимости.
