# Задача: Фаза 4.2 (часть 2, AprilProfile) — пакет UI, клиент из OpenAPI, встраиваемый компонент и `onSaveSuccess`

## Мета
- **ID / ветка:** (например `feat/phase-4-profile-ui-package`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4**, **4.2 Продукт (BFF + UI)**, блок **«Затем»** (пакет `@april/profile-ui` или согласованное имя; генерация клиента из OpenAPI; встраиваемый компонент с `onSaveSuccess` по FRONTEND_STRATEGY; e2e smoke — smoke вынесен в [`023`](../023-phase-4-aprilhub-widget-host-e2e-smoke/) при необходимости Host-driven).
- **Связанные подзадачи:** **зависит от** [`003-hybrid-ui-integration-governance`](../003-hybrid-ui-integration-governance/) (контракты виджетов), [`010-phase-2-entity-types-openapi`](../010-phase-2-entity-types-openapi/) и последующих фаз 2 для стабильного API; **практически после** [`021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`](../021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/) для проверки через BFF. Связь с [`020`](../020-phase-4-profile-contract-behind-hub-bff/) — тот же контракт путей/tenant.
- **Связанные документы:** [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md), [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`docs/VERSIONING_AND_COMPATIBILITY.md`](../../docs/VERSIONING_AND_COMPATIBILITY.md), OpenAPI

## Цель
В монорепозитории AprilProfile появляется **публикуемый UI-пакет** (имя по согласованию, например `@april/profile-ui`) с **сгенерированным из OpenAPI** HTTP-клиентом и **встраиваемым** компонентом (минимум один сценарий: карточка/форма профиля), поддерживающим колбэк **`onSaveSuccess`** в духе [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md), готовый к подключению из AprilHub.

## Контекст для агента
- Блок **«Затем»** подраздела **4.2** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Дизайн-система: **`@april/tokens`**, **`@april/ui`** — см. [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md).

## Входит в объём
- Структура пакета (workspace/pnpm или принятый в репо способ), **semver** и экспорт публичного API пакета.
- **Генерация клиента** из `openapi/openapi.yaml` (инструмент — как уже принят или добавить с минимальным скриптом `package.json`).
- **Встраиваемый** React-компонент с явным контрактом props/events (включая **`onSaveSuccess`**).
- **Vitest/RTL** минимум на поведение компонента (MSW по [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)).
- Обновление **frontend/** shell при необходимости для локальной демонстрации пакета.

## Не входит в объём
- Встраивание в **Host AprilHub** и Playwright e2e на стороне Hub — задача [`023-phase-4-aprilhub-widget-host-e2e-smoke`](../023-phase-4-aprilhub-widget-host-e2e-smoke/) **[AprilHub]** (или совместный e2e-репозиторий по практике Hub).
- Module Federation и прод-релиз npm — только подготовка; публикация может быть follow-up по политике org.

## Заглушки и внешние зависимости
- **До готовности BFF:** базовый URL для MSW/story — **mock** REST по OpenAPI; переключение на dev — через env пакета/demo app.
- **Заглушка OIDC:** в демо — без реального логина или с фиктивным токеном (только dev), не в прод-артефактах.

## Технические ограничения
- React + TS + Vite; Mantine + April DS — как в репо.
- OpenAPI — **единый источник** для публичного REST; при смене контракта — регенерация клиента в том же PR.
- **Keycloak/RBAC:** не обходить на клиенте — UI отражает отсутствие прав (см. тестовую стратегию e2e уровня).

## Критерии готовности (acceptance)
- [ ] Пакет собирается; `npm run lint` / `npm run test` / `npm run build` в области фронта (и корневые `make`-цели, если добавлены) зелёные.
- [ ] Клиент соответствует актуальному `openapi/openapi.yaml`.
- [ ] Компонент документирован (README пакета): props, `onSaveSuccess`, пример использования.
- [ ] `make openapi-lint`, `make docs-build` зелёные при затронутых артефактах.

## Проверка (команды)
```bash
make openapi-lint
make docs-build

cd frontend && npm ci && npm run lint && npm run test && npm run build
# плюс команды workspace для нового пакета — зафиксировать в README после появления
```

## Результат в отчёте
Структура пакета; команды сборки; известные ограничения semver; ссылка на follow-up 023.

## Человекопонятная история в docs-site (обязательно)
- [ ] `docs-site/docs/task-story-022-phase-4-profile-ui-package-openapi-embed.md`
- [ ] `docs-site/docs/task-stories-overview.md` обновлён
- [ ] Ссылки на `tasks/022-phase-4-profile-ui-package-openapi-embed/TASK.md`, `PLAN.md`, `REPORT.md`
