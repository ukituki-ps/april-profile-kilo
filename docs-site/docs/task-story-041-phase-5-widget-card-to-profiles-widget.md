---
sidebar_position: 51
---

# 041 — Выделение отдельного виджета `Profiles` из `widget-card`

## Какая была проблема

После задачи 040 у нас уже был удобный двухколоночный UX, но он оставался завязан на название и контекст `widget-card`/`ProfilesListWidget`. Для продуктовой и интеграционной коммуникации нужен отдельный виджет `Profiles` с понятным публичным контрактом.

## Что сделали

- Добавили самостоятельный компонент `ProfilesWidget` в `@april/profile-ui`.
- Закрепили его как отдельный публичный экспорт пакета.
- Оставили `ProfilesListWidget` как backward-compatible alias, чтобы не ломать текущие host-встраивания.
- Обновили demo-маршрут: основной сценарий теперь `profiles-widget-demo` (старый URL оставлен как alias).
- Актуализировали тесты: основной CRUD/scenario coverage теперь идёт через `ProfilesWidget`.
- Обновили docs-каталог виджетов и добавили карточку `profiles-widget`.

## Что это даёт команде и пользователям

- Появилось ясное продуктовое имя виджета (`Profiles`) без зависимости от внутреннего исторического нейминга.
- Интеграторам проще подключать и документировать виджет как отдельный контракт.
- Переход безопасный: старые интеграции не ломаются за счёт alias `ProfilesListWidget`.

## Как проверить без чтения кода

1. Выполнить проверки: `cd frontend && npm run lint && npm run test && npm run build`.
2. Открыть демо `http://localhost:5174/profiles-widget-demo`.
3. Проверить, что работают сценарии списка и карточки профиля: поиск/фильтр/дозагрузка, create/update/delete.
4. Убедиться, что старый путь `http://localhost:5174/profiles-list-widget-demo` тоже открывает тот же сценарий (alias).

## Границы и follow-up

- В рамках задачи не менялись backend API-контракты и OpenAPI.
- Не менялась IAM-модель (Keycloak/RBAC/ABAC остаётся серверной ответственностью).
- Не затрагивались остальные виджеты (`ProfileInstances`, `InstanceHistory`, `ConflictQueue`) кроме общего уровня документации.

## Ссылки на артефакты

- `tasks/041-phase-5-widget-card-to-profiles-widget/TASK.md`
- `tasks/041-phase-5-widget-card-to-profiles-widget/PLAN.md`
- `tasks/041-phase-5-widget-card-to-profiles-widget/REPORT.md`
