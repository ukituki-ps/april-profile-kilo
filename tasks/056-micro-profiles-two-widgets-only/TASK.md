# Micro-task: только `profiles-widget` и `entity-types-widget`

## Мета

- **id / ветка:** `056-micro-profiles-two-widgets-only` → `feature/056-micro-profiles-two-widgets-only` (по политике репо)
- **Приоритет:** P2 (упрощение поверхности пакета)
- **Файлы:** `frontend/packages/profile-ui/`, `frontend/src/App.tsx`, `docs/widgets/`, `docs/WIDGET_OBSERVABILITY_GUIDE.md`, `docs/FRONTEND_STRATEGY.md`, `docs-site/docs/widget-observability-guide.md`

## Цель

Убрать из `@april/profile-ui` и демо-shell все виджеты и сопутствующие экспорты/типы/доки, кроме **profiles-widget** (`ProfilesWidget` + Core/Api) и **entity-types-widget** (`EntityTypesWidget` + Core/Api).

## Scope

**Входит:** удаление компонентов и тестов `EntityProfileWidget`, `ProfileInstancesWidget`, `InstanceHistoryWidget`, `ConflictQueueWidget`, legacy-алиаса `ProfilesListWidget`; правка `index.ts`, `types.ts`, `observability.ts`, README пакета, каталога `docs/widgets/README.md`, демо `App.tsx` (добавить демо entity-types при отсутствии), observability-доков.

**Не входит:** изменения OpenAPI/бэкенда; массовая правка исторических `tasks/*` и task-stories в docs-site; breaking-change для внешних репозиториев (фиксируем в REPORT).

## AGENT_MASTER_PROMPT compliance checklist

- [x] Прочитан `docs/AGENT_MASTER_PROMPT.md`
- [x] DS-first: без новых кастомных UI-обходов DS
- [x] Scope не расширен
- [x] `TASK.md` / `REPORT.md` в `tasks/056-micro-profiles-two-widgets-only/`

## Acceptance criteria

- Пакет `@april/profile-ui` экспортирует только целевые виджеты профилей/типов и общие типы/провайдеры, нужные им.
- `npm run test -w @april/profile-ui` и `npm run lint -w @april/profile-ui` проходят.
- Демо-приложение `frontend` ведёт только на оставшиеся сценарии.

## Проверка

```bash
cd /home/ukituki/april-profile-1/frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui && npm run build -w @april/profile-ui
```

## Ожидаемый результат в REPORT

Список удалённых/изменённых файлов, результаты команд, риски (breaking для потребителей старых экспортов), follow-up.
