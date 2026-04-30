# Micro-task: `profiles-widget` textarea wrapper height 100%

## Мета
- **ID / ветка:** `20260430-micro-profiles-widget-textarea-wrapper-height` / `develop`
- **Приоритет:** обычный
- **Связанные файлы:** `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`, `docs/AGENT_MASTER_PROMPT.md`

## Цель
Добавить `height: 100%` для обёрток `mantine-Input-wrapper` и `mantine-Textarea-wrapper` в редакторе JSON внутри `profiles-widget`, чтобы поле занимало всю доступную высоту панели.

## Scope
### Входит в объём
- Точечная правка стилей `Textarea` в `ProfilesWidgetCore` для двух режимов (`Profile document`, `Updated document`).
- Проверка, что изменения не ломают сборку/тесты пакета.
- Обновление отчёта выполнения.

### Не входит в объём
- Изменения API/provider/backend.
- Изменение остальных виджетов и дизайн-системы.
- Деплой и изменения CI.

## AGENT_MASTER_PROMPT compliance checklist
- [x] Прочитан `docs/AGENT_MASTER_PROMPT.md`.
- [x] Проверены обязательные документы из master prompt (`README.md`, `task_list.md`, архитектурный контекст, шаблоны task/report).
- [x] Соблюдён DS-first (используется существующий `Textarea`/`CardListColumn`, без кастомного обхода DS).
- [x] Scope не расширяется за рамки постановки.
- [x] Выполнены релевантные проверки.
- [x] Подготовлен `REPORT.md`.

## Acceptance criteria
- [x] Для `Textarea` в правой панели добавлен `height: 100%` на `mantine-Input-wrapper`.
- [x] Для `Textarea` в правой панели добавлен `height: 100%` на `mantine-Textarea-wrapper`.
- [x] `npm run test -w @april/profile-ui` проходит.
- [x] `npm run build -w @april/profile-ui` проходит.

## Проверка (команды)
```bash
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## Ожидаемый результат в REPORT
Фиксация изменённых файлов и сути правки, фактически выполненные команды проверки с результатом, риски/ограничения и follow-up (если потребуется).
