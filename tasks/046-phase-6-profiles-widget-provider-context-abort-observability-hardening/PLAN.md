# План: hardening provider-контекста, отмены запросов и observability в `ProfilesWidget`

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** согласован

## Исходные допущения
- Контрактные доработки 045 завершены и стабильны.
- Generated SDK/transport допускает внедрение `AbortSignal` (или возможно расширение runtime-wrapper).
- Команда согласна на расширение telemetry-схемы при сохранении backward compatibility.

## Порядок работ (шаги)
1. Определить целевую форму `ProviderContext` и обновить типы.
2. Вынести единый builder контекста в API-layer (`ProfilesApiWidget`), исключив дубли.
3. Реализовать в Core управление `AbortController`:
   - list pipeline;
   - details pipeline;
   - cleanup на unmount.
4. Обновить `openapiProfilesProvider`:
   - убрать глобальные mutable dependencies;
   - обеспечить request-scoped конфиг;
   - прокинуть `signal`.
5. Реализовать/обновить telemetry emission:
   - request started/succeeded/failed;
   - latency/error code/phase.
6. Добавить тесты на:
   - отмену старых запросов;
   - отсутствие stale overwrite;
   - корректный telemetry contract;
   - multi-widget safety.
7. Обновить docs и проверить соответствие фактическому поведению.

## Definition of Done (жёсткий контроль)
- Нет мест, где Core обращается к transport-деталям.
- Нет мест, где list/details запрос живёт без abort lifecycle.
- Нет глобальной конфигурации, вызывающей cross-instance race.
- Все новые telemetry-ключи задокументированы и покрыты тестами.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не меняется |
| Frontend | Provider context + abort control + API provider runtime safety + telemetry wiring + tests |
| БД / Atlas | Не меняется |
| Инфра / Compose | Не меняется |
| Документация / OpenAPI | Обновление docs по observability и provider contract |

## Риски и откат
- **Риск:** частичная поддержка abort в generated клиенте.  
  **Митигация:** технический spike в начале + минимальный wrapper с явной документацией.
- **Риск:** переизбыток telemetry-событий и шум в аналитике.  
  **Митигация:** фиксированный whitelist событий и метаданных.
- **Риск:** регрессии конкурентного поведения при быстром клике/поиске.  
  **Митигация:** тесты race-сценариев как обязательный gate.
- **Откат:** откатить изменения 046 целиком без отката контрактных изменений 045.

## Проверка после выполнения
- Автоматические:
  - `cd frontend && npm run lint -w @april/profile-ui`
  - `cd frontend && npm run test -w @april/profile-ui`
  - `cd frontend && npm run build -w @april/profile-ui`
- Функциональный smoke:
  - быстрый поиск/смена фильтра не оставляют устаревшие данные;
  - быстрое переключение карточек не перезаписывает details старым ответом;
  - telemetry содержит новые ключи и совместима со старым потоком.

## Примечания
- Если будет выявлен общий reusable-паттерн provider runtime safety для всех виджетов пакета, вынести как follow-up task после 046.
