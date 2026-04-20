# Матрица решений: режим интеграции UI

> Связанные документы: [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md), [`adr/0004-hybrid-ui-integration-model.md`](./adr/0004-hybrid-ui-integration-model.md), [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md).  
> Опубликованная копия: `docs-site/docs/decision-matrix-ui-integration.md`.

Термины: **Host-driven**, **Widget-driven**, **API/BFF-first** — см. стратегию и ADR-0004.

---

## Краткая матрица

| Критерий | Host-driven | Widget-driven | API/BFF-first |
|----------|-------------|---------------|---------------|
| **Когда применять** | Уникальный экран, сложная IA, оркестрация, мало повторного использования между сервисами | Один и тот же блок нужен в Hub и/или нескольким командам (Profile, NFlow, …) | Ранний этап, нет готового виджета; тонкий клиент; автоген UI не оправдан |
| **Сильные стороны** | Полный контроль host, простая отладка в одном репо | Переиспользование, единый UX, semver | Быстрый time-to-market, минимум фронтовой поверхности |
| **Риски** | Дублирование логики между сервисами | Версии, совместимость, нагрузка на процесс релиза | Разнообразие UX, дублирование вызовов API в разных host |
| **Стоимость владения** | Низкая на старте; растёт при копипасте | Средняя: CI, semver, документация, review интеграций | Низкая–средняя; технический долг на стороне host при росте UX-требований |
| **Anti-patterns** | Копирование больших кусков между микрофронтами без выделения примитивов | Бизнес-логика в DS; виджет тянет роутер | Обход BFF; хардкод tenant в UI |

---

## Правила выбора (приоритет сверху вниз)

1. **Нужен идентичный UX-блок в ≥2 местах или репозиториях** → склоняться к **Widget-driven** (после оценки стоимости пакета).
2. **Экран уникален для операторов и не переиспользуется** → **Host-driven**.
3. **Нет ресурсов на UI; API готов; нужен только доступ к данным** → **API/BFF-first** с планом миграции к виджету при стабилизации UX.
4. **Противоречие между 1 и 2** → зафиксировать решение в спецификации ([`templates/WIDGET_SPEC_TEMPLATE.md`](./templates/WIDGET_SPEC_TEMPLATE.md)) и кратко в PR.

---

## Связь с доставкой кода

- **npm-пакет** — основной путь для Widget-driven.
- **Module Federation** — не меняет контрактов [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md); меняется только доставка бандла (см. [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md)).

---

## Перекрёстные ссылки

- Версии: [`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md)  
- Чеклисты: [`WIDGET_RELEASE_CHECKLIST.md`](./WIDGET_RELEASE_CHECKLIST.md), [`WIDGET_INTEGRATION_CHECKLIST.md`](./WIDGET_INTEGRATION_CHECKLIST.md)
