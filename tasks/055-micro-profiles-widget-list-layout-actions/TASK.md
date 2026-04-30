# Задача 055 (micro): доработка списка/лейаута/действий `profiles-widget`

## Мета
- **ID / ветка:** `055-micro-profiles-widget-list-layout-actions` / `develop`
- **Приоритет:** обычный
- **Связанные файлы:** `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`, `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`, `docs/AGENT_MASTER_PROMPT.md`

## Цель
Исправить 4 UX-проблемы `profiles-widget`: увеличить размер initial page до 20, обеспечить реальное расширение правой карточки при collapse списка, растянуть поле `Profile document` по доступной высоте и сделать действие сохранения snapshot как иконку в общем ряду действий.

## Scope
### Входит в объём
- Изменить default `pageSize` на 20 для server-side list загрузки.
- Обновить layout левой колонки так, чтобы при collapse она действительно сужалась, а правая карточка получала освобождённую ширину.
- Исправить стили JSON `Textarea` в карточке профиля для заполнения высоты до низа панели.
- Перенести `Save snapshot as new version (+1)` из отдельной кнопки в ряд action-кнопок (иконка + tooltip).
- Обновить/добавить релевантный unit test для page size.
- Выполнить frontend-проверки и зафиксировать результат в `REPORT.md`.

### Не входит в объём
- Изменение API-контрактов, provider-логики, backend.
- Изменение остальных виджетов/страниц вне `ProfilesWidgetCore`.
- Деплой/CI workflow правки.

## AGENT_MASTER_PROMPT compliance checklist
- [x] Прочитан `docs/AGENT_MASTER_PROMPT.md`.
- [x] Проверены обязательные документы из master prompt (`README.md`, `task_list.md`, архитектурный контекст, шаблоны task/report).
- [x] Соблюдён DS-first подход (`CardListColumn` из `@april/ui` остаётся базовым компонентом списка).
- [x] Scope не расширяется вне постановки.
- [x] Выполнены релевантные проверки.
- [x] Подготовлен `REPORT.md`.

## Acceptance criteria
- [x] В `ProfilesWidgetCore` default page size установлен в `20`.
- [x] При `Collapse list` левая колонка визуально сужается, а правая колонка расширяется.
- [x] `Profile document` / `Updated document` заполняют доступную высоту правой панели (без `minHeight: 200` как ограничителя).
- [x] Действие `Save snapshot as new version (+1)` отображается иконкой в ряду action-кнопок.
- [x] `cd frontend && npm run lint -w @april/profile-ui` проходит.
- [x] `cd frontend && npm run test -w @april/profile-ui` проходит.
- [x] `cd frontend && npm run build -w @april/profile-ui` проходит.

## Проверка (команды)
```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## Ожидаемый результат в REPORT
Список изменённых файлов и сути правок по 4 кейсам, фактически выполненные команды проверки с результатом, ограничения/риски и follow-up при необходимости.
