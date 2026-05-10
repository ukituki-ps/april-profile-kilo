---
sidebar_position: 255
---

# 074 — Фаза 8: GitHub Packages для DS и единый контур `AprilMobileShellBar`

## Проблема

Сейчас **`@april/ui`** и токены в april-profile в типовом потоке ставятся из **vendored `.tgz`**, а в **AprilHub** (`hub-shell`) — из **`file:`** на исходники submodule. Это два разных канала одной версии DS: легко получить расхождение пропов и `dist` (см. также **ADR-0006** про актуальные пропы в shell). Параллельно норматив **стратегии A** для нижней mobile-панели должен быть согласован между **DisignApril**, **виджетами** и **host**.

## Что делаем (две волны)

**Волна A — поставка**

1. **[075]** [DisignApril](https://github.com/ukituki-ps/DisignApril) (или согласованный publish из [april-worker](https://github.com/ukituki-ps/april-worker)): пакеты **`@ukituki-ps/april-tokens`** / **`@ukituki-ps/april-ui`** в GitHub Packages.
2. **[076]** [april-profile](https://github.com/ukituki-ps/april-profile): `frontend/` переводим на **`npm:@ukituki-ps/…`** (алиасы **`@april/*`**), убираем `.tgz` из git, обновляем lock и доки.
3. **[077]** [april-worker](https://github.com/ukituki-ps/april-worker): `hub-shell` — то же потребление из GPR, `ds:prepare` без обязательной сборки всего DS из submodule при каждом `npm ci`.

**Волна B — mobile chrome**

4. **[078]** DisignApril: контракт и тесты **`AprilMobileShellBar`** (и смежное по ADR-0006 / DS §8–11), публикация новой версии UI при необходимости.
5. **[079]** april-profile: **`@april/profile-ui`** и shell — стратегия A, один активный контекст панели, back-order, тесты и карточки виджетов (закрыто: вложенный лист версий без параллельной `AprilMobileShellBar` детали; bump **`@ukituki-ps/april-ui` / tokens** к **0.1.10** по **078** — см. [`tasks/079-april-profile-profile-ui-mobile-shell-strategy-a/REPORT.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/079-april-profile-profile-ui-mobile-shell-strategy-a/REPORT.md)).
6. **[080]** april-worker: согласование **глобального dock Hub** с виджетом, bump **`vendor/april-profile`**, e2e smoke на mobile.

## Что это даёт

- **Одна строка версии** в lockfile и предсказуемый **`npm ci`** с **`NODE_AUTH_TOKEN`** (read:packages).
- Меньше риска «host игнорирует контрактные пропы» и «двойной низ» на мобилке при дисциплине ADR-0006.

## Как проверить (когда волны закрыты)

1. `cd frontend && npm ci && npm run test && npm run build` (с токеном GPR).
2. В клоне april-worker: `cd hub-shell && npm ci && npm run test` (с токеном); e2e smoke по профилю на узком viewport.
3. Технические критерии — в [`tasks/074-phase-8-ds-gpr-and-mobile-shell-unification/TASK.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/074-phase-8-ds-gpr-and-mobile-shell-unification/TASK.md) и дочерних **`TASK.md`** (**075–080**).

## Границы

- **Стратегия B** (единая панель только в Hub) — не входит; отдельный ADR.
- Исполнение **075, 077, 078, 080** — вне репозитория april-profile; здесь только постановка и трекинг.

## Артефакты

- Эпик: [`tasks/074-phase-8-ds-gpr-and-mobile-shell-unification/`](https://github.com/ukituki-ps/april-profile/tree/develop/tasks/074-phase-8-ds-gpr-and-mobile-shell-unification) (`TASK.md`, `PLAN.md`).
- Подзадачи **075–080** — см. ссылки в [`tasks/074-phase-8-ds-gpr-and-mobile-shell-unification/TASK.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/074-phase-8-ds-gpr-and-mobile-shell-unification/TASK.md).
- **077** (AprilHub / `hub-shell` в **april-worker**): отчёт исполнения — [`tasks/077-external-april-worker-hub-shell-ds-gpr-consumption/REPORT.md`](https://github.com/ukituki-ps/april-profile/blob/develop/tasks/077-external-april-worker-hub-shell-ds-gpr-consumption/REPORT.md).
