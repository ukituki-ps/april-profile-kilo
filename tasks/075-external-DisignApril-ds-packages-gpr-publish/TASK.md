# Задача 075 [DisignApril, внешнее исполнение] — публикация `@ukituki-ps/april-tokens` и `@ukituki-ps/april-ui` в GitHub Packages

## Мета
- **Репозиторий выполнения:** **[DisignApril](https://github.com/ukituki-ps/DisignApril)** (не april-profile). Публикация может дублироваться или переноситься в **[april-worker](https://github.com/ukituki-ps/april-worker)** workflow [`publish-april-ds-gpr.yml`](https://github.com/ukituki-ps/april-worker/blob/develop/.github/workflows/publish-april-ds-gpr.yml) — выбрать **один** каноничный процесс команды и зафиксировать в `REPORT.md`.
- **Постановка в april-profile:** якорь для планирования эпика **074**; merge PR выполняет владелец соответствующего репозитория.
- **Родитель:** [`tasks/074-phase-8-ds-gpr-and-mobile-shell-unification`](../074-phase-8-ds-gpr-and-mobile-shell-unification/) — **волна A**, шаг 1.
- **Блокирует:** [`076-april-profile-frontend-ds-gpr-consumption-remove-tgz`](../076-april-profile-frontend-ds-gpr-consumption-remove-tgz/), [`077-external-april-worker-hub-shell-ds-gpr-consumption`](../077-external-april-worker-hub-shell-ds-gpr-consumption/).

## Цель
В GitHub Packages (`npm.pkg.github.com`) доступны версии **`@ukituki-ps/april-tokens`** и **`@ukituki-ps/april-ui`**, совместимые с потреблением в april-profile/april-worker через npm-алиасы `@april/tokens` / `@april/ui` (semver **^0.1.9** или согласованный диапазон).

## Входит в объём
- Сборка `dist` для обоих пакетов; `npm publish` (или эквивалент) в GPR с корректным `repository` для привязки пакета к org.
- Документирование: какой PAT/secret (`GPR_PUBLISH_TOKEN` и т.д.), какой workflow запускает publish, как bump patch.

## Не входит в объём
- Изменение кода april-profile / april-worker (кроме ссылок в отчёте на соседние PR).
- Рефакторинг `AprilMobileShellBar` — задача **078**.

## Критерии готовности (acceptance)
- [ ] С `NODE_AUTH_TOKEN` (read:packages) команда `npm view @ukituki-ps/april-ui versions` и `npm view @ukituki-ps/april-tokens versions` показывают опубликованные версии в нужном диапазоне.
- [ ] В `REPORT.md` этой задачи (в april-profile) или в репозитории-исполнителе — ссылка на тег/commit релиза и инструкция повторной публикации.

## Проверка (команды)
```bash
# Локально, с токеном read:packages:
npm view @ukituki-ps/april-ui version
npm view @ukituki-ps/april-tokens version
```

## Человекопонятная история в docs-site
- [ ] Опционально: краткое дополнение к [`task-story-074-phase-8-ds-gpr-mobile-shell-unification`](../../docs-site/docs/task-story-074-phase-8-ds-gpr-mobile-shell-unification.md) после публикации.

## Результат в отчёте
Завести [`REPORT.md`](./REPORT.md) в этой папке после выполнения во внешнем репо: ссылки на PR, опубликованные версии, выбранный каноничный publish-путь.
