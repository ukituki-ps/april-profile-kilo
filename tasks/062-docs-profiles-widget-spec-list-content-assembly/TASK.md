# Документация: `profiles-widget` — разнесение спецификации на «список / контент / сборка»

## Мета
- **ID / ветка:** `062-docs-profiles-widget-spec-list-content-assembly` / `develop`
- **Приоритет:** обычный
- **Связанные файлы:** [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md), [`docs/widgets/README.md`](../../docs/widgets/README.md), [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md), [`frontend/packages/profile-ui/README.md`](../../frontend/packages/profile-ui/README.md), [`docs-site/docs/widget-catalog.md`](../../docs-site/docs/widget-catalog.md)

## Цель
Структурировать карточку виджета **`profiles-widget`** так, чтобы интегратор и разработка видели **три уровня**: (1) поверхность **списка** сущностей, (2) поверхность **карточки профиля и документа** (версии, JSON/RJSF), (3) **сборка** master–detail и связь с кодом (`ProfilesWidget` / `Core` / `ApiWidget` / provider). Сохранить **`profiles-widget.md`** как **точку входа** (мета виджета, `widgetId`, ссылки на детальные файлы и на общие контракты), не дублируя без нужды длинные таблицы props.

## Scope

### Входит в объём
- Добавить в `docs/widgets/profile/` два новых markdown-файла (имена согласовать в PR, ориентир ниже):
  - **`profiles-widget-list.md`** — сценарии и контракт **только списка**: `GET /v1/entities` (поиск, фильтр по типу, курсор, сортировка), отображение строки (`preview`, имя из документа, версия), пагинация, DS (`CardListColumn`), observability для `list_*` / `profiles_list`, ограничения (нет `entityIds` как source of truth).
  - **`profiles-widget-profile-detail.md`** (или эквивалентное имя в slug-стиле) — **правая колонка**: выбор версии, сохранение новой версии (`expectedVersion`), создание/удаление, поле имени, **документ** (сегменты Form / Tree / Source / Schema, зависимости `@april/ui`, RJSF при наличии схемы), observability для `details_*` / save.
- Превратить существующий **`profiles-widget.md`** в **короткую сборку**:
  - §1 мета (как сейчас), §2 одним абзацем назначение master–detail;
  - mermaid/архитектура Core + Api + facade + provider (можно оставить или слегка сжать);
  - явная таблица «куда смотреть»: ссылка на **list**-спеку, **detail**-спеку, `WIDGET_CONTRACTS`, ADR/задачи по ссылкам из текущего §8;
  - краткий абзац **«расширяемость»** (без реализации кода): host или будущий registry может подставлять альтернативный UI редактирования документа при том же списке, если зафиксирован контракт выбора/`entityId`/колбэков мутаций — это **документируемая перспектива**, не обязательство текущего API пакета.
- Обновить **входящие ссылки**, которые должны оставаться на «главную карточку»: минимум [`docs/widgets/README.md`](../../docs/widgets/README.md) и [`docs-site/docs/widget-catalog.md`](../../docs-site/docs/widget-catalog.md) — убедиться, что они по-прежнему указывают на `profiles-widget.md` (допустимо добавить одну строку «детали: list / detail»).
- По желанию в том же PR: поправить **явные** битые относительные ссылки, если перенос секций их ломает.

### Не входит в объём
- Рефакторинг React-кода, новые публичные entry в `@april/profile-ui`, code splitting.
- Изменение OpenAPI, BFF, Hub handoff.
- Обязательная новая страница docs-site (`task-story-*`): только если исполнитель решает синхронизировать человекопонятный слой; в постановке не требуется.

## AGENT_MASTER_PROMPT compliance checklist
- [x] Прочитан [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md).
- [x] Согласованность с [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) и существующими observability-именами.
- [x] Нет противоречий с задачами **042–047**, **058**, **059** (артефакты можно ссылками, не копировать устаревшее).

## Acceptance criteria
- [x] В репозитории есть **два** новых файла со спецификациями list и detail; текст перенесён из текущего `profiles-widget.md` логично, без потери нормативных требований (DS-first, anti-patterns).
- [x] `profiles-widget.md` остаётся **канонической точкой входа** в индексе виджетов и содержит навигацию на новые файлы + краткое описание сборки.
- [x] [`docs/widgets/README.md`](../../docs/widgets/README.md) и [`docs-site/docs/widget-catalog.md`](../../docs-site/docs/widget-catalog.md) не вводят в заблуждение (главная ссылка на виджет — по-прежнему на `profiles-widget.md` или согласованно обновлена в описании).
- [x] Комментарий в коде, если он ссылается только на один файл (например README пакета), при необходимости дополнен указанием на list/detail — **только** если исполнитель трогает эти файлы.

## Проверка (команды)
Документация: ручная ревью ссылок (относительные пути). При изменении `frontend/packages/profile-ui/README.md`:
```bash
cd frontend && npm run lint -w @april/profile-ui
```

## Ожидаемый результат в REPORT
Список созданных/изменённых файлов, решение по именам новых md, проверка ссылок, риски (дублирование меты между файлами), follow-up (например отдельная задача на кодовую сборку или registry).
