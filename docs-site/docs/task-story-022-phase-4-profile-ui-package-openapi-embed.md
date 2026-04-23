---
sidebar_position: 36
---

# 022 — Пакет `@april/profile-ui` и встраиваемый компонент профиля

## Что поменялось

В репозитории появился workspace-пакет `@april/profile-ui` с минимальным публичным API для встраивания профиля в host-приложения. Внутри пакета есть:

- сгенерированный из `openapi/openapi.yaml` HTTP-клиент;
- компонент `EntityProfileWidget` для чтения/сохранения профиля;
- явный callback `onSaveSuccess`, чтобы host мог переключать сценарий (например, на следующую карточку);
- unit-тесты (Vitest + RTL + MSW) на ключевое поведение сохранения.

Также пакет подключён в `frontend` shell: добавлен demo-роут `/profile-widget-demo`, где видно, как host получает событие после успешного сохранения.

## Зачем это нужно

Это шаг к гибридной модели интеграции UI из `FRONTEND_STRATEGY`: у AprilHub появляется переиспользуемый и типизированный виджет вместо копипасты экранов. OpenAPI остаётся единым источником для API-вызовов, а host получает контролируемую точку интеграции через props/events.

## Границы задачи

**Сделано:** пакет, клиент из OpenAPI, встраиваемый компонент, `onSaveSuccess`, тесты, документация и локальный demo.

**Не входило:** хостинг виджета в AprilHub и e2e smoke на стороне Hub (это задача 023), публикация npm в production registry.

## Как проверить без чтения кода

1. В корне выполнить `cd frontend && npm run lint && npm run test && npm run build`.
2. Запустить `cd frontend && npm run dev`, открыть `/profile-widget-demo`.
3. Подставить dev-значения `VITE_PROFILE_API_BASE_URL`, `VITE_PROFILE_ACCESS_TOKEN`, `VITE_PROFILE_DEMO_ENTITY_ID`.
4. Сохранить JSON в виджете и убедиться, что появляется сообщение с версией из `onSaveSuccess`.

## Официальные артефакты

- Постановка: `tasks/022-phase-4-profile-ui-package-openapi-embed/TASK.md`
- План: `tasks/022-phase-4-profile-ui-package-openapi-embed/PLAN.md`
- Отчёт: `tasks/022-phase-4-profile-ui-package-openapi-embed/REPORT.md`
