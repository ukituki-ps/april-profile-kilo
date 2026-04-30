## 1) Итого
- Статус: ✅ выполнено
- Задача: добавить `height: 100%` для `mantine-Input-wrapper` и `mantine-Textarea-wrapper` в `profiles-widget`
- Ветка: `develop`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [frontend] В `ProfilesWidgetCore` обновлены стили двух `Textarea` в правой панели (`Profile document` и `Updated document`).
- [frontend] Для wrapper-уровня добавлен `height: "100%"` через `styles.wrapper`, что применяется к элементу с классами `mantine-Input-wrapper` / `mantine-Textarea-wrapper`.
- [frontend] Сохранены существующие полно-высотные ограничения для `root` и `input`, чтобы поле корректно тянулось до низа панели.
- [docs/tasks] Добавлена новая micro-task папка с постановкой и отчётом.

## 3) Изменённые файлы
- `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`
- `tasks/20260430-micro-profiles-widget-textarea-wrapper-height/TASK.md`
- `tasks/20260430-micro-profiles-widget-textarea-wrapper-height/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (изменения только в UI/документации)

## 5) Проверка качества
- Линтер: ok (`ReadLints`, ошибок нет)
- Сборка: ok
- Unit tests: ok
- Integration tests: не применялось
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
cd frontend && npm run test -w @april/profile-ui && npm run build -w @april/profile-ui
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md` (деплой не требовался)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не применялся

## 7) Риски и ограничения
- Проверка полно-высотного поведения выполнена через unit/build и кодовую правку; визуальный e2e snapshot по вёрстке не добавлялся в рамках micro-task.

## 8) Что осталось
- [ ] При появлении visual regression тестов для `profile-ui` добавить проверку растяжения редактора в collapsed/expanded layout.
