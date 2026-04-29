# План: 050 — документация и docs-site

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** выполнен (см. [`REPORT.md`](./REPORT.md))

## Порядок работ (шаги)

1. После merge **048**/**049**: пройтись по `docs/guides/DESIGN_SYSTEM.md` и заменить описание «только submodule» на «registry + опционально submodule».
2. Обновить `TESTING_STRATEGY.md` (раздел про frontend и `ds:prepare`).
3. Добавить в `DEPLOYMENT_STRATEGY.md` или README фронта: как передать токен на CI и локально (`~/.npmrc` не в git).
4. Написать `task-story-048-phase-7-ds-npm-registry-consumption.md` простым языком; обновить overview.
5. Закрыть цепочку: `REPORT.md` в 048, 049, 050 + сообщение владельцу эпика 049.

## Риски и откат

- **Риск:** документация расходится с Hub → **Митигация:** одна ссылка «источник истины» на `docs/guides/DESIGN_SYSTEM.md` в april-worker после `049-02`.

## Проверка после выполнения

`make docs-build` зелёный; ссылки в overview не битые.
