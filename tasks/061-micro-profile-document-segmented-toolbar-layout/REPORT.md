# REPORT — 061-micro-profile-document-segmented-toolbar-layout

## Что изменено

- **`frontend/packages/profile-ui/src/components/EntityTypesDraftJsonEditor.tsx`**
  - Вынесен публичный **`DraftJsonEditorToolbar`**: переключение режимов **Form / Tree / Source / Schema** через **`AprilGradientSegmentedControl`** из `@april/ui` (все доступные режимы в одной линии, меню «⋯» убрано).
  - У **`EntityTypesDraftJsonEditor`** добавлен флаг **`hideModeToolbar`**, чтобы тулбар можно было рендерить снаружи (шапка виджета профиля).
  - Ошибка парсинга при смене вида: заголовок алерта уточнён («Cannot change document view»); сброс ошибки при изменении **`sourceText`** через `useEffect`.
- **`frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`**
  - Селект версии перенесён в правую группу шапки; рядом — **`DraftJsonEditorToolbar`** и существующие action-иконки.
  - У редакторов документа профиля включён **`hideModeToolbar`** (режимы только в шапке).
- **Тесты:** в моках `@april/ui` добавлен **`AprilGradientSegmentedControl`** (делегирование на Mantine **`SegmentedControl`**); обновлены **`pickTreeDocumentView`** и проверки Form-режима (**`ProfilesWidgetCore.test.tsx`**, **`ProfilesWidget.test.tsx`**); исправлен мок в **`EntityTypesWidgetCore.test.tsx`**.

## Проверки

| Команда | Результат |
|--------|-----------|
| `cd frontend && npm run lint` | OK |
| `cd frontend && npm test` | OK (shell + `@april/profile-ui`) |

## Риски / ограничения

- При **четырёх** сегментах (Form, Tree, Source, Schema) на узкой шапке возможен перенос строки (`wrap` у внешнего `Group`); при необходимости можно уменьшить `size` или вынести часть режимов в меню в отдельной задаче.
- Сброс **`sourceSwitchError`** при любом изменении **`sourceText`** может скрыть сообщение до следующей попытки смены режима — это намеренно упрощает UX при правке JSON.

## Follow-up

- При желании синхронизировать **`docs/widgets/profile/profiles-widget.md`** со скриншотом/описанием шапки (не делалось в scope).
