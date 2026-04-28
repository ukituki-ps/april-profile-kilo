---
sidebar_position: 4
---

# Дизайн-система April (`@april/tokens`, `@april/ui`)

Исходники, витрина и полные соглашения — в репозитории **[DisignApril](https://github.com/ukituki-ps/DisignApril)** (pnpm workspace: `packages/tokens`, `packages/ui`, при необходимости `apps/showcase`).

В этом шаблоне дизайн-система **подключена как git submodule** `design-system/DisignApril`, а прикладной **минимальный shell** — в каталоге **`frontend/`** (Vite + React + `AprilProviders` из `@april/ui`). Так все микросервисы на базе шаблона **сразу строятся на одной и той же DS**, без расхождения версий «из головы».

## 1. Первый клон

```bash
git clone --recurse-submodules <url>
# или после обычного clone:
git submodule update --init --recursive
```

## 2. Сборка DS и приложения

Из корня репозитория или из `frontend/`:

```bash
cd frontend
npm ci
npm run ds:prepare   # pnpm install + build в design-system/DisignApril
npm run dev          # разработка
npm run build        # prebuild вызывает ds:prepare
```

`ds:prepare` собирает пакеты `@april/tokens` и `@april/ui` в submodule; зависимости в `frontend/package.json` указывают на `file:../design-system/DisignApril/packages/...` (как в AprilHub `hub-shell`).

## 3. Пакеты

| Пакет | Назначение |
| ----- | ---------- |
| `@april/tokens` | Токены (цвета, плотность, логотип), CSS для сервисов без React (`import '@april/tokens/css'`) |
| `@april/ui` | Тема Mantine, `AprilProviders`, плотность; peer — `@mantine/core`, `@emotion/react`, React 18 |

Подробности по токенам и паттернам — в `DESIGN_SYSTEM.md` внутри репозитория DisignApril.

## 3.1 Политика DS-first (обязательно)

Для продуктовых задач по фронтенду действует приоритет:

1. Использовать готовый компонент/паттерн из `@april/ui`.
2. Если не хватает поведения — сначала сделать тонкую обёртку вокруг DS-компонента.
3. Кастомный UI с нуля — только как исключение, с фиксацией причин в `TASK.md` и `REPORT.md`.

Это правило нужно, чтобы не плодить визуальные и поведенческие расхождения между сервисами April.

## 4. Минимальный shell (корень приложения)

```tsx
import '@mantine/core/styles.css';
import { AprilProviders } from '@april/ui';

export function App() {
  return (
    <AprilProviders>
      {/* маршрутизатор и экраны сервиса */}
    </AprilProviders>
  );
}
```

При экранах с `@xyflow/react` добавьте `import '@xyflow/react/dist/style.css'`.

## 5. Продакшен: пакеты из registry

Когда `@april/tokens` и `@april/ui` публикуются в npm-совместимый registry, в форке можно заменить `file:` на semver-версии в `frontend/package.json` и убрать submodule (или оставить submodule только для локальной разработки — по политике команды).

## 6. Важно: не тяните витрину в релиз

Компонент **`UIKit`** в `@april/ui` — для разработки и ревью. В продакшене не импортируйте `UIKit`; витрина — `pnpm dev` в DisignApril или внутренний стенд.

## 7. Связка с репозиторием

- Подсказки по структуре — файл `frontend/README.md` в корне репозитория.
- Версии инструментов — [`VERSIONS.md`](./VERSIONS.md).
