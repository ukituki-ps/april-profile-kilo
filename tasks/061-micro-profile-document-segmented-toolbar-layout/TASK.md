# 061 — Profile document: DS SegmentedControl + toolbar layout

## Мета

- **id:** `061-micro-profile-document-segmented-toolbar-layout`
- **ветка (рекомендация):** `feature/061-profile-document-segmented-toolbar-layout`
- **приоритет:** P2 (UX)
- **связанные файлы:** `frontend/packages/profile-ui/src/components/EntityTypesDraftJsonEditor.tsx`, `ProfilesWidgetCore.tsx`, тесты `ProfilesWidget*.test.tsx`

## Цель

В карточке выбранного профиля: переключатель режима документа (Form / Tree / Source / Schema) — на **`AprilGradientSegmentedControl`** из `@april/ui`; селект версии и этот переключатель — **в одной правой группе** с action-иконками (сохранить / править / удалить и т.д.).

## Scope

**Входит:**

- Замена иконок + меню «⋯» в редакторе черновика JSON на сегментированный контроль DS (все доступные режимы в одной линии `data`, без отдельного overflow-меню там, где сегменты покрывают режимы).
- В `ProfilesWidgetCore`: вынесение тулбара режимов в шапку профиля справа вместе с `Select` версии и существующими action-иконками; у `EntityTypesDraftJsonEditor` — режим скрытия встроенного тулбара для этих экранов.

**Не входит:**

- Изменение логики API, версий, RJSF, модалки создания (кроме того же компонента редактора — встроенный тулбар в модалке остаётся).
- Глобальная замена Mantine-компонентов вне этого сценария.

## AGENT_MASTER_PROMPT compliance

- [x] DS-first: `AprilGradientSegmentedControl` из `@april/ui`.
- [x] Scope не расширен.
- [x] Отчёт `REPORT.md` по шаблону репозитория.
- [x] Проверки: `npm run lint` / `npm test` в `frontend` (релевантные workspace).

## Acceptance criteria

1. В демо/виджете профиля у выбранной сущности селект версии и сегменты режима документа видны **справа в шапке**, рядом с action-иконками.
2. Режимы документа переключаются сегментами DS; поведение парсинга при переходе Source → Tree/Form/Schema сохранено.
3. Модалка «Create profile» и экраны типов сущностей (`EntityTypesWidgetCore`) без регрессий встроенного тулбара.
4. Тесты и линт проходят.

## Проверка

```bash
cd frontend && npm run lint && npm test
```

## Ожидаемый результат в REPORT

Список изменённых файлов, результаты команд, риски, follow-up.
