# Задача: Фаза 2 (часть 2) — CRUD сущности и append-only версии профиля

## Мета
- **ID / ветка:** (например `feat/phase-2-crud-versioning`)
- **Приоритет:** высокий
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 2**, блок **«Сначала»** (CRUD сущности, append-only версии профиля, чтение текущей/по номеру версии, mapping внешних ключей).
- **Связанные подзадачи:** зависит от [`010-phase-2-entity-types-openapi`](../010-phase-2-entity-types-openapi/); подготавливает данные и инварианты для [`012-phase-2-authority-merge-conflicts`](../012-phase-2-authority-merge-conflicts/) и [`013-phase-2-abac-field-filtering`](../013-phase-2-abac-field-filtering/).
- **Связанные документы:** [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md), [`docs/adr/0003-april-profile-data-model-policies.md`](../../docs/adr/0003-april-profile-data-model-policies.md)

## Цель
Реализовать доменный API профилей: создание/обновление через append-only версионирование, получение текущей версии и чтение конкретной версии по номеру, с корректным маппингом внешних ключей и синхронным OpenAPI.

## Контекст для агента
- Опора на фазу 2, блок «Сначала» в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Первичный поток фазы 2 должен быть завершён до событий (фаза 3) и интеграции с Hub (фаза 4.2).

## Входит в объём
- CRUD API доменной сущности(ей) по согласованному минимальному набору.
- Append-only хранение версий профиля и чтение:
  - текущей актуальной версии;
  - конкретной версии по номеру/идентификатору.
- Маппинг внешних ключей (external reference -> internal link) в рамках доступного контракта.
- OpenAPI: endpoints CRUD + версии + ошибки валидации/конфликтов базового уровня.

## Не входит в объём
- Сложные правила authority/merge/конфликтная очередь и ручное разрешение (в [`012`](../012-phase-2-authority-merge-conflicts/)).
- Сегментация выдачи по ABAC на уровне полей (в [`013`](../013-phase-2-abac-field-filtering/)).
- Публикация доменных событий и Asynq-задачи (фаза 3).

## Заглушки и внешние зависимости
- Если внешнее API для проверки external keys не готово, использовать временный адаптер/таблицу соответствий с явной пометкой в `REPORT.md`.
- Если нет dev-стенда внешних систем, разрешён мок-режим в интеграционных тестах с фиксированными данными.

## Технические ограничения
- Миграции и эволюция схемы только через Atlas.
- `tenant_id` только из доверенного контекста (без чтения tenant из payload).
- Секреты/конфигурация только через env.
- OpenAPI должен быть синхронизирован с реализацией и проходить `check-openapi-compat`.

## Критерии готовности (acceptance)
- [ ] CRUD доменной сущности работает в рамках tenant и покрыт базовыми тестами.
- [ ] Новая версия профиля создаётся append-only, исторические версии доступны на чтение.
- [ ] Получение current и `by-version` возвращает согласованные данные.
- [ ] Маппинг внешних ключей работает в целевом или временном (документированном) режиме.
- [ ] OpenAPI и CI-проверка совместимости зелёные.

## Проверка (команды)
```bash
go test ./...
go test -tags=integration ./...
go vet ./...
make openapi-lint
scripts/check-openapi-compat.sh
make docs-build
```

## Результат в отчёте
Список endpoint'ов CRUD/versions, стратегия append-only и хранения текущей версии, какие external mappings реализованы нативно, а какие закрыты заглушками.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана страница `docs-site/docs/task-story-011-entity-crud-versioning.md`.
- [ ] В `docs-site/docs/task-stories-overview.md` добавлены пункт и строка статуса по задаче 011.
- [ ] На простом языке описано: что такое append-only версии, зачем нужна историчность и чем полезен current/by-version API.
- [ ] Есть раздел "Как проверить без чтения кода".
- [ ] В конце страницы добавлены ссылки на `tasks/011-phase-2-entity-crud-versioning/TASK.md`, `PLAN.md` (если есть), `REPORT.md`.
