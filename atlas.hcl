// Конфигурация Atlas для миграций AprilProfile.
// Локально: export DATABASE_URL=... затем `make migrate-apply`.
// См. также `docker compose --profile db up -d postgres`.

env "local" {
  url = getenv("DATABASE_URL")
  migration {
    dir = "file://atlas/migrations"
  }
}
