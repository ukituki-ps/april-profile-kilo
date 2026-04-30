## 1) Итого
- Статус: ✅ выполнено
- Задача: 4 UX-правки `profiles-widget` (page size, collapse-width, full-height JSON, action icon для snapshot)
- Ветка: `develop`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [frontend] В `ProfilesWidgetCore` default размер страницы изменён с `5` на `20`, чтобы изначально подгружались 20 карточек.
- [frontend] В `ProfilesWidgetCore` обновлён layout левой колонки: добавлен state `listCollapsed`, переключение по `Collapse list` / `Expand list` и адаптивная ширина контейнера (`72px` в collapsed), чтобы правая карточка реально расширялась.
- [frontend] Кнопка `Save snapshot as new version (+1)` перенесена в ряд action-кнопок как `ActionIcon` с tooltip.
- [frontend] `Textarea` для `Profile document` и `Updated document` переведены на полно-высотный режим (`flex:1`, `minHeight:0`, `height:100%`) без искусственного ограничения `minHeight: 200`.
- [frontend/tests] Добавлен unit test на default `pageSize=20` в первом list-запросе.
- [docs/tasks] Созданы артефакты micro-task: `TASK.md` и `REPORT.md`.

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.test.tsx`
- `tasks/055-micro-profiles-widget-list-layout-actions/TASK.md`
- `tasks/055-micro-profiles-widget-list-layout-actions/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (изменения только в UI/test/docs)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не применялось
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md` (деплой не требовался)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не применялся

## 7) Риски и ограничения
- Состояние collapse отслеживается через клики по DS-кнопкам `aria-label` (`Collapse list` / `Expand list`); при изменении этих label в DS потребуется синхронное обновление селекторов в `ProfilesWidgetCore`.
- В рамках micro-task не добавлялись e2e/visual проверки поведения ресайза колонки в браузере.

## 8) Что осталось
- [ ] При необходимости заменить click-based синхронизацию collapse-состояния на явный callback из `CardListColumn`, когда такой API появится в `@april/ui`.
