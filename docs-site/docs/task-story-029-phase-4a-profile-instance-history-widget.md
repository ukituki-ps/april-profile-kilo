---
sidebar_position: 39
---

# 029 — `InstanceHistoryWidget`: история версий экземпляра и diff

## Какая была проблема

После реализации списка экземпляров профиля не хватало прозрачного аудита изменений: в UI нельзя было открыть историю версий конкретного экземпляра и быстро понять, что именно изменилось между версиями.

## Что сделали

- Добавили в `@april/profile-ui` новый `InstanceHistoryWidget`.
- Реализовали таймлайн append-only версий экземпляра с базовыми метаданными (`version`, `created_at`, `source`, `actor`).
- Добавили просмотр снапшота выбранной версии и diff JSON-документа:
  - с предыдущей версией;
  - с текущей версией.
- Зафиксировали read-only поведение: при текущем API restore недоступен, в UI есть явный баннер с этим ограничением.
- Добавили demo-страницу `/instance-history-widget-demo` в локальном shell.
- Добавили Vitest/RTL + MSW тесты на timeline/diff и переключение compare-режима.

## Что это даёт команде

- Появился готовый встраиваемый блок для прозрачного аудита изменений экземпляра в AprilHub.
- Интеграция в host становится проще: один виджет покрывает сценарии "посмотреть историю" и "понять diff".
- Ограничение контракта (нет restore) явно задокументировано и не маскируется UX-ом.

## Как проверить без чтения кода

1. Выполнить `cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui && npm run build -w @april/profile-ui`.
2. Запустить `cd frontend && npm run dev`, открыть `/instance-history-widget-demo`.
3. Передать `VITE_PROFILE_API_BASE_URL`, `VITE_PROFILE_ACCESS_TOKEN`, `VITE_PROFILE_HISTORY_DEMO_ENTITY_ID`.
4. Проверить: таймлайн версий, выбор версии, diff с previous/current и баннер про read-only режим.

## Границы (что не делали)

- Не добавляли backend endpoint restore и не меняли append-only модель хранения.
- Не добавляли server-side pagination для истории версий.
- Не выполняли host/e2e интеграцию в AprilHub (это задача `030`).

## Ссылки на артефакты

- `tasks/029-phase-4a-profile-instance-history-widget/TASK.md`
- `tasks/029-phase-4a-profile-instance-history-widget/PLAN.md`
- `tasks/029-phase-4a-profile-instance-history-widget/REPORT.md`
