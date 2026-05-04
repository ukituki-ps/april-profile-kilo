# Эпик: Фаза 8 — GitHub Packages для `@april/ui` и единый контур `AprilMobileShellBar`

## Мета
- **Репозиторий постановки и координации:** **april-profile** (этот репозиторий). Реализация распределена по **DisignApril**, **april-profile**, **april-worker** — см. дочерние задачи.
- **ID:** 074
- **Приоритет:** обычный
- **Связанные документы:** [`docs/adr/0006-mobile-chrome-layers-widget-host.md`](../../docs/adr/0006-mobile-chrome-layers-widget-host.md); [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md) (§8, §11); эпик registry **048–050** ([`tasks/048-phase-7-ds-npm-registry-deps-lock-npmrc`](../048-phase-7-ds-npm-registry-deps-lock-npmrc/)); мобильные задачи **072–073** ([`tasks/072-…`](../072-profiles-widget-mobile-shell-bottom-sheet/), [`tasks/073-…`](../073-profiles-widget-profile-detail-mobile-shell-toolbar/)).

## Цель
Две последовательные волны: **(A)** перевести потребление дизайн-системы на **приватный npm (GitHub Packages)** вместо vendored `*.tgz` и расходящихся `file:` на исходники submodule; **(B)** довести **рефакторинг и контракт `AprilMobileShellBar`** (стратегия A из ADR-0006) по цепочке DS → виджеты → Hub, без «двойного низа» и с предсказуемым back-stack.

## Входит в объём эпика
- Координация порядка работ, версий и критериев приёмки между репозиториями (см. [`PLAN.md`](./PLAN.md)).
- Закрытие эпика: все дочерние задачи **075–080** имеют `REPORT.md` или явный defer в `notes.md` по согласованию.

## Не входит в объём
- Стратегия B (единая панель только в Hub) — отдельный ADR и эпик.
- Изменения вне перечисленных репозиториев (например отдельный infra-репозиторий) — только по ссылке из дочерних задач.

## Дочерние задачи (репозиторий в названии)

| № | Папка | Где исполняется |
|---|--------|-----------------|
| 075 | [`tasks/075-external-DisignApril-ds-packages-gpr-publish/`](../075-external-DisignApril-ds-packages-gpr-publish/) | **DisignApril** (или согласованный publish-путь через **april-worker**) |
| 076 | [`tasks/076-april-profile-frontend-ds-gpr-consumption-remove-tgz/`](../076-april-profile-frontend-ds-gpr-consumption-remove-tgz/) | **april-profile** |
| 077 | [`tasks/077-external-april-worker-hub-shell-ds-gpr-consumption/`](../077-external-april-worker-hub-shell-ds-gpr-consumption/) | **april-worker** |
| 078 | [`tasks/078-external-DisignApril-april-mobile-shell-bar-refactor/`](../078-external-DisignApril-april-mobile-shell-bar-refactor/) | **DisignApril** |
| 079 | [`tasks/079-april-profile-profile-ui-mobile-shell-strategy-a/`](../079-april-profile-profile-ui-mobile-shell-strategy-a/) | **april-profile** |
| 080 | [`tasks/080-external-april-worker-hub-mobile-chrome-e2e/`](../080-external-april-worker-hub-mobile-chrome-e2e/) | **april-worker** |

## Критерии готовности эпика (acceptance)
- [ ] **Волна A:** `npm ci` в `frontend/` april-profile и в `hub-shell/` april-worker подтягивает **`@ukituki-ps/april-ui`** / **`@ukituki-ps/april-tokens`** из GPR (алиасы `@april/*` в lock), без обязательных `.tgz` в git для типового потока.
- [ ] **Волна B:** код и доки согласованы с ADR-0006 и DS §8/§11; тесты/e2e по согласованному чеклисту зелёные на стороне исполнителей.
- [ ] В `task_list.md` отмечены выполненные подзадачи; в [`PLAN.md`](./PLAN.md) зафиксирован фактический порядок merge и версии пакетов.

## Человекопонятная история в docs-site
- [x] Страница [`docs-site/docs/task-story-074-phase-8-ds-gpr-mobile-shell-unification.md`](../../docs-site/docs/task-story-074-phase-8-ds-gpr-mobile-shell-unification.md); строка в [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) (обновить статус таблицы на ✅ после закрытия эпика **075–080**).
