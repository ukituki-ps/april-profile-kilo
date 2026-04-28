---
sidebar_position: 49
---

# 039 — Отдельный File Service в архитектуре April

## Какая была проблема

До задачи 039 в документации не было достаточно четко зафиксировано, где именно заканчивается ответственность `AprilProfile` и начинается файловая подсистема. Из-за этого можно было по-разному трактовать хранение файлов: "в профиле" или "в отдельном сервисе".

## Что сделали

- Ввели в целевую архитектуру отдельный сервис `AprilFile (File Service)`.
- Обновили обзор экосистемы в `docs/структура сервиса.md`:
  - добавили описание `AprilFile`;
  - явно описали границы с `AprilProfile`.
- Обновили архитектурный дизайн `AprilProfile` в `docs/DESIGN_AprilProfile.md` (и синхронно в `docs-site/docs/design-april-profile.md`):
  - добавили `AprilFile` в таблицу границ с экосистемой;
  - зафиксировали правило: `AprilProfile` хранит ссылки и метаданные файлов, но не бинарный payload.
- Обновили `docs/AGENT_ARCHITECTURE_CONTEXT.md`, чтобы это решение было видно в базовом контексте для дальнейших задач.

## Что это даёт команде

- Понятные и стабильные границы доменов: профильные данные отдельно, файловая инфраструктура отдельно.
- Меньше риска архитектурной путаницы при новых задачах и PR.
- Проще планировать дальнейшую runtime-реализацию file-сервиса без ломки текущего `AprilProfile`.

## Как проверить без чтения кода

1. Открыть `docs/структура сервиса.md` и убедиться, что есть отдельный `AprilFile (File Service)` и блок с границами `AprilProfile`/`AprilFile`.
2. Открыть `docs/DESIGN_AprilProfile.md` и найти `AprilFile` в таблице границ и в разделе интеграций.
3. Проверить, что в docs-site есть эта страница и она попала в `task-stories-overview`.
4. Выполнить `make docs-build`.

## Границы и follow-up

- В этой задаче **не реализуется** runtime-код file-микросервиса.
- Не меняются OpenAPI-контракты `AprilProfile`.
- Не настраивается production-infra для object storage, AV и lifecycle-политик.

## Ссылки на артефакты

- `tasks/039-phase-5-file-service-architecture-docs/TASK.md`
- `tasks/039-phase-5-file-service-architecture-docs/PLAN.md`
- `tasks/039-phase-5-file-service-architecture-docs/REPORT.md`
