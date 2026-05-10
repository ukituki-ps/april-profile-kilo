# Задача 079 [april-profile] — `profile-ui` + shell: стратегия A и ADR-0006 для mobile chrome

## Мета
- **Репозиторий выполнения:** **april-profile** (этот репозиторий). Основной код: **`frontend/packages/profile-ui`**, демо/shell — **`frontend/src`**.
- **Родитель:** [`tasks/074-phase-8-ds-gpr-and-mobile-shell-unification`](../074-phase-8-ds-gpr-and-mobile-shell-unification/) — **волна B**, шаг 2.
- **Зависит от:** [`078-external-DisignApril-april-mobile-shell-bar-refactor`](../078-external-DisignApril-april-mobile-shell-bar-refactor/) (или согласованная базовая версия UI из GPR без изменений контракта — зафиксировать в `PLAN.md` при отклонении).
- **Связанные документы:** [`docs/adr/0006-mobile-chrome-layers-widget-host.md`](../../docs/adr/0006-mobile-chrome-layers-widget-host.md); [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) §8.6; [`docs/WIDGET_INTEGRATION_CHECKLIST.md`](../../docs/WIDGET_INTEGRATION_CHECKLIST.md); карточки [`docs/widgets/profile/`](../../docs/widgets/profile/); задачи **072–073**.

## Цель
Выровнять **виджеты и shell** с ADR-0006: **один активный контекст** нижней панели на ветку, корректный порядок **«Назад»** (sheet/overlay до intent host), отсутствие «двойного низа»; использовать опубликованные пропы DS (`hideMobileShellBar`, `leading`, `onRequestCloseMobileOverlay` и т.д. по факту **078**).

## Входит в объём
- `ProfilesWidget` / `ProfilesWidgetProfileDetailCore`, при необходимости **`entity-types-widget`** и общие паттерны mobile.
- Unit/integration тесты; обновление каноничных docs и `docs-site` зеркал.

## Не входит в объём
- Изменения **april-worker** layout/e2e — задача **080**.
- Публикация DS — **078**.

## Критерии готовности (acceptance)
- [ ] `cd frontend && npm ci && npm run test && npm run build` (с `NODE_AUTH_TOKEN` для GPR).
- [x] Доки и ADR-0006 согласованы с поведением (§8.6, чеклист, карточки; вложенный лист версий — без параллельной панели детали); чеклист интеграции обновлён.

## Проверка (команды)
```bash
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## Человекопонятная история в docs-site
- [x] Связано с [`task-story-074`](../../docs-site/docs/task-story-074-phase-8-ds-gpr-mobile-shell-unification.md) (пункт про **079**).

## Результат в отчёте
[`REPORT.md`](./REPORT.md): PR april-profile, краткий список сценариев и тестов.
