# Задача 047 (фаза 6): финальная тестовая матрица и release-gate для `ProfilesWidget` варианта C

## Мета
- **ID / ветка:** `feature/task-047-phase-6-profiles-widget-test-matrix-and-release-gate`
- **Приоритет:** высокий
- **Связанные документы:** [`task_list.md`](../../task_list.md), [`tasks/045-phase-6-profiles-widget-contract-and-core-hardening/TASK.md`](../045-phase-6-profiles-widget-contract-and-core-hardening/TASK.md), [`tasks/046-phase-6-profiles-widget-provider-context-abort-observability-hardening/TASK.md`](../046-phase-6-profiles-widget-provider-context-abort-observability-hardening/TASK.md), [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md), [`docs/WIDGET_RELEASE_CHECKLIST.md`](../../docs/WIDGET_RELEASE_CHECKLIST.md), [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md)

## Цель
Сформировать и реализовать обязательный release-gate для `ProfilesWidget` после внедрения варианта C: закрыть тестовые пробелы (core/provider/e2e smoke), формально зафиксировать критерии приёмки и запретить выпуск без прохождения полной матрицы.

## Контекст для агента
- После 045/046 архитектура и поведение должны быть стабилизированы; эта задача закрывает качество и управляемость релиза.
- Исторически часть сценариев проходила «на доверии» без строгой тест-матрицы.
- Нужен воспроизводимый quality gate, исключающий «самодеятельность» при следующих изменениях.

## Входит в объём
- Тестовая матрица (документ + реализация):
  - Core unit: load, search debounce, filter/sort, pagination cursor, race/abort, CRUD transitions, error payload, observability hooks.
  - Provider integration: DTO mapping, status->normalized error, requestId extraction, auth/baseUrl/context wiring, signal behavior.
  - E2E smoke: CRUD happy path, 401/403/409 UX, API-first pagination/filter/search.
- Формализация release-gate:
  - обязательные команды и expected outputs;
  - минимальный набор ручного smoke;
  - критерии блокировки релиза.
- Документация:
  - обновление `docs/TESTING_STRATEGY.md`/`docs/WIDGET_RELEASE_CHECKLIST.md` (или связанных разделов);
  - обновление widget docs с «как проверить» для команды/интегратора.
- Контроль anti-pattern:
  - явный запрет пропуска сценариев abort/race/conflict;
  - явный запрет закрытия задачи без evidence (test logs/checklist).

## Не входит в объём
- Новый функционал UI/API.
- Полноценные cross-repo e2e сценарии в AprilHub (вне этого репозитория), кроме локально воспроизводимого smoke.
- Переписывание всей инфраструктуры CI (только нужные изменения под gate).

## Технические ограничения
- Все новые тесты должны быть deterministic и без флейков в стандартной среде проекта.
- Тесты не должны зависеть от внешних недетерминированных сервисов.
- Release-gate должен быть машинно и человеко проверяемым.
- Нельзя заменять отсутствующие тесты «описанием в тексте» без кода.

## Требования к дизайн-системе (для frontend-задачи)
- [x] Тесты отражают реальные DS-состояния (`loading/empty/error/busy`) для `ProfilesWidget`.
- [x] Проверяются доступные пользователю сообщения/CTA, а не внутренние implementation details.
- [x] Нет несогласованных текстов ошибок между тестами и UI.
- [x] Документация проверки UX согласована с DS-поведенческими паттернами.

## Критерии готовности (acceptance)
- [x] Покрыты и проходят тесты Core по ключевым сценариям варианта C.
- [x] Покрыты и проходят provider integration тесты по mapping/error/context/abort.
- [x] Есть воспроизводимый E2E smoke сценарий и он зелёный.
- [x] Release-gate зафиксирован в документации и применим командой без устных пояснений.
- [x] В docs есть явный список блокирующих критериев (что считается fail релиза).
- [x] В `REPORT.md` приложены фактические результаты прогонов и остаточные риски (если есть).

## Проверка (команды)
```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

## Результат в отчёте
Кратко: какая тест-матрица реализована, какие релизные гейты введены, какие сценарии были критичными, что считается остаточным риском и почему.

## Человекопонятная история в docs-site (обязательно)
- [x] Создана/обновлена страница `docs-site/docs/task-story-047-phase-6-profiles-widget-test-matrix-and-release-gate.md`.
- [x] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и статус.
- [x] Простым языком объяснено, какие проверки теперь обязательны перед выпуском и как это снижает риск регрессий.
- [x] В конце страницы даны ссылки на `tasks/047-phase-6-profiles-widget-test-matrix-and-release-gate/TASK.md`, `PLAN.md`, `REPORT.md`.
