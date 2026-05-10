# План задачи 079 [april-profile] — стратегия A в виджетах

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-05-10
- **Статус плана:** согласован с выполнением (код + доки; CI — после `npm ci` с GPR)

## Исходные допущения

- **078** закрыт во **DisignApril**: **`@ukituki-ps/april-ui@0.1.10`** / tokens **0.1.10** (см. [`../078-external-DisignApril-april-mobile-shell-bar-refactor/REPORT.md`](../078-external-DisignApril-april-mobile-shell-bar-refactor/REPORT.md)).
- Потребитель **`onRequestCloseMobileOverlay`** и иных пропов вне опубликованного API DS в этой итерации не внедряет.

## Порядок работ (факт)

1. Поднять диапазон **`@ukituki-ps/april-ui` / `april-tokens`** до **^0.1.10** в `frontend/` и lockfile.
2. В **`ProfilesWidgetProfileDetailCore`**: при открытом листе версий (**`AprilVaulBottomSheet`**) не монтировать **`AprilMobileShellBar`** детали; синхронизировать нижний padding контента.
3. Тест: лист версий → нет `data-testid="profile-detail-mobile-shell-bar"`.
4. Доки: §8.6, чеклист, карточки виджетов, зеркала `docs-site`, ссылка в story **074**.

## Ручная проверка

- Узкий viewport: список → деталь (Vaul) → **Versions** → одна «вершина» UI снизу (лист; без параллельной капсулы детали) → закрыть лист → снова **`AprilMobileShellBar`** детали.
