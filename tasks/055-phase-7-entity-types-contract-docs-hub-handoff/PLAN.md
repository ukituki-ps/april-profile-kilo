# План: контракты embed, docs-site, handoff Hub/BFF (055)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-30
- **Статус плана:** согласован с выполнением

## Исходные допущения

- Реализация виджета завершена в задаче **054**; OpenAPI — в **053**; модель данных — в **052**.
- Расширение `WIDGET_CONTRACTS` — только **additive** (§9), без изменения §1–§8.

## Порядок работ

1. Добавить §9 в `docs/WIDGET_CONTRACTS.md` и синхронную копию `docs-site/docs/widget-contracts.md`.
2. Расширить `WIDGET_INTEGRATION_CHECKLIST` (+ docs-site копия) блоком для `entity-types-admin` / `entity-types-widget`.
3. Довести `docs/integration/entity-types-widget-hub-handoff.md` (префикс BFF, таблица endpoints, OIDC, пример `hostContext`, таймауты).
4. Создать три story-страницы docs-site для 052, 053, 054; обновить `task-stories-overview.md`.
5. Согласовать карточку виджета (`entity-types-widget.md`) со ссылкой на telemetry §9.
6. `REPORT.md`, обновление `task_list.md`.

## Проверка

```bash
cd docs-site && npm ci && npm run build
```

## Риски

- `onBrokenLinks: throw` в docs-site: внешние ссылки должны быть валидны; внутренние — существующие маршруты.
