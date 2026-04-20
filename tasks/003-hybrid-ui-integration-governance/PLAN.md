# План: гибридная UI-модель и governance-артефакты

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-20
- **Статус плана:** согласован (выполнено)

## Исходные допущения

- Канонические тексты для разработчиков — в `docs/`; публикуемая копия ключевых страниц — в `docs-site/docs/` (как для `FRONTEND_STRATEGY`).
- Следующий свободный номер ADR в репозитории — **0004**.

## Порядок работ (факт)

1. Добавить ADR-0004 и строку в `docs/adr/README.md`.
2. Создать `docs/WIDGET_CONTRACTS.md`, матрицу, версионирование, чеклисты, observability, шаблоны.
3. Зеркалировать страницы в Docusaurus; завести индекс `ui-integration-governance.md`.
4. Обновить `docs/FRONTEND_STRATEGY.md` и синхронизировать `docs-site/docs/frontend-strategy.md`.
5. Обновить `tasks/000-full-service-aprilhub-roadmap/PLAN.md`, `README.md`, `docs-site/docs/intro.md`, `task_list.md`.
6. Проверить `make docs-build`; ссылки ADR на сайте — `/adr/hybrid-ui-integration-model` (slug).

## Затрагиваемые области

| Область | Что меняется |
|---------|----------------|
| Документация | `docs/`, `docs-site/docs/`, `docs/adr/`, `README.md`, roadmap `PLAN.md` |
| Код / БД | нет |

## Риски и откат

- **Риск:** битые ссылки в Docusaurus → **Митигация:** явный `slug` у ADR-0004, пути `/docs/...` из ADR.
- Откат: revert коммита с документацией.

## Проверка после выполнения

- `make docs-build` — успех.

## Примечания

- Связанные ADR: 0004; стратегия и контракты перекрёстно ссылаются друг на друга.
