# Прикладной фронтенд (SPA)

В этом шаблоне **нет** сгенерированного Vite/React-приложения по умолчанию: репозиторий задаёт документацию, OpenAPI и инфраструктуру. Клиентское приложение сервиса добавляют сюда или в отдельный репозиторий — по договорённости команды.

## Дизайн-система April

Подключайте **`@april/tokens`** и **`@april/ui`** из вашего registry (источник и витрина — [DisignApril](https://github.com/ukituki-ps/DisignApril)). Пошаговые соглашения и предупреждение про `UIKit` — в [`docs/guides/DESIGN_SYSTEM.md`](../docs/guides/DESIGN_SYSTEM.md).

Типичный стек SPA в экосистеме April: **React**, **TypeScript**, **Vite**, **Mantine**, тема и провайдеры из `@april/ui`.

## Локальная разработка без опубликованных пакетов

1. Клонируйте [DisignApril](https://github.com/ukituki-ps/DisignApril), выполните `pnpm install` и `pnpm build` в корне монорепозитория.
2. В каталоге вашего SPA: `pnpm link` к собранным пакетам или укажите в `package.json` зависимости `file:../path/to/DisignApril/packages/ui` (и tokens), затем `pnpm install`.

После публикации `@april/*` в registry замените ссылки на semver-версии.
