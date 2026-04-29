---
sidebar_position: 52
---

# 042 — Production-first архитектурный baseline для `ProfilesWidget`

## Какая была проблема

После выделения `ProfilesWidget` (задача 041) сценарий всё ещё оставался ближе к демо-модели: список фактически задавался входным набором id, а не полноценным server-side list потоком. Это создавало риск, что в следующих задачах появятся «временные» обходы вместо правильной продуктовой архитектуры.

## Что сделали

- Зафиксировали обязательный baseline архитектуры `ProfilesWidget`: `Core + ApiWidget + Facade`.
- Формально разделили ответственность:
  - `ProfilesWidgetCore` — только UI и state machine;
  - `ProfilesApiWidget` — wiring с API/provider;
  - `ProfilesWidget` — публичный фасад для host-интеграции.
- Зафиксировали обязательный контракт data-provider (`list/get/create/update/remove`) и preconditions для задач 043/044.
- Добавили явный список запрещённых anti-patterns:
  - нельзя возвращаться к `entityIds` как source of truth;
  - нельзя смешивать transport/env и UI `Core`;
  - нельзя имитировать server-side пагинацию полной клиентской предзагрузкой.
- Обновили контрактную документацию (`docs/WIDGET_CONTRACTS.md` + синхронная копия в docs-site), карточку виджета и README пакета.

## Что это даёт команде и пользователям

- Следующие задачи (043/044) теперь выполняются по чётким gate-условиям, без «ускоренных» вариантов реализации.
- У команды есть единый договор по границам слоёв и ответственности, что снижает риск регрессий и архитектурного долга.
- Интеграции виджета становятся предсказуемыми: host получает стабильный facade-контракт, а data flow стандартизируется как production-first.

## Как проверить без чтения кода

1. Открыть `docs/WIDGET_CONTRACTS.md` и найти раздел `ProfilesWidget production-first baseline (Phase 6 / task 042)`.
2. Проверить, что в разделе есть:
   - схема ответственности `Core/ApiWidget/Facade`,
   - provider-контракт,
   - список anti-patterns,
   - preconditions для старта 043/044.
3. Открыть `docs/widgets/profile/profiles-widget.md` и убедиться, что там отражён baseline и ссылки на артефакты 042/043/044.
4. Открыть `frontend/packages/profile-ui/README.md` и убедиться, что `ProfilesWidget` описан как production-first контракт (без `entityIds` в новой модели).

## Границы и follow-up

- В рамках 042 не реализовывались новые backend endpoints и не менялся generated SDK (это задача 043).
- В рамках 042 не выполнялся кодовый рефактор компонента `ProfilesWidget` в `Core + ApiWidget` (это задача 044).
- Hub e2e и release-gate проверки выносятся в последующие интеграционные задачи после 044.

## Ссылки на артефакты

- `tasks/042-phase-6-profiles-widget-production-architecture/TASK.md`
- `tasks/042-phase-6-profiles-widget-production-architecture/PLAN.md`
- `tasks/042-phase-6-profiles-widget-production-architecture/REPORT.md`
