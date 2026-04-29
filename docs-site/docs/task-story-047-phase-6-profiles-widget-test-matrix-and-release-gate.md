---
sidebar_position: 247
---

# 047 - тестовая матрица и release-gate для ProfilesWidget

## Проблема

После архитектурных доработок 045/046 появилась рискованная зона: релиз мог пройти без полного и одинакового для всех набора проверок. Это приводило к "локальным трактовкам", когда часть сценариев считалась необязательной.

## Что сделали

1. Добавили provider integration tests для `openapiProfilesProvider`:
   - DTO mapping;
   - status -> normalized error;
   - extraction `request_id`;
   - context token/baseUrl wiring;
   - `AbortSignal` propagation.
2. Зафиксировали release-blocking матрицу для `ProfilesWidget` в `docs/TESTING_STRATEGY.md`:
   - обязательные Core/provider/smoke проверки;
   - обязательные команды;
   - blocking fail conditions.
3. Усилили `docs/WIDGET_RELEASE_CHECKLIST.md` и docs-site копию:
   - добавили обязательный gate variant C;
   - добавили требование evidence в `REPORT.md`;
   - добавили проверку transport observability (`list_*`/`details_*`).
4. Обновили widget docs с явным разделом release gate variant C.
5. Прогнали полный gate (frontend + backend тестовые команды).

## Что это дает

- Релиз `ProfilesWidget` теперь блокируется формальными критериями, а не "договоренностью в чате".
- Команда получает единый и воспроизводимый quality gate.
- Уменьшается шанс пропустить regressions в abort/race/conflict сценариях.

## Как проверить без чтения кода

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

Ожидаемый результат: все команды проходят.

## Границы задачи

Сделано:

- тестовая матрица + release-gate + provider integration tests + docs синхронизация.

Не делалось:

- новый продуктовый функционал виджетов;
- cross-repo e2e в AprilHub beyond local smoke scope.

## Артефакты

- [`tasks/047-phase-6-profiles-widget-test-matrix-and-release-gate/TASK.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/047-phase-6-profiles-widget-test-matrix-and-release-gate/TASK.md)
- [`tasks/047-phase-6-profiles-widget-test-matrix-and-release-gate/PLAN.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/047-phase-6-profiles-widget-test-matrix-and-release-gate/PLAN.md)
- [`tasks/047-phase-6-profiles-widget-test-matrix-and-release-gate/REPORT.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/047-phase-6-profiles-widget-test-matrix-and-release-gate/REPORT.md)
