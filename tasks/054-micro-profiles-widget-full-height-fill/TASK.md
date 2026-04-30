# Задача 054 (micro): полно-высотный режим списка в `ProfilesWidget`

## Мета
- **ID / ветка:** `054-micro-profiles-widget-full-height-fill` / `develop`
- **Приоритет:** обычный
- **Связанные файлы:** `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`, `frontend/src/App.tsx`, `docs/AGENT_MASTER_PROMPT.md`

## Цель
Убрать зависимость списка профилей от фиксированной высоты (`520px`) через переход на `heightMode="fill"` и обеспечить корректную цепочку высот/скролла в embed-демо `ProfilesWidget`.

## Scope
### Входит в объём
- Подтвердить использование `heightMode="fill"` в `CardListColumn` внутри `ProfilesWidgetCore`.
- Привести контейнеры `ProfilesWidgetDemoPage` к полно-высотному режиму (`height`, `min-height: 0`, `overflow`) для корректного вычисления `height: 100%`.
- Убедиться, что скролл остается внутри списка, а не у всей страницы демо.
- Выполнить релевантные проверки frontend.

### Не входит в объём
- Изменение API/провайдера/бизнес-логики CRUD.
- Рефакторинг остальных demo-страниц вне `ProfilesWidget`.
- Изменения backend, deploy и CI workflow.

## AGENT_MASTER_PROMPT compliance checklist
- [x] Прочитан `docs/AGENT_MASTER_PROMPT.md`.
- [x] Проверены обязательные документы из master prompt (`README.md`, `task_list.md`, архитектурный контекст, шаблоны task/report).
- [x] Соблюдён DS-first подход (использован `CardListColumn` из `@april/ui`).
- [x] Scope не расширяется вне постановки.
- [x] Выполнены релевантные проверки.
- [x] Подготовлен `REPORT.md`.

## Acceptance criteria
- [x] В `ProfilesWidgetCore` `CardListColumn` работает с `heightMode="fill"`.
- [x] В chain контейнеров для демо списка есть полно-высотный контекст (`100dvh`, `minHeight: 0`, `overflow: hidden`).
- [x] Нет зависимости от фиксированной высоты списка `520px` в `ProfilesWidget`-слое.
- [x] Скролл остается внутренним для списка, layout demo-страницы не ломается.

## Проверка (команды)
```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
cd frontend && npm run build
```

## Ожидаемый результат в REPORT
Список изменённых файлов и сути правок, результаты проверок (lint/test/build), риски/ограничения и follow-up (если потребуется).
