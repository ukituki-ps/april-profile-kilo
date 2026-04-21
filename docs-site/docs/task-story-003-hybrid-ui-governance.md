---
sidebar_position: 23
---

# 003 — Гибридная UI-модель и governance

## Что болело

Без четкой модели интеграции UI команда начинает спорить "как правильно":

- делать в host,
- выносить в widget,
- или идти через API/BFF-first.

Итог обычно: разъезд контрактов, хаос в версиях, сложные интеграции.

## Что сделали

- Зафиксировали гибридную модель (Host + Widgets + API/BFF-first).
- Добавили ADR-0004 с решением и границами.
- Описали контракты `HostContext`, props/events.
- Добавили decision matrix, versioning rules, release/integration checklist.
- Синхронизировали это с docs-site и roadmap.

## Что получили

- Единые правила для команды, как выбирать режим интеграции.
- Понятные контракты между host и widget.
- Прогнозируемый процесс изменений (semver и совместимость).

## На пальцах

- Если нужен общий переиспользуемый блок в разных местах -> чаще widget-driven.
- Если уникальный сложный экран -> чаще host-driven.
- Если нужно быстро отдать ценность и виджета пока нет -> API/BFF-first.

## Ограничения

- Это governance-слой: он задает правила, но не заменяет пилотную реализацию конкретного виджета.

## Технические детали

- Постановка: `tasks/003-hybrid-ui-integration-governance/TASK.md`
- План: `tasks/003-hybrid-ui-integration-governance/PLAN.md`
- Отчёт: `tasks/003-hybrid-ui-integration-governance/REPORT.md`
- ADR решения: [`ADR-0004`](/adr/hybrid-ui-integration-model)
