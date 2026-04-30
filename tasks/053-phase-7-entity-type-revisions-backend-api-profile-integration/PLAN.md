# План: задача 053 — API и интеграция с профилем

- **Задача:** [`TASK.md`](./TASK.md)
- **Статус плана:** черновик исполнителя

## Шаги

1. Зафиксировать карту endpoints и схемы ошибок в OpenAPI **до** массовых правок Go (контракт-first).
2. Реализовать доменный слой типов (families/revisions/drafts/publish).
3. Расширить `profiles.Service` для bind revision и upgrade; сохранить согласованность outbox-транзакций.
4. HTTP handlers + тесты; интеграционные тесты на счастливые и негативные сценарии.
5. Регенерация SDK; smoke compile frontend workspace при необходимости.

 [`docs/AGENT_PLAN_TEMPLATE.md`](../../docs/AGENT_PLAN_TEMPLATE.md)
