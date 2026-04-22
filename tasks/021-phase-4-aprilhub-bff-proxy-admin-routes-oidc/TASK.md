# Задача: Фаза 4.2 (часть 1, AprilHub) — BFF прокси к Profile, админ-маршруты, один OIDC-клиент

## Мета
- **Репозиторий выполнения:** **AprilHub** — [`april-worker`](https://github.com/ukituki-ps/april-worker). Тикет хранится в april-profile для трассировки дорожной карты.
- **Маркировка:** **[AprilHub — внешний репозиторий]** вся реализация BFF/OIDC/маршрутов — в april-worker (или согласованных пакетах Hub).
- **ID / ветка:** (в april-worker)
- **Приоритет:** обычный
- **Родительская дорожная карта (продукт):** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4**, **4.2**, блок **«Сначала»**.
- **Связанные подзадачи:** **зависит от** контракта и поведения API в AprilProfile: минимум [`020-phase-4-profile-contract-behind-hub-bff`](../020-phase-4-profile-contract-behind-hub-bff/) (док/соглашение); логически после стабильного доменного API [`010`](../010-phase-2-entity-types-openapi/)–[`013`](../013-phase-2-abac-field-filtering/). Перед [`022`](../022-phase-4-profile-ui-package-openapi-embed/) и [`023`](../023-phase-4-aprilhub-widget-host-e2e-smoke/).

## Цель
На **AprilHub** реализован сценарий **dev**: BFF **проксирует** запросы к **AprilProfile** с корректной передачей **tenant**, доступны **админ-маршруты** вида `/admin/profile/...` (или **согласованный** префикс из задачи 020), используется **один OIDC-клиент** (Keycloak) по договорённости с владельцами Hub.

## Контекст для агента
- Выполнять в **april-worker** по его архитектуре BFF (пути к коду — в README того репозитория).
- Сверка с [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md) и матрицей UI — на уровне принципов, без смены стека april-profile.

## Входит в объём
- Конфиг upstream на **базовый URL** Profile (env на стенде).
- Проксирование с **пробросом** нужных заголовков (`Authorization`, `X-Request-Id`, согласованные `X-*` для tenant если применимо по задаче 020).
- Маршрутизация **админского** префикса к upstream Profile.
- Регистрация/настройка **OIDC client** (один на сценарий) в Keycloak realm Hub — по runbook Hub (**ручная** часть: доступы).

## Не входит в объём
- Реализация доменной логики в AprilProfile.
- Публикация npm-пакета `@april/profile-ui` — задача [`022`](../022-phase-4-profile-ui-package-openapi-embed/).
- Полноценный **e2e** — задача [`023`](../023-phase-4-aprilhub-widget-host-e2e-smoke/).

## Заглушки и внешние зависимости
- **До доступности dev Profile:** mock upstream (echo server) с теми же заголовками для проверки маршрутизации BFF; зафиксировать в `REPORT.md`.
- **Ручные контрольные точки:** merge в april-worker, секреты клиента OIDC, согласование с владельцами AprilHub, сетевая доступность runner → Profile.

## Технические ограничения
- Не менять стек AprilProfile; не вводить второй источник tenant без согласования с ADR-0002.
- Секреты — только механизмы april-worker.

## Критерии готовности (acceptance)
- [ ] С dev-стенда Hub **успешный** вызов хотя бы одного согласованного API Profile через BFF с валидным JWT и корректным tenant.
- [ ] Задокументировано в docs april-worker: URL, env, ограничения.
- [ ] CI april-worker на PR зелёный (или зафиксировано исключение с владельцем).

## Проверка (команды)
```bash
# В клоне april-worker — по README / CI того репозитория
```

## Результат в отчёте
Ссылки на PR april-worker; скрин/лог успешного прокси; перечень env; контакт согласования.

## Человекопонятная история в docs-site (обязательно)
- [ ] При политике репо — страница `docs-site/docs/task-story-021-phase-4-aprilhub-bff-proxy-admin-routes-oidc.md` с пометкой «исполнение в AprilHub».
- [ ] `docs-site/docs/task-stories-overview.md` — строка по задаче 021.
- [ ] Ссылки на `tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/TASK.md`, `REPORT.md`.
