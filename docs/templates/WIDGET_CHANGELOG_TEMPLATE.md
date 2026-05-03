# Changelog: `@april/<package>`

Формат основан на [Keep a Changelog](https://keepachangelog.com/); версии — [semver](https://semver.org/).

> **Пример заполнения** — ниже блок `[Unreleased]` оставьте для накопления; скопируйте секцию `## [0.3.0]` как образец при первом релизе.

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

---

## [0.3.0] — 2026-04-15

### Added

- Экспорт `EntityTypesWidget` для каталога типов сущностей и ревизий.

### Changed

- `ProfilesWidget`: высота списка в режиме `fill` согласована с `CardListColumn` host.

### Fixed

- Корректная обработка 409 при сохранении черновика схемы типа.

### Migration

- При обновлении с `0.2.x`: добавьте peer-зависимость `@april/ui` не ниже `0.1.9`, если поднимали DS в host.

---

## [x.y.z] — YYYY-MM-DD

### Added

- …

### Changed

- …

### Migration

- При обновлении с `x.y.(z-1)` …
