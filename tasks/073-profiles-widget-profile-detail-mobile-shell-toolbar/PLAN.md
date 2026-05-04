# План: мобильный shell + карусель режимов + версии в `ProfilesWidgetProfileDetailCore`

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-05-03
- **Статус плана:** выполнено (2026-05-03)

## Исходные допущения

- Порог узкого экрана **совпадает с 072**: `(max-width: 47.99em)` (`useMediaQuery` в Core/Detail).
- **`AprilMobileShellBar`** для детали/create монтируется **внутри** области **`ProfilesWidgetProfileDetailCore`**, чтобы не смешивать с **`AprilMobileShellBar`** списка в **`CardListColumn`** (два fixed-бара на одном экране — anti-pattern; при необходимости список при открытой детали скрывается естественно sheet-ом родителя).
- Родительский **`AprilVaulBottomSheet`** (**`ProfilesWidgetCore`**) оставляет **минимальную шапку** (title + close), если все действия перенесены в inner shell — согласовать с продуктом в PR.

## Порядок работ (шаги)

1. **Макет и слоты**
   - Нарисовать текстом матрицу: состояния `idle` | `versionSheet` | `create` | `edit` × слоты shell (`leading`, `center`).
   - Зафиксировать, какие кнопки в `leading` (например системный «назад» только если хост передаст через будущий проп — по умолчанию не обязательно).

2. **Обёртка layout в `ProfilesWidgetProfileDetailCore`**
   - Ввести внутренний корень `position: relative; flex: 1; minHeight: 0` для колонки детали.
   - В ветке **narrow** обернуть контент + **`AprilMobileShellBar`**; применить **`aprilMobileShellBarContentPaddingBottom`** к scroll viewport.

3. **Миграция с портала шапки на shell (narrow)**
   - Условно **не** вызывать `createPortal(..., gridModalDetailHeaderHostEl)` для create/detail actions на narrow; вместо этого заполнять `center` / `leading` у **`AprilMobileShellBar`**.
   - На **wide** сохранить портал в **`gridModalDetailHeaderHostEl`** как сейчас.

4. **Карусель режимов**
   - Вынести порядок режимов из **`DraftJsonEditorToolbar`** (или дублировать минимальный список разрешённых режимов по пропам `withFormMode` / `withSchemaPanel`).
   - Реализовать `cycleDocumentMode()` + одна кнопка с иконкой «следующего» режима.

5. **Версии + shell**
   - При `versionSheetOpened`: `AprilMobileShellBar` `center` = только закрытие листа (или `leading`); основной `center` с save/edit/режимами **не рендерить**.
   - Проверить stacking с **`AprilVaulBottomSheet`** версий (z-index из **072** + при необходимости корректировка).

6. **Тесты и документация**
   - Vitest + обновление markdown.

## Затрагиваемые области

| Область | Изменения |
|--------|-----------|
| `ProfilesWidgetProfileDetailCore.tsx` | Основной объём |
| `EntityTypesDraftJsonEditor.tsx` / тулбар | Опционально: проп для карусели |
| `ProfilesWidgetCore.tsx` | Минимально: заголовок sheet при mobile-only actions |
| Документация | `profiles-widget-profile-detail.md`, при необходимости `profiles-widget.md` |

## Риски и откат

| Риск | Митигация |
|------|-----------|
| Два fixed bar (список + деталь) | Inner `absolute` shell внутри sheet; не `fixed` на full viewport при вложенности — проверить в PR |
| Регресс wide / embed | Жёсткое ветвление `matchesNarrowViewport` |
| Регресс RJSF/Tree | Ручной смок после цикла режимов |

**Откат:** revert PR.

## Проверка

- Команды из **`TASK.md`**.
- Ручной смок: create + деталь + версии + цикл режимов на iPhone width.

## Примечания

- Связь с **072**: эта задача **дополняет** mobile UX детали/create; не дублировать работу по sheet родителя.
