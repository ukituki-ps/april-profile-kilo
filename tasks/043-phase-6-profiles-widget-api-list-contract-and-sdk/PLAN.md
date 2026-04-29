# План: API-ready контур `ProfilesWidget` (list/search/filter/pagination + SDK)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** согласован

## Исходные допущения
- Архитектурный baseline задачи 042 утверждён.
- Backend/контрактная команда может внести изменения в API (в этом или связанном репозитории).
- Для UI важны стабильные и предсказуемые semantics сортировки, фильтрации и пагинации.
- Generated SDK является единственным источником клиентских API-типов в `@april/profile-ui`.

## Порядок работ (шаги)
1. Формализовать endpoint спецификацию:
   - path/method;
   - query params;
   - response schema;
   - error schema.
2. Уточнить semantics:
   - deterministic sort order;
   - cursor generation/validation;
   - граничные состояния (`empty`, `end_of_list`, invalid cursor).
3. Реализовать/обновить backend endpoint списка профилей.
4. Добавить тесты backend-контракта:
   - search hit/no hit;
   - type filter;
   - limit/cursor traversal;
   - invalid inputs -> 4xx.
5. Синхронизировать OpenAPI и сгенерировать frontend SDK.
6. Проверить обратную применимость для create/update/delete error envelope (request_id/code/message).
7. Обновить docs контракта и примеры.
8. Выполнить quality gate и зафиксировать готовность к 044.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Endpoint списка профилей + тесты + error envelope |
| Frontend | Обновленный generated SDK и типы контрактов |
| БД / Atlas | При необходимости индексы для server-side поиска/сортировки |
| Инфра / Compose | Необязательно; при необходимости только конфиг для smoke |
| Документация / OpenAPI | Спека list endpoint, примеры payload, docs updates |

## Риски и откат
- **Риск:** недетерминированный sort ломает cursor pagination.  
  **Митигация:** закрепить primary/secondary sort keys на уровне контракта и тестов.
- **Риск:** expensive search без индексов.  
  **Митигация:** ограничить начальные search-поля и добавить индексы по фактическому query plan.
- **Риск:** request_id не прокидывается в ответы ошибок.  
  **Митигация:** отдельный контрактный тест на error envelope.
- **Откат:** откатить endpoint и SDK в рамках одного rollback change set; зафиксировать блокер для 044.

## Проверка после выполнения
- Backend:
  - `go test ./...` зелёный;
  - smoke list endpoint с несколькими страницами.
- Frontend:
  - `cd frontend && npm run lint && npm run test && npm run build`;
  - компиляция `profile-ui` с новым SDK типобезопасна.
- Контракт:
  - OpenAPI и generated client синхронизированы;
  - documented examples соответствуют фактическим payload.

## Примечания
- Hard gate: задача 044 стартует только после готовности list endpoint и SDK.
- Обновления плана:
  - 2026-04-29 — первичная версия.
