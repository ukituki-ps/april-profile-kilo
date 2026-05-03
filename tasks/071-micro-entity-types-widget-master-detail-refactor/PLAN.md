# PLAN: 071 — entity-types master–detail split

## Шаги выполнения

1. Вынести логику правой колонки в **`EntityTypesWidgetDetailCore`** (props: `familyId`, `onCatalogReload`, `onFamilyDeleted`, провайдер, host callbacks).
2. Оставить в **`EntityTypesWidgetCore`** только каталог (`listFamilies` + abort), выбор `selectedFamilyId`, модалку создания семейства.
3. Экспорт типов/компонента из **`src/index.ts`**, тесты Detail, обновление **`docs/widgets/profile/entity-types-widget.md`** и **`profile-ui/README.md`**.

## Риски

- Вложенные **`DensityProvider`** (Core + Detail) при полной сборке — допустимо для DS JSON.
- Генерация Detail из копии Core — ручная правка вместо повторного скрипта в репозитории.

## Проверки

`npm run lint`, `npm test -- --run EntityTypesWidgetCore EntityTypesWidgetDetailCore`.
