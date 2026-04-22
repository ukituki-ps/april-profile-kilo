#!/usr/bin/env bash
# Atlas: применить миграции до docker compose up (вызывается из deploy.sh).
# Требуется DATABASE_URL в окружении или в .env в корне репозитория (см. .env.example).
# Без DATABASE_URL — выход 0 (пропуск), чтобы не ломать окружения без БД.
# Первый запуск: Postgres должен быть доступен по DATABASE_URL (часто уже поднят
# предыдущим compose); иначе задайте SKIP_MIGRATIONS=1 или поднимите только postgres.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ATLAS_IMAGE="${ATLAS_IMAGE:-arigaio/atlas:0.32.0}"

if [[ -f .env ]]; then
	set -a
	# shellcheck disable=SC1091
	source .env
	set +a
fi

if [[ -z "${DATABASE_URL:-}" && -z "${MIGRATION_DATABASE_URL:-}" && -z "${POSTGRES_PASSWORD:-}" ]]; then
	echo "[run-migrations] DATABASE_URL не задан — пропуск миграций (добавьте в серверный .env для автоприменения при деплое)" >&2
	exit 0
fi

# Источник URL для Atlas (хост 127.0.0.1, --network host в docker run ниже):
# 1) MIGRATION_DATABASE_URL — явный override;
# 2) иначе, если задан POSTGRES_PASSWORD (как у сервиса postgres в compose), собираем строку из тех же
#    POSTGRES_* что и контейнер — чтобы не расходился пароль с устаревшим DATABASE_URL в .env (типичный dev);
# 3) иначе DATABASE_URL: хост 127.0.0.1 и порт publish из POSTGRES_PORT (как в compose), не :5432 из URL
#    (в URL после postgres — внутренний порт контейнера; с хоста нужен проброшенный порт).
MIGRATE_URL=""
# Порт на хосте, куда проброшен postgres (левый side в compose ports); дефолт как в docker-compose.yml.
HOST_PG_PORT="${POSTGRES_PORT:-15432}"
if [[ -n "${MIGRATION_DATABASE_URL:-}" ]]; then
	MIGRATE_URL="${MIGRATION_DATABASE_URL}"
elif [[ -n "${POSTGRES_PASSWORD:-}" ]]; then
	PG_USER="${POSTGRES_USER:-april}"
	PG_DB="${POSTGRES_DB:-april_profile}"
	PG_PORT="${HOST_PG_PORT}"
	PG_PASS_ENC="${POSTGRES_PASSWORD}"
	if command -v python3 >/dev/null 2>&1; then
		PG_PASS_ENC="$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "${POSTGRES_PASSWORD}")"
	fi
	MIGRATE_URL="postgres://${PG_USER}:${PG_PASS_ENC}@127.0.0.1:${PG_PORT}/${PG_DB}?sslmode=disable"
	echo "[run-migrations] используется URL из POSTGRES_* (хост 127.0.0.1) для согласованности с compose" >&2
elif [[ -n "${DATABASE_URL:-}" ]]; then
	MIGRATE_URL="${DATABASE_URL}"
	if [[ "${MIGRATE_URL}" == *"@postgres:5432"* ]]; then
		MIGRATE_URL="${MIGRATE_URL/@postgres:5432/@127.0.0.1:${HOST_PG_PORT}}"
		echo "[run-migrations] подмена postgres:5432 → 127.0.0.1:${HOST_PG_PORT} (Atlas с хоста)" >&2
	elif [[ "${MIGRATE_URL}" == *"@postgres:"* ]]; then
		MIGRATE_URL="${MIGRATE_URL/@postgres:/@127.0.0.1:${HOST_PG_PORT}/}"
		echo "[run-migrations] подмена postgres → 127.0.0.1:${HOST_PG_PORT} (Atlas с хоста)" >&2
	fi
else
	echo "[run-migrations] нет ни DATABASE_URL, ни POSTGRES_PASSWORD — пропуск" >&2
	exit 0
fi

echo "[run-migrations] atlas migrate apply --env local (образ ${ATLAS_IMAGE})" >&2
exec docker run --rm --network host \
	-v "${ROOT}:/work" -w /work \
	-e "DATABASE_URL=${MIGRATE_URL}" \
	"${ATLAS_IMAGE}" \
	migrate apply --env local
