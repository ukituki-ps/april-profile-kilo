---
sidebar_position: 24
---

# 024 — Модель документации виджетов и единый каталог

## Какая была проблема

После технической интеграции виджетов не хватало единой операционной схемы, как описывать несколько виджетов внутри одного профиля: где canonical-правда, какие поля обязательны и как не потерять связь между контрактом, интеграцией и smoke/e2e.

## Что сделали

- Зафиксировали каноническую модель в `docs/WIDGET_DOCS_OPERATING_MODEL.md` со схемой `profile -> widgets -> contractVersion + lifecycleStatus`.
- Ввели единый словарь идентификаторов и статусов (`profileId`, `widgetId`, `contractVersion`, `lifecycleStatus`).
- Описали DoD документационного потока для релиза/изменения виджета.
- Добавили каталог `docs/widgets/README.md` и карточку текущего виджета `docs/widgets/profile/entity-profile-editor.md`.
- Синхронизировали человекопонятный слой: `docs-site/docs/widget-docs-operating-model.md` и `docs-site/docs/widget-catalog.md`.
- Обновили чеклисты релиза и интеграции, чтобы синхронизация `docs` и `docs-site` стала обязательной проверкой.

## Что это даёт команде

- Быстрый ответ на вопрос "какие виджеты есть у профиля и насколько они зрелые".
- Меньше расхождений между инженерной и продуктовой документацией.
- Чёткие правила, когда изменение контракта требует major/minor и какие артефакты должны обновиться.

## Как проверить без чтения кода

1. Открыть `docs-site/docs/widget-docs-operating-model.md` и проверить словарь полей и статусов.
2. Открыть `docs-site/docs/widget-catalog.md` и убедиться, что для `entity-profile` виден виджет с версией/статусом.
3. Проверить, что в чеклистах релиза/интеграции есть отдельные шаги синхронизации `docs` и `docs-site`.

## Границы (что не делали)

- Не меняли backend/frontend реализацию виджета.
- Не выполняли деплой и не меняли OpenAPI.
- Не мигрировали весь исторический архив документации вне контура виджетов.

## Ссылки на артефакты

- `tasks/024-phase-4-widget-docs-operating-model-and-project-ingestion/TASK.md`
- `tasks/024-phase-4-widget-docs-operating-model-and-project-ingestion/PLAN.md`
- `tasks/024-phase-4-widget-docs-operating-model-and-project-ingestion/REPORT.md`
