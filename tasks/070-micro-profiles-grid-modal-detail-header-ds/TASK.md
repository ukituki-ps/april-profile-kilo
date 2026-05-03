# TASK: micro — profiles grid modal detail header (DS)

## Мета

- **id:** `070-micro-profiles-grid-modal-detail-header-ds`
- **ветка (рекомендация):** `fix/profiles-grid-modal-detail-header-ds`
- **приоритет:** P2 (UI / DS)
- **файлы:** `frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx`, `ProfilesWidgetProfileDetailCore.tsx`

## Цель

В режиме **grid** модалка детальной карточки профиля: панель действий в одной линии с кнопкой закрытия (`AprilModal.headerActions`, как у **Create profile**). Имя профиля — только в заголовке модалки; в теле детальной карточки при открытии в модалке заголовок не дублировать. В режиме **list** (не модалка) имя в колонке детальной карточки остаётся.

## Scope

**Входит:** выравнивание по DS (`AprilModal`), убрать дублирование названия в контенте при grid+modal, синхронизация заголовка модалки с `displayName` из документа по мере загрузки.

**Не входит:** сетка create-flow (уже отдельная вёрстка), изменения `AprilModal` в DS, рефакторинг провайдера.

## AGENT_MASTER_PROMPT compliance

- [x] DS-first: используем существующий `AprilModal.headerActions`.
- [x] Scope по постановке.
- [x] Отчёт `REPORT.md` по шаблону проекта.

## Acceptance criteria

1. В grid при выбранном профиле кнопки версии / режима / редактирования / удаления визуально в одной строке с системным close модалки (как create с `headerActions`).
2. В этом режиме в теле детальной карточки нет второго `Title` с именем; в list-колонке детальной карточки имя по-прежнему видно.
3. Линт/тесты пакета `profile-ui` для затронутых файлов зелёные.

## Проверка

```bash
cd frontend/packages/profile-ui && npm test -- --run ProfilesWidgetCore.test.tsx ProfilesWidgetProfileDetailCore.test.tsx
cd frontend/packages/profile-ui && npm run lint
```

## Ожидаемый результат в REPORT

Список изменений, результаты команд, риски, follow-up.
