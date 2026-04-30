---
slug: /
sidebar_position: 1
title: Architecture Decision Records
---

# Architecture Decision Records (ADR)

Здесь хранятся записи архитектурных решений для проекта на базе этого репозитория. Формат — по шаблону `template.md` в этом каталоге.

## Индекс

| ID | Заголовок | Статус |
|----|-----------|--------|
| [0001](0001-record-architecture-decisions.md) | Ведение ADR | принято |
| [0002](0002-april-profile-scope-and-multitenancy.md) | AprilProfile: назначение, границы, мультитенантность | принято |
| [0003](0003-april-profile-data-model-policies.md) | AprilProfile: метамодель, версии, authority, события | принято |
| [0004](0004-hybrid-ui-integration-model.md) | Гибридная интеграция UI: Host / Widget / API–BFF-first | принято |
| [0005](0005-entity-type-revisions-and-entity-binding.md) | Ревизии типа сущности и привязка entity к опубликованной схеме | принято |

## Как добавить запись

1. Скопируйте `template.md` в новый файл `NNNN-краткое-имя.md`.
2. Заполните разделы, укажите статус (предложено / принято / устарело).
3. Добавьте строку в таблицу выше.

Сайт Docusaurus подхватывает эту папку как раздел **ADR** (см. корневой `README.md` и `Makefile`).
