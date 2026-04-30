## 1) Итого
- Статус: ✅ выполнено
- Задача: Micro-обновление DS до `0.1.1` и `heightMode="fill"` для списка профилей
- Ветка: `develop`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [frontend] `frontend/.npmrc` переведён на GitHub Packages для scope `@ukituki-ps`.
- [frontend] В `frontend/package.json` `@april/ui` и `@april/tokens` переведены на alias-зависимости `npm:@ukituki-ps/*`.
- [frontend] В `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx` в `CardListColumn` добавлен `heightMode="fill"`.
- [frontend] Обновлён `frontend/package-lock.json` после `npm install`.
- [docs] Созданы артефакты micro-задачи: `tasks/052-micro-ds-0-1-1-and-profile-list-fill/TASK.md` и `REPORT.md`.

## 3) Изменённые файлы
- `frontend/package.json`
- `frontend/.npmrc`
- `frontend/package-lock.json`
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `tasks/052-micro-ds-0-1-1-and-profile-list-fill/TASK.md`
- `tasks/052-micro-ds-0-1-1-and-profile-list-fill/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да, откатом версий пакетов и удалением пропса

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не применялось
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
cd frontend && npm install
cd frontend && npm run lint -w @april/profile-ui
cd frontend && npm run test -w @april/profile-ui
cd frontend && npm run build -w @april/profile-ui
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- Для локальной/CI установки из GitHub Packages обязателен валидный `NODE_AUTH_TOKEN` с `read:packages`.

## 8) Что осталось
- [ ] Ручная smoke-проверка UI: список занимает доступную высоту, внутренний скролл корректен, экраны без `heightMode` не регрессировали.
