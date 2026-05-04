# REPORT: 071-micro-entity-types-widget-master-detail-refactor

## 1) Итого

- Статус: ✅ выполнено
- Задача: entity-types-widget → master–detail (как profiles-widget)
- Ветка: `feature/entity-types-widget-master-detail-refactor` (от `develop`; merge через PR, без прямого push в защищённые ветки — см. [`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md))
- Коммиты: один коммит на ветке после локального squash (хеш — `git log -1 --oneline` на `feature/entity-types-widget-master-detail-refactor`)
- PR: не создавался

## 2) Что сделано

- [backend] Нет изменений.
- [frontend] Вынесена правая колонка в **`EntityTypesWidgetDetailCore`**: загрузка семейства и ревизий с **`AbortSignal`** и монотонным request id, вкладки Draft / Revisions / Upgrade, save/publish, patch/delete через **`AprilModal`**, колбэки **`onCatalogReload`** / **`onFamilyDeleted`**. **`EntityTypesWidgetCore`** оставлен как master: **`listFamilies`** с abort, **`CardListColumn`**, выбор **`selectedFamilyId`**, модалка создания семейства. Экспорт Detail и типов из **`src/index.ts`**. **`DensityProvider`** на корне Detail для **`AprilJsonTreeEditor`** в изоляции и в тестах.
- [infra / compose / nginx] Не применялось.
- [docs] Обновлены **`docs/widgets/profile/entity-types-widget.md`** (схема Core vs Detail, ссылка на **`MASTER_DETAIL_WIDGET_PATTERN.md`**) и **`frontend/packages/profile-ui/README.md`**.

## 3) Изменённые файлы

- `docs/widgets/profile/entity-types-widget.md`
- `frontend/packages/profile-ui/README.md`
- `frontend/packages/profile-ui/src/components/EntityTypesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/EntityTypesWidgetDetailCore.tsx` (новый)
- `frontend/packages/profile-ui/src/components/EntityTypesWidgetDetailCore.test.tsx` (новый)
- `frontend/packages/profile-ui/src/index.ts`
- `tasks/071-micro-entity-types-widget-master-detail-refactor/PLAN.md` (новый)
- `tasks/071-micro-entity-types-widget-master-detail-refactor/REPORT.md` (этот файл)
- `tasks/071-micro-entity-types-widget-master-detail-refactor/TASK.md` (чеклист compliance)

## 4) Миграции и данные

- Миграции Atlas: нет
- Таблицы/индексы: не затрагивались
- Обратимость: не применимо

## 5) Проверка качества

- Линтер: ok (`tsc --noEmit` через `npm run lint`)
- Сборка: ok (`npm run build` в `frontend/packages/profile-ui`)
- Unit tests: ok (`EntityTypesWidgetCore`, `EntityTypesWidgetDetailCore`, 5 тестов)
- Integration tests: не запускались
- E2E / smoke: не запускались

Команды (фактически выполненные):

```bash
cd frontend/packages/profile-ui && npm run lint
cd frontend/packages/profile-ui && npm test -- --run EntityTypesWidgetCore EntityTypesWidgetDetailCore
cd frontend/packages/profile-ui && npm run build
```

## 6) Деплой

- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) — деплой не выполнялся
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения

- **`reloadRevisionsOnly`** по-прежнему вызывает `listRevisions` без отдельного `AbortSignal` (как в монолите до сплита); при гонках с быстрым переключением вкладок возможен лишний UI-шум — вынести в отдельный микро-фикс при необходимости.
- При полной сборке виджета Detail внутри Core получается вложенный **`DensityProvider`** — допустимо для текущего DS; при желании можно оставить провайдер только на одном уровне.
- В рабочем дереве может отображаться **`design-system/DisignApril`** как изменённый submodule — к задаче 071 не относится; не коммитить вместе без отдельного намерения.

## 8) Что осталось

- [ ] Режим **grid + `AprilModal`** по образцу profiles-widget (follow-up в постановке).
- [ ] При embed только детали — публичная обёртка **`EntityTypesWidgetDetail`** / Api-аналог по потребности продукта.
- [ ] Выравнивание телеметрии с **`WIDGET_CONTRACTS.md`** (follow-up).
