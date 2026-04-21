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

if [[ -z "${DATABASE_URL:-}" ]]; then
	echo "[run-migrations] DATABASE_URL не задан — пропуск миграций (добавьте в серверный .env для автоприменения при деплое)" >&2
	exit 0
fi

echo "[run-migrations] atlas migrate apply --env local (образ ${ATLAS_IMAGE})" >&2
exec docker run --rm --network host \
	-v "${ROOT}:/work" -w /work \
	-e "DATABASE_URL=${DATABASE_URL}" \
	"${ATLAS_IMAGE}" \
	migrate apply --env local
