# Отчёт: задача 075 — публикация `@ukituki-ps/april-tokens` и `@ukituki-ps/april-ui` в GitHub Packages

## 1) Итого
- Статус: ✅ (исполнение по публикации ведётся в **DisignApril**; отчёт фиксирует факт и ссылки для эпика **074**)
- Репозиторий-исполнитель: [DisignApril](https://github.com/ukituki-ps/DisignApril)
- Связанный трекинг DS: [DS-005](https://github.com/ukituki-ps/DisignApril/tree/main/tasks/ds-005-registry-npm-publish), [DS-014](https://github.com/ukituki-ps/DisignApril/tree/main/tasks/ds-014-april-profile-1-issue-75) (`REPORT.md`)

## 2) Каноничный путь публикации
- **Канон:** workflow в DisignApril **`.github/workflows/publish-april-packages.yml`** (имя в UI: *Publish @april packages*), ручной `workflow_dispatch`, вариант `packages`: `tokens` | `ui` | `both`.
- **Перед запуском:** версии в `packages/tokens/package.json` и `packages/ui/package.json` должны быть согласованно подняты на целевой ref; затем lint → typecheck → build → publish в `https://npm.pkg.github.com`.
- **Документация:** [DisignApril/docs/PUBLISHING.md](https://github.com/ukituki-ps/DisignApril/blob/main/docs/PUBLISHING.md) — scope `@ukituki-ps`, алиасы `@april/*` у потребителей, `NODE_AUTH_TOKEN` / `.npmrc`.

## 3) Ссылки на выполненную работу (DS-005)
- Отчёт DS-005: [tasks/ds-005-registry-npm-publish/REPORT.md](https://github.com/ukituki-ps/DisignApril/blob/main/tasks/ds-005-registry-npm-publish/REPORT.md)
- PR (пример цепочки внедрения): [#15](https://github.com/ukituki-ps/DisignApril/pull/15) … [#18](https://github.com/ukituki-ps/DisignApril/pull/18)
- Успешный прогон публикации (зафиксировано в DS-005): [Actions run 25134476568](https://github.com/ukituki-ps/DisignApril/actions/runs/25134476568)

## 4) Версии и приёмка
- В исходниках DisignApril на момент отчёта: **`@ukituki-ps/april-tokens@0.1.9`**, **`@ukituki-ps/april-ui@0.1.9`** (`packages/*/package.json`).
- Приёмка из [`TASK.md`](./TASK.md): с токеном `read:packages` и `.npmrc` на GitHub Packages выполнить:
  ```bash
  npm view @ukituki-ps/april-tokens versions --json
  npm view @ukituki-ps/april-ui versions --json
  ```

## 5) Дублирующий publish-путь (april-worker) — риск
- В репозитории [april-worker](https://github.com/ukituki-ps/april-worker) присутствует **`.github/workflows/publish-april-ds-gpr.yml`**: сборка из submodule `design-system/DisignApril`, при publish **перезаписывает** `repository` в `package.json` на `april-worker`, для UI подменяет зависимость токенов на жёсткое **`^0.1.0`** в inline-скрипте.
- Это **не** эквивалент каноничному манифесту DisignApril и может давать расхождение метаданных и semver. Для эпика **074** зафиксировано: **канон — DisignApril**; путь через worker — либо вывести из эксплуатации (deprecated в комментарии workflow + README), либо привести к той же политике версий/`repository`, что в DisignApril (отдельное согласование команды).

## 6) Что не входило в 075 (следующие шаги эпика)
- **076** — `april-profile` frontend: потребление из GPR, удаление `vendor/ds-packs/*.tgz`.
- **077** — `april-worker` / `hub-shell`: потребление из GPR, адаптация CI.

## 7) Примечание про нумерацию «75»
- GitHub **issue/PR #75** в `april-profile` — отдельный merged PR про документацию задачи 028; к **075** эпика **074** не относится.
