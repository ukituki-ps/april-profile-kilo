## 1) Итого

- Статус: ✅ выполнено
- Задача: демо `/demo/surfaces/profiles-widget-profile-detail` — только правая колонка, MSW
- Ветка: локально в рабочем дереве (PR — по процессу команды)
- Коммиты: (зафиксировать при merge)
- PR: не создавался из среды агента

## 2) Что сделано

- **[frontend / `@april/profile-ui`]** Добавлен проп **`layout`**: `"master-detail"` (по умолчанию) | `"detail-only"`. В режиме **`detail-only`** не рендерится колонка со списком (`CardListColumn`); список по-прежнему запрашивается у провайдера для выбора и мутаций. Для создания профиля без колонки списка добавлена кнопка **Create profile** над карточкой. `data-testid`: `profiles-widget-list-column`, `profiles-widget-detail-column`.
- **[frontend shell]** Страница **`ProfilesWidgetProfileDetailSurfaceDemoPage`** монтирует **`ProfilesWidget`** с `layout="detail-only"` и `autoSelectFirst`. У **`SurfaceDocDemoChrome`** добавлен опциональный **`howToReadDemo`** вместо текста про «полный виджет».
- **[docs]** В **`profiles-widget-profile-detail.md`** — раздел про демо-маршрут и `layout`.
- **[тесты]** `ProfilesWidgetCore.test.tsx` — сценарий `detail-only`; `App.test.tsx` — маршрут profile-detail и отсутствие `profiles-widget-list-column`.

## 3) Изменённые файлы

- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesApiWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `frontend/packages/profile-ui/src/index.ts`
- `frontend/packages/profile-ui/README.md`
- `frontend/src/widgetDemos/surfaceDemos/SurfaceDocDemoPages.tsx`
- `frontend/src/widgetDemos/WidgetDemoPages.tsx`
- `frontend/src/App.test.tsx`
- `frontend/README.md`
- `docs/widgets/profile/profiles-widget-profile-detail.md`
- `tasks/064-frontend-profiles-surface-detail-column-only/REPORT.md`
- `tasks/064-frontend-profiles-surface-detail-column-only/TASK.md` (чеклисты приёмки)
- `task_list.md` (статус задачи 064)

## 4) Миграции и данные

- Нет.

## 5) Проверка качества

- Линтер: ok (`npm run lint` в `frontend/`, `npm run lint -w @april/profile-ui`)
- Сборка: не запускали полный `npm run build` (изменения типизируются через `tsc --noEmit`)
- Unit tests: ok (`npm test -- --run` в `frontend/`, `npm run test -w @april/profile-ui -- --run`)

Команды (фактически выполненные):

```bash
cd frontend && npm run lint -w @april/profile-ui && npm run test -w @april/profile-ui -- --run
cd frontend && npm run lint && npm test -- --run
```

Ручная проверка: `cd frontend && VITE_PROFILE_DEMO_MOCK=true npm run dev` → открыть `/demo/surfaces/profiles-widget-profile-detail`: слева списка нет, карточка с документом после автозагрузки первого профиля.

## 6) Риски и follow-up

- **Риск:** в `detail-only` нет поиска/фильтра списка; смена выбранного профиля без host-колбэка навигации или без нового пропа `initialEntityId` не реализована (не входило в scope).
- **Follow-up:** при необходимости для хоста — явный проп **`initialEntityId`** / синхронизация выбора только извне, отдельный экспорт «только деталь» без загрузки полного списка (если появится отдельный API).
