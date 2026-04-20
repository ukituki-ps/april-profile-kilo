---
sidebar_position: 1
---

# April Profile

Документация микросервиса **AprilProfile** в экосистеме **April**: централизованные **версионируемые профили сущностей** (полиморфная модель, мультитенантность). Стек — `docs/AGENT_ARCHITECTURE_CONTEXT.md` в корне репозитория. Репозиторий ведёт документацию, OpenAPI и каркас frontend на дизайн-системе April.

## Куда смотреть

| Раздел | Содержание |
|--------|------------|
| [Дизайн модуля AprilProfile](./design-april-profile) | Назначение, границы с OrgFlow/EDC/IAM, модель данных, события |
| [Стратегия фронтенда](./frontend-strategy) | Три модели UI (Host / Widget / API–BFF), AprilHub, контракты |
| [Гибридная интеграция UI (индекс)](./ui-integration-governance) | Контракты виджетов, матрица решений, версионирование, чеклисты, observability |
| [Быстрый старт](./getting-started.md) | Сборка сайта, OpenAPI, Docker Compose |
| [Форк и кастомизация](/guides/FORK_AND_CUSTOMIZE) | Чеклист под сервис, версии инструментов |
| [Дизайн-система April](/guides/DESIGN_SYSTEM) | `@april/tokens`, `@april/ui`, ссылка на репозиторий DisignApril |
| [ADR](/adr/) | ADR (в т.ч. 0002–0004: AprilProfile и гибридная модель UI) |
| Архитектурный контекст | `docs/AGENT_ARCHITECTURE_CONTEXT.md` |

Полный стек — в `docs/AGENT_ARCHITECTURE_CONTEXT.md`. Участие — `CONTRIBUTING.md` в корне.
