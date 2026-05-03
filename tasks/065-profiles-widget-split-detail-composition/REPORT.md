## 1) Итого

- Статус: ✅ выполнено
- Задача: split `profiles-widget` — самостоятельный npm-виджет детали/создания + составной `ProfilesWidget`; доки без отдельного `profiles-widget-list.md`
- Ветка: `feature/065-profiles-widget-split-detail-composition` (локальный коммит; merge через PR в `develop`)
- Коммиты: один коммит в ветке `feature/065-profiles-widget-split-detail-composition` (сообщение начинается с `feat(profile-ui): виджет детали профиля…`)
- PR: не создавался

## 2) Что сделано

- **[frontend / `@april/profile-ui`]** Вынесен **`ProfilesWidgetProfileDetailCore`** (карточка + модалка создания, `forwardRef` → **`openCreate` / `closeCreate`**). Публичные фасады **`ProfilesWidgetProfileDetail`** и **`ProfilesApiWidgetProfileDetail`**. **`ProfilesWidgetCore`** остаётся сборкой: **`CardListColumn`** + деталь; кнопка Add в списке вызывает **`detailRef.current.openCreate()`**. Удалён временный проп **`layout`** / тип **`ProfilesWidgetLayout`** (замена: **`ProfilesWidgetProfileDetail`**). Пропы **`documentEditingEnabled`** и **`allowProfileDelete`** гейтят редактирование/историческое сохранение/удаление в UI детали.
- **[тесты]** `ProfilesWidgetProfileDetailCore.test.tsx` (read-only, внешний `openCreate`, onError, update); сценарий **`detail-only`** удалён из `ProfilesWidgetCore.test.tsx`.
- **[демо]** `/demo/surfaces/profiles-widget-profile-detail` монтирует **`ProfilesWidgetProfileDetail`**; добавлен маршрут **`/demo/surfaces/profiles-widget`** (спека-сборка); **`/demo/surfaces/profiles-widget-list`** → **`Navigate`** на сборку. Обновлены `WidgetDemoPages`, `demoShared` (сид строк для standalone).
- **[docs]** Контент **`profiles-widget-list.md`** перенесён в раздел «Левая колонка» в **`profiles-widget.md`**; файл **`profiles-widget-list.md`** удалён. Обновлены **`profiles-widget-profile-detail.md`**, **`docs/widgets/README.md`**, **`frontend/README.md`**, **`docs-site/docs/widget-catalog.md`**.
- **[semver]** Версия пакета **`0.3.0` → `0.4.0`** (minor на ветке `0.x`: удаление `layout` / `ProfilesWidgetLayout` — breaking для типов и пропсов; добавлены новые экспорты).
- **[телеметрия]** События детального виджета по-прежнему используют **`widget: "profiles_list"`** (тип `ProfileWidgetTelemetryKind` не расширялся; совместимость с существующими дашбордами). Описано в спеке `profiles-widget-profile-detail.md`.

## 3) Изменённые файлы (основные)

- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesApiWidgetProfileDetail.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetail.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetProfileDetailCore.test.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/index.ts`, `package.json`, `README.md`
- `frontend/src/widgetDemos/surfaceDemos/SurfaceDocDemoPages.tsx`, `demoShared.ts`, `WidgetDemoPages.tsx`
- `frontend/src/App.tsx`, `App.test.tsx`, `frontend/README.md`
- `docs/widgets/profile/profiles-widget.md`, `profiles-widget-profile-detail.md` (удалён `profiles-widget-list.md`)
- `docs/widgets/README.md`, `docs-site/docs/widget-catalog.md`
- `tasks/065-profiles-widget-split-detail-composition/TASK.md` (ссылки)

Удалено: `ProfilesWidgetCore.backup.tsx`, `scripts/build_profiles_profile_detail_core.py`.

## 4) Миграции и данные

- Нет.

## 5) Проверка качества

- Линтер: ok (`cd frontend && npm run lint`)
- Сборка: не запускали `npm run build -w @april/profile-ui` в этой сессии (рекомендуется перед релизом пакета)
- Unit tests: ok

Команды (фактически выполненные):

```bash
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run
cd frontend && npm run lint && npm test -- --run
```

## 6) Деплой

- Не применялось (только frontend/docs).

## 7) Риски и ограничения

- Host, завязанные на **`layout="detail-only"`**, должны перейти на **`ProfilesWidgetProfileDetail`** и явно передавать **`entityId`** / **`listItem`** / **`listItemsForDuplicateCheck`**.
- Телеметрия не разделяет сборку и standalone-деталь по полю **`widget`** — при необходимости follow-up: расширить `ProfileWidgetTelemetryKind` и договориться с потребителями событий.

## 8) Что осталось

- [ ] PR в `develop`, прохождение CI на стороне репозитория.
