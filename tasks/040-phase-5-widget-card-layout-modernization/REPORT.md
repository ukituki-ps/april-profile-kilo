## 1) Итого
- Статус: ✅ выполнено
- Задача: 040 — переделка `widget-card` в двухколоночный master-detail UX
- Ветка: `feature/task-040-widget-card-layout-modernization`
- Коммиты: `9447eb6`
- PR: https://github.com/ukituki-ps/april-profile/pull/87

## 2) Что сделано
- [backend] Изменений нет (задача полностью frontend/UI).
- [frontend] `ProfilesListWidget` переработан под 25/75 layout:
  - слева DS-колонка `CardListColumn` (`@april/ui`) с поиском, фильтром типа, incremental loading (`onReachListEnd`) и явным выделением выбранного профиля;
  - справа карточка выбранного профиля с режимами просмотра и редактирования;
  - создание профиля вынесено в модалку, открываемую по кнопке "плюс";
  - добавлены отдельные состояния `loading/empty/error` для списка/деталей/мутаций.
- [frontend] Showcase-shell синхронизирован: в `frontend/src/App.tsx` demo breadcrumbs переведены с `Group` на `Box`+flex для единообразия с DS-паттерном.
- [frontend] Обновлён submodule `design-system/DisignApril` до актуального `origin/main` (`52c1866`, включает PR #13 по `CardListColumn` spacing/no-group цепочке).
- [infra / compose / nginx] Изменений нет.
- [docs] Обновлены:
  - `frontend/packages/profile-ui/README.md` (новый UX-поток `ProfilesListWidget`);
  - `tasks/040.../TASK.md` (acceptance + docs-site checklist);
  - `docs-site/docs/task-story-040-phase-5-widget-card-layout-modernization.md`;
  - `docs-site/docs/task-stories-overview.md`;
  - `task_list.md`.
- [tests] Обновлён `ProfilesListWidget.test.tsx` под новый master-detail сценарий (поиск/пагинация, create/update/delete, secure error mapping).

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.tsx`
- `frontend/packages/profile-ui/src/components/ProfilesListWidget.test.tsx`
- `frontend/packages/profile-ui/README.md`
- `frontend/src/App.tsx`
- `design-system/DisignApril` (submodule pointer)
- `tasks/040-phase-5-widget-card-layout-modernization/TASK.md`
- `tasks/040-phase-5-widget-card-layout-modernization/PLAN.md`
- `tasks/040-phase-5-widget-card-layout-modernization/REPORT.md`
- `docs-site/docs/task-story-040-phase-5-widget-card-layout-modernization.md`
- `docs-site/docs/task-stories-overview.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert frontend/docs изменений)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не применялось
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
cd frontend && npm run lint && npm run test && npm run build
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- В RTL-тестах для `ProfilesListWidget` добавлен мок `@april/ui` (и `Modal`) для стабильной изоляции поведения виджета в jsdom; это компромисс между проверкой бизнес-сценариев и внутренней реализацией DS-компонента.
- Список профилей в виджете по-прежнему строится по переданному набору `entityIds` и локально синхронизируется после CRUD (без серверного list endpoint, как и до задачи).

## 8) Что осталось
- [ ] При появлении серверного list endpoint вынести фильтрацию/дозагрузку в server-side режим с `onReachListEnd` без client-side полного списка.
- [ ] Добавить e2e-проверку потока master-detail + modal create в окружении AprilHub host.
