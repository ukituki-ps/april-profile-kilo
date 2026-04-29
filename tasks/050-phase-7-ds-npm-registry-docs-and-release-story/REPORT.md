## 1) Итого

- Статус: **выполнено**
- Задача: 050 — документация DS registry, bump/регрессия, docs-site для эпика 048–050
- Ветка: `feature/050-phase-7-ds-npm-registry-docs-and-release-story` (наследует коммиты 048/049 до merge в `develop`)
- Коммиты: см. `git log develop..HEAD`
- PR: не создавался из среды агента

## 2) Что сделано

- **[docs]** Переписан [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md): submodule vs vendored tarball’ы, GitHub Packages, чеклист bump/регрессии, ссылка на эпик april-worker `049`.
- **[docs]** Обновлены [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md) (§11, §12) и зеркало [`docs-site/docs/frontend-strategy.md`](../../docs-site/docs/frontend-strategy.md).
- **[docs]** В [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) (§3a) добавлены строка про **`APRIL_NPM_READ_TOKEN`** / **`NODE_AUTH_TOKEN`** и примечание для локального `frontend/`.
- **[docs]** [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md) — уточнён способ доставки DS (submodule + tarball/registry).
- **[docs-site]** Новая страница [`docs-site/docs/task-story-048-phase-7-ds-npm-registry-consumption.md`](../../docs-site/docs/task-story-048-phase-7-ds-npm-registry-consumption.md); обновлён [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md).
- **[tasks]** Актуализирован [`tasks/048-phase-7-ds-npm-registry-deps-lock-npmrc/REPORT.md`](../048-phase-7-ds-npm-registry-deps-lock-npmrc/REPORT.md) (раздел «Что осталось» после 049/050).

## 3) Изменённые файлы

- `docs/guides/DESIGN_SYSTEM.md`
- `docs/FRONTEND_STRATEGY.md`
- `docs/DEPLOYMENT_STRATEGY.md`
- `docs/AGENT_ARCHITECTURE_CONTEXT.md`
- `docs-site/docs/frontend-strategy.md`
- `docs-site/docs/task-story-048-phase-7-ds-npm-registry-consumption.md`
- `docs-site/docs/task-stories-overview.md`
- `README.md`
- `task_list.md`
- `tasks/048-phase-7-ds-npm-registry-deps-lock-npmrc/REPORT.md`
- `tasks/050-phase-7-ds-npm-registry-docs-and-release-story/REPORT.md`
- `tasks/050-phase-7-ds-npm-registry-docs-and-release-story/TASK.md`
- `tasks/050-phase-7-ds-npm-registry-docs-and-release-story/PLAN.md`

## 4) Миграции и данные

- Нет

## 5) Проверка качества

- `make docs-build`: **ok** (после правки `docs/guides/DESIGN_SYSTEM.md`: убрана markdown-ссылка `../DEPLOYMENT_STRATEGY.md` — Docusaurus для плагина `guides/` не резолвит пути к файлам вне `docs/guides/`, сборка падала с broken link).
- Линтер кода: не применялся (только документация)

Команды:

```bash
make docs-build
```

## 6) Деплой

- Не выполнялся

## 7) Риски и ограничения

- **ADR в april-worker** по дистрибуции DS в каталоге `docs/architecture/` может появиться позже задачи `049-01`; в истории docs-site дана ссылка на каталог `develop` как ожидаемое место.
- **Ссылки из `docs/guides/`** на файлы в `docs/` (не в подкаталоге `guides/`) в markdown нельзя задавать относительным `../…` — ломается `docusaurus build` (`onBrokenLinks: throw`). Указывайте путь текстом или вынесите дублирующую страницу в тот же плагин.

## 8) Уведомление владельцу эпика 049 (april-worker)

Зафиксировано в [`docs-site/docs/task-story-048-phase-7-ds-npm-registry-consumption.md`](../../docs-site/docs/task-story-048-phase-7-ds-npm-registry-consumption.md) (раздел в конце страницы): текущие артефакты AprilProfile — vendored **0.1.0**, CI готов к `@april/*` из GitHub Packages; ожидаются опубликованные версии для выравнивания с `hub-shell`.

## 9) Что осталось

- [ ] После публикации `@april/*` в registry: обновить `frontend/package.json` / lock, удалить `vendor/ds-packs`, раскомментировать `frontend/.npmrc`, прогнать CI.
