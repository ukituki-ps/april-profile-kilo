## 1) Итого

- Статус: ✅ выполнено
- Задача: Рефакторинг UI `ProfilesWidget` — встраивание, версии, имя профиля
- Ветка: `feature/task-051-phase-6-profiles-widget-ui-refactor-embed-and-versions`
- Коммиты: `c799b6d`
- PR: не создавался (merge через PR по политике репозитория)

## 2) Что сделано

- [frontend] Расширен `ProfilesDataProvider`: опционально `getByVersion`, `listEntityTypes`; реализовано в `openapiProfilesProvider` (`GET …/versions/{v}`, `GET /v1/entity-types`).
- [frontend] Утилиты отображаемого имени и проверки уникальности имени по загруженному списку — `profileDisplay.ts`.
- [frontend] `ProfilesWidgetCore`: flex-layout на всю высоту хоста, колонки без жёстких 25/75%, повторная загрузка списка без полноэкранного лоадера при непустом списке; убраны отладочные заголовки; список по имени/версии; карточка с Select версий, исторические версии read-only + «Save snapshot as new version (+1)»; иконки действий (`@tabler/icons-react`); модалка создания с Select типа и полем имени; опциональный проп `initialCreateEntityTypeId`.
- [frontend] Тесты: обновлены `ProfilesWidgetCore`/`ProfilesListWidget`, добавлены кейсы в `openapiProfilesProvider.test.ts`; в `test/setup.ts` добавлен `scrollIntoView` для jsdom.
- [docs] Обновлены `docs/widgets/profile/profiles-widget.md`, `frontend/packages/profile-ui/README.md`, страница docs-site и overview.

## 3) Изменённые файлы

- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesApiWidget.tsx`
- `frontend/packages/profile-ui/src/profileDisplay.ts`
- `frontend/packages/profile-ui/src/providers/profilesDataProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiProfilesProvider.ts`
- `frontend/packages/profile-ui/src/providers/openapiProfilesProvider.test.ts`
- `frontend/packages/profile-ui/src/components/*.test.tsx`
- `frontend/packages/profile-ui/src/test/setup.ts`
- `frontend/packages/profile-ui/package.json`
- `frontend/packages/profile-ui/src/index.ts`
- `docs/widgets/profile/profiles-widget.md`
- `docs-site/docs/task-story-051-phase-6-profiles-widget-ui-refactor-embed-and-versions.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/PLAN.md`
- `tasks/051-phase-6-profiles-widget-ui-refactor-embed-and-versions/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет

## 5) Проверка качества

- Линтер: ok (`npm run lint -w @april/profile-ui`)
- Сборка: ok (`npm run build` в `frontend/`, включая `@april/profile-ui`)
- Unit tests: ok (`npm run test -w @april/profile-ui`)
- Integration tests (Go): ok (`go test ./...`)

Команды:

```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
go test ./...
```

## 6) Деплой

- Среда: нет (не входило в задачу)

## 7) Риски и ограничения

- Список версий строится запросами `GET …/versions/1..N-1` при текущей голове `N`; при очень больших `N` возможна нагрузка — при необходимости отдельный aggregate endpoint.
- Уникальность `document.name` проверяется только по уже загруженной странице списка; серверная уникальность — отдельная задача при появлении API.

## 8) Что осталось

- [ ] Серверная уникальность отображаемого имени профиля (при готовности контракта/миграций).
