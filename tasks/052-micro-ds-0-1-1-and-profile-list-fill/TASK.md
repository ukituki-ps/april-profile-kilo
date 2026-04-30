# Задача 052 (micro): обновление DS до 0.1.1 и `heightMode="fill"` в `ProfilesWidget`

## Мета
- **ID / ветка:** `052-micro-ds-0-1-1-and-profile-list-fill` / `develop`
- **Приоритет:** обычный
- **Связанные файлы:** `frontend/package.json`, `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`, `docs/AGENT_MASTER_PROMPT.md`

## Цель
Обновить версию дизайн-системы до `0.1.1` и применить новый проп `heightMode="fill"` для `CardListColumn` в `profiles-widget`.

## Scope
### Входит в объём
- Перевести зависимости `@april/ui` и `@april/tokens` на целевые версии DS через npm alias:
  - `@april/ui` -> `npm:@ukituki-ps/april-ui@^0.1.1`
  - `@april/tokens` -> `npm:@ukituki-ps/april-tokens@^0.1.0`
- Добавить `heightMode="fill"` в `CardListColumn` в `ProfilesWidgetCore`.
- Прогнать релевантные проверки frontend.
- Зафиксировать результат в `REPORT.md`.

### Не входит в объём
- Изменение архитектуры виджета или расширение функционала списка.
- Изменения backend/API.
- Деплой.

## AGENT_MASTER_PROMPT compliance checklist
- [x] Прочитан `docs/AGENT_MASTER_PROMPT.md`.
- [x] Соблюдён DS-first подход.
- [x] Scope не расширяется.
- [x] Выполнены релевантные проверки.
- [x] Подготовлен `REPORT.md`.

## Acceptance criteria
- [x] В `frontend/package.json` зависимости `@april/ui` и `@april/tokens` обновлены на npm alias к `@ukituki-ps/*` с целевыми версиями (`^0.1.1` / `^0.1.0`).
- [x] В `ProfilesWidgetCore` у `CardListColumn` установлен `heightMode="fill"`.
- [x] `npm run lint -w @april/profile-ui` проходит.
- [x] `npm run test -w @april/profile-ui` проходит.
- [x] `npm run build -w @april/profile-ui` проходит.

## Проверка (команды)
```bash
cd frontend && npm install
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## Ожидаемый результат в REPORT
Перечень изменённых файлов, результаты `install/lint/test/build`, риски и follow-up при необходимости.
