# Задача 080 [april-worker, внешнее исполнение] — AprilHub: согласование глобального mobile chrome и e2e

## Мета
- **Репозиторий выполнения:** **[april-worker](https://github.com/ukituki-ps/april-worker)** (`hub-shell`, e2e Playwright, layout AprilHub).
- **Постановка в april-profile:** якорь эпика **074** — **волна B**, шаг 3.
- **Зависит от:** [`079-april-profile-profile-ui-mobile-shell-strategy-a`](../079-april-profile-profile-ui-mobile-shell-strategy-a/) (или параллельно при согласовании, если меняется только host-dock без виджета).
- **Связанные документы:** [`docs/adr/0006-mobile-chrome-layers-widget-host.md`](../../docs/adr/0006-mobile-chrome-layers-widget-host.md); [`docs/WIDGET_INTEGRATION_CHECKLIST.md`](../../docs/WIDGET_INTEGRATION_CHECKLIST.md).

## Цель
Согласовать **глобальный dock / нижнюю панель Hub** с панелью виджета по чеклисту: нет конфликта со **стратегией A**; **Playwright** smoke на profile-widgets на mobile viewport проходит на связке актуальных **`vendor/april-profile`** и версии DS из GPR.

## Входит в объём
- Правки layout/хрома в `hub-shell` (или согласованные модули worker).
- Bump **`vendor/april-profile`** после merge **079** в april-profile (отдельный PR или часть той же задачи — зафиксировать в `REPORT.md`).
- E2e: минимум существующий smoke profile-widgets на узкой ширине; при необходимости новые шаги.

## Не входит в объём
- Реализация логики виджета — **079**.
- Публикация DS — **078**.

## Критерии готовности (acceptance)
- [ ] PR в april-worker зелёный по CI; e2e smoke (или согласованный gate) зелёный.
- [ ] В `REPORT.md` — ссылка на PR, указание версии `april-profile` submodule и DS.

## Результат в отчёте
[`REPORT.md`](./REPORT.md): PR, команды проверки, известные ограничения.

## Человекопонятная история в docs-site
- [ ] Опционально: ссылка из [`task-story-074`](../../docs-site/docs/task-story-074-phase-8-ds-gpr-mobile-shell-unification.md).
