---
sidebar_position: 245
---

# 045 - hardening контракта и Core для ProfilesWidget

## Проблема

После базового рефактора `ProfilesWidget` на `Core + ApiWidget` в коде оставались "почти-готовые" места:

- часть props-контракта варианта C не была доведена (`initialSort`, `autoSelectFirst`, `onOpenEntity`, `onError.code`);
- update-поток не передавал `expectedVersion` в provider-контракт;
- сортировка в list-запросе была захардкожена;
- в публичной документации не хватало этих деталей.

Это опасно для production, потому что команда и интеграторы начинают жить в разных "версиях правды": код делает одно, контракты обещают другое.

## Что сделали

1. Довели props-контракты `ProfilesWidgetCore` / `ProfilesApiWidget` / `ProfilesWidget` до варианта C:
   - `initialSort`
   - `autoSelectFirst`
   - `onOpenEntity`
   - `onError` с опциональным `code`.
2. Добавили `expectedVersion?: number` в `UpdateProfileInput` и пробросили из Core в `provider.update(...)`.
3. Убрали хардкод сортировки в Core и перевели list-запросы на `initialSort`.
4. Реализовали поведение `autoSelectFirst`:
   - по умолчанию авто-выбора нет;
   - при `autoSelectFirst=true` выбирается первый элемент.
5. Добавили вызов `onOpenEntity(entityId)` при пользовательском открытии карточки.
6. Обновили docs (`WIDGET_CONTRACTS`, widget card docs, package README) под фактический контракт.
7. Добавили/обновили тесты на новый контракт и поведение.

## Что это дает

- Контракт стал однозначным и проверяемым тестами.
- Хосты могут стабильно интегрироваться без догадок.
- Уменьшен риск скрытых регрессий в сортировке/выборе/обработке ошибок.
- Подготовлена почва для следующей задачи (046) по transport/abort/observability hardening.

## Как проверить без чтения кода

Из корня `frontend/`:

```bash
npm run lint -w @april/profile-ui
npm run test -w @april/profile-ui
npm run build -w @april/profile-ui
```

Ожидаемый результат: все команды проходят успешно.

## Границы задачи

Что сделано:

- контракт и поведение Core приведены к варианту C в рамках scope 045;
- тесты и документация синхронизированы.

Что осознанно оставлено на follow-up:

- полный `ProviderContext`, реальная отмена in-flight запросов и transport race hardening (задача 046);
- финальный release-gate и полная тест-матрица по всем уровням (задача 047).

## Артефакты

- [`tasks/045-phase-6-profiles-widget-contract-and-core-hardening/TASK.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/045-phase-6-profiles-widget-contract-and-core-hardening/TASK.md)
- [`tasks/045-phase-6-profiles-widget-contract-and-core-hardening/PLAN.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/045-phase-6-profiles-widget-contract-and-core-hardening/PLAN.md)
- [`tasks/045-phase-6-profiles-widget-contract-and-core-hardening/REPORT.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/045-phase-6-profiles-widget-contract-and-core-hardening/REPORT.md)
