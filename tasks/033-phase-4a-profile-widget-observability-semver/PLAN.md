# План: Фаза 4a.5 — observability-события виджетов и semver readiness

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован

## Исходные допущения

- Контур корреляции уже задан через `HostContext.telemetry.requestId`; опционально расширяем `correlationId` без ломки типов.
- Виджеты не подключают собственный стек Loki/Prometheus; только колбэк для host.
- Пакет `@april/profile-ui` публикуется как semver npm; bump **0.2.0** для новых optional props и экспортов.

## Порядок работ (шаги)

1. Ввести модуль `observability.ts` (типы событий, `buildTelemetryIds`, `emitProfileWidgetTelemetry`).
2. Подключить `onObservability` и эмиссию во все целевые виджеты 4a + `EntityProfileWidget`.
3. Расширить документацию (`WIDGET_OBSERVABILITY_GUIDE`, `VERSIONING_AND_COMPATIBILITY`, `WIDGET_CONTRACTS`) и зеркала docs-site.
4. Тесты: unit на ids, интеграционный сценарий на `EntityProfileWidget`; включить workspace-тесты в общий `npm run test` frontend.
5. Человекопонятная страница docs-site, `REPORT.md`, обновление `task_list.md`.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| `frontend/packages/profile-ui` | События, типы, тесты, README, версия 0.2.0 |
| `frontend/package.json` | `npm run test` + workspace `@april/profile-ui` |
| Документация `docs/` + `docs-site/` | Observability, semver, контракты, история задачи 033 |

## Риски и откат

- **Риск:** частые вызовы колбэка на host → **Митигация:** host сам решает sampling/агрегацию; виджет не логирует в stdout.
- **Риск:** двойной `view_loaded` после resolve/merge → **Митигация:** повторная загрузка списка конфликтов без повторной эмиссии `view_loaded`.
- Откат: revert коммита; версию npm при необходимости вернуть через новый patch.

## Проверка после выполнения

- `make docs-build`
- `cd frontend && npm ci && npm run lint && npm run test && npm run build`

## Примечания

- Связанная Hub-задача: [`034`](../034-phase-4a-hub-widget-release-gates-smoke/TASK.md).
