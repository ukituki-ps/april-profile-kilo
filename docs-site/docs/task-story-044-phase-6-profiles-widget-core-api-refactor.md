---
sidebar_position: 54
---

# 044 — Рефактор `ProfilesWidget` в `Core + ApiWidget`

## Какая была проблема

После 043 у нас уже был правильный server-side API контракт, но сам frontend-виджет оставался с legacy-моделью и смешивал UI-логику с API-деталями. Это мешало поддержке и оставляло риск возврата к demo-first подходу.

## Что сделали

- Разделили `ProfilesWidget` на три слоя:
  - `ProfilesWidgetCore` — UI/state machine;
  - `ProfilesApiWidget` — OpenAPI adapter/provider wiring;
  - `ProfilesWidget` — публичный фасад.
- Вынесли сетевые вызовы в provider-контракт (`ProfilesDataProvider`) и OpenAPI-реализацию (`createOpenApiProfilesProvider`).
- Убрали `entityIds` из публичного props-контракта виджета.
- Перевели список на server-side `listEntityProfiles` (search/filter/cursor pagination).
- Сохранили backward compatibility по импорту: `ProfilesListWidget` оставлен alias, но больше не управляет отдельным legacy data flow.
- Обновили демо-страницу: больше нет demo-only sourcing списка через env со списком id.
- Переписали тесты:
  - unit для `ProfilesWidgetCore` через mock provider;
  - integration через `ProfilesWidget` + MSW на API-контракт.

## Что это даёт команде и пользователям

- Виджет действительно production-first: источник данных — API, а не подготовленный список id.
- Код поддерживать проще: UI и transport разделены.
- Проще масштабировать: server-side пагинация/фильтры работают по реальному контракту.

## Как проверить без чтения кода

1. Прогнать quality gate:
   - `cd frontend && npm run lint && npm run test && npm run build`.
2. Открыть `/profiles-widget-demo` и проверить:
   - загрузку списка;
   - поиск/фильтр;
   - дозагрузку (`Load more`);
   - create/update/delete.
3. Убедиться, что ошибки API отображаются безопасными сообщениями без raw backend текста.

## Границы и follow-up

- В рамках 044 не менялась backend бизнес-логика и IAM-модель.
- Hub e2e и релизные интеграционные гейты остаются отдельным follow-up.

## Ссылки на артефакты

- `tasks/044-phase-6-profiles-widget-core-api-refactor/TASK.md`
- `tasks/044-phase-6-profiles-widget-core-api-refactor/PLAN.md`
- `tasks/044-phase-6-profiles-widget-core-api-refactor/REPORT.md`
