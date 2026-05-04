# Задача 078 [DisignApril, внешнее исполнение] — контракт, код и тесты `AprilMobileShellBar` (стратегия A)

## Мета
- **Репозиторий выполнения:** **[DisignApril](https://github.com/ukituki-ps/DisignApril)** (не april-profile). Пакет **`packages/ui`**, публикация **`@ukituki-ps/april-ui`**.
- **Постановка в april-profile:** якорь эпика **074** — **волна B**, шаг 1.
- **Родитель:** [`tasks/074-phase-8-ds-gpr-and-mobile-shell-unification`](../074-phase-8-ds-gpr-and-mobile-shell-unification/).
- **Зависит от:** рекомендуется завершённая **волна A** (**075–077**), чтобы bump UI не смешивался с переходом на GPR; допускается параллель только при согласовании с командой.
- **Связанные документы (april-profile):** [`docs/adr/0006-mobile-chrome-layers-widget-host.md`](../../docs/adr/0006-mobile-chrome-layers-widget-host.md); submodule `design-system/DisignApril/DESIGN_SYSTEM.md` §8, §11.

## Цель
Довести **публичный контракт и реализацию** `AprilMobileShellBar` (и при необходимости смежных примитивов: `CardListColumn.hideMobileShellBar`, bottom sheet / back) в соответствие с **стратегией A** и нормативом DS; добавить/усилить **тесты в DS**; опубликовать новую версию **`@ukituki-ps/april-ui`**, если менялся runtime или типы.

## Входит в объём
- Синхронизация **JSDoc / типов** с `DESIGN_SYSTEM.md`.
- Тесты (Vitest/RTL) на критичные ветки поведения.
- Changelog / semver для consumer-реп.

## Не входит в объём
- Правки **`@april/profile-ui`** и Hub — задачи **079**, **080**.
- Переход на стратегию B (единая панель только в Hub).

## Критерии готовности (acceptance)
- [ ] В DisignApril: зелёные `pnpm test` / `pnpm build` для UI-пакета (команды по README репозитория).
- [ ] В GPR доступна версия пакета, потребляемая april-profile/april-worker после bump lock (**076/077** или follow-up micro-bump).

## Результат в отчёте
[`REPORT.md`](./REPORT.md): ссылка на PR в DisignApril, опубликованная версия `@ukituki-ps/april-ui`.

## Человекопонятная история в docs-site
- [ ] Опционально: блок в [`task-story-074`](../../docs-site/docs/task-story-074-phase-8-ds-gpr-mobile-shell-unification.md).
