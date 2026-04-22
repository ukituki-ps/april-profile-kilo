# Задача: Фаза 4.2 (завершение интеграции, AprilHub) — хостинг виджета и e2e smoke

## Мета
- **Репозиторий выполнения:** **AprilHub** — [`april-worker`](https://github.com/ukituki-ps/april-worker) (и при необходимости репозиторий e2e по практике Hub).
- **Маркировка:** **[AprilHub — внешний репозиторий]** основная реализация Host-driven встраивания и Playwright (или принятый в Hub инструмент).
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4**, **4.2**, блок **«Затем»** (пункт **e2e smoke**; вместе с пакетом UI в том же блоке плана — см. задачу [`022`](../022-phase-4-profile-ui-package-openapi-embed/) для стороны AprilProfile).
- **Связанные подзадачи:** **зависит от** [`021-phase-4-aprilhub-bff-proxy-admin-routes-oidc`](../021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/) и наличия опубликованного/подключаемого артефакта [`022`](../022-phase-4-profile-ui-package-openapi-embed/) (локальный `file:` / npm registry / git dependency — по договорённости). Наблюдаемость — желательно после [`018`](../018-phase-4-prometheus-metrics-logs-correlation/).

## Цель
В **AprilHub** встроен сценарий **Host-driven** (или согласованный гибрид по ADR-0004): экран/блок использует пакет профиля, проходит **аутентификация** через общий OIDC, данные идут через **BFF** к AprilProfile; существует **автоматизированный e2e smoke** (минимум один happy-path), зафиксированный в CI или ночном расписании по практике april-worker.

## Контекст для агента
- [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md) — для событий/метрик виджета, если применимо.
- [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) — контракт props/events.

## Входит в объём
- Подключение зависимости на UI-пакет профиля (версия **semver**).
- Маршрут Host (например админский раздел), **HostContext** по контракту.
- **E2E тест**: логин (или тестовый bypass по политике Hub) → отображение виджета → успешное сохранение срабатывание **`onSaveSuccess`** (проверка побочного эффекта UI или сетевого вызова).
- Документация в april-worker: как запускать e2e локально.

## Не входит в объём
- Разработка доменного API в AprilProfile.
- Полный регресс всех экранов Hub.

## Заглушки и внешние зависимости
- **До публикации npm-пакета:** зависимость `file:` / submodule на april-profile — явно описать; после публикации — перейти на semver.
- **Ручные точки:** учётные данные тестового пользователя Keycloak, секреты CI для e2e, доступность dev Profile с Hub runner.

## Технические ограничения
- Следовать **TESTING_STRATEGY** april-worker для e2e; не хранить секреты в april-profile.

## Критерии готовности (acceptance)
- [ ] На dev-стенде сценарий проходит **вручную** (чеклист в `REPORT.md`).
- [ ] E2E добавлен и **стабилен** (зелёный прогон в CI или задокументированный триггер).
- [ ] Ссылка на PR(ы) april-worker в `REPORT.md` задачи в april-profile.

## Проверка (команды)
```bash
# В april-worker — команды e2e из README (например pnpm exec playwright test)
```

## Результат в отчёте
Ссылки на PR; видео/скрин опционально; известные flaky и митигации.

## Человекопонятная история в docs-site (обязательно)
- [ ] `docs-site/docs/task-story-023-phase-4-aprilhub-widget-host-e2e-smoke.md` с пометкой AprilHub
- [ ] `docs-site/docs/task-stories-overview.md`
- [ ] Ссылки на `tasks/023-phase-4-aprilhub-widget-host-e2e-smoke/TASK.md`, `REPORT.md`
