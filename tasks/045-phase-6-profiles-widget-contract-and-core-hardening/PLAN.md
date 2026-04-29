# План: hardening контракта `ProfilesWidget` и поведения `ProfilesWidgetCore` до целевого варианта C

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** согласован

## Исходные допущения
- API list/get/create/update/remove уже доступен (043), архитектурный baseline утвержден (042).
- В `044` есть частичная реализация, которую нужно довести до контрактной полноты, а не переписать заново.
- Команда принимает строгую дисциплину: сначала контракт и тесты, затем код.

## Порядок работ (шаги)
1. Зафиксировать gap list между вариантом C и текущим кодом:
   - props/types;
   - update concurrency;
   - error payload;
   - sorting/selection hooks.
2. Обновить типы и публичные интерфейсы:
   - `profilesDataProvider.ts`;
   - `ProfilesWidgetCoreProps`/`ProfilesApiWidgetProps`/`ProfilesWidgetProps`;
   - package exports (если требуется).
3. Внести изменения в `ProfilesWidgetCore`:
   - wiring `initialSort`, `autoSelectFirst`;
   - wiring `onOpenEntity`;
   - wiring `expectedVersion` для update;
   - формирование `onError` payload с `code`.
4. Обновить `ProfilesApiWidget`/`ProfilesWidget` так, чтобы все новые props проходили без потерь.
5. Обновить тесты:
   - сценарии сортировки;
   - сценарии auto-select on/off;
   - проверка `expectedVersion`;
   - проверка `onOpenEntity`;
   - проверка `onError.code`.
6. Обновить документацию контрактов и package README.
7. Прогнать quality gate и зафиксировать результат в `REPORT.md`.

## Definition of Done (жёсткий контроль)
- Типы соответствуют варианту C без «почти».
- Тесты проверяют каждый добавленный элемент контракта.
- В docs нет расхождения с реальными props/types.
- Нет новых технических долгов «сделать потом в следующей задаче» внутри scope 045.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не меняется |
| Frontend | Контракты props/types, Core logic, API facade wiring, unit/integration tests |
| БД / Atlas | Не меняется |
| Инфра / Compose | Не меняется |
| Документация / OpenAPI | docs/README виджет-контракта |

## Риски и откат
- **Риск:** скрытое breaking-change поведение для потребителей `ProfilesWidget`.  
  **Митигация:** явный migration note в docs + strict TS типы + тесты публичного API.
- **Риск:** ложноположительная уверенность при отсутствии тестов на новые поля.  
  **Митигация:** test-first для каждого пункта acceptance.
- **Откат:** revert только change set 045, без отката 042/043/044.

## Проверка после выполнения
- Автоматические:
  - `cd frontend && npm run lint -w @april/profile-ui`
  - `cd frontend && npm run test -w @april/profile-ui`
  - `cd frontend && npm run build -w @april/profile-ui`
- Функциональный smoke:
  - list load со `sort`;
  - `autoSelectFirst` true/false;
  - update c `expectedVersion`;
  - `onOpenEntity` и `onError` payload.

## Примечания
- Если в процессе выявится необходимость API-контрактного изменения, фиксировать блокер и выносить в отдельную задачу (не размывать scope 045).
