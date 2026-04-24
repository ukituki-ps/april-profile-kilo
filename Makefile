# Образ Atlas CLI (миграции); см. docs/guides/VERSIONS.md
ATLAS_IMAGE ?= arigaio/atlas:0.32.0

.PHONY: help docs-build docs-serve openapi-lint compose-config compose-up compose-down structurizr-url deploy frontend-build frontend-lint frontend-test go-vet go-build integration-test migrate-validate migrate-apply

help:
	@echo "April bootstrap — цели:"
	@echo "  make docs-build     — npm run build в docs-site (Docusaurus)"
	@echo "  make docs-serve     — npm run serve (статика после build)"
	@echo "  make openapi-lint   — проверка OpenAPI в openapi/*.yaml (Redocly)"
	@echo "  make frontend-build — ds:prepare + production build в frontend/ (April DS)"
	@echo "  make frontend-lint  — tsc --noEmit в frontend/"
	@echo "  make frontend-test  — vitest в frontend/"
	@echo "  make go-vet         — go vet ./..."
	@echo "  make go-build       — сборка ./cmd/april-profile и ./cmd/april-worker в bin/"
	@echo "  make integration-test — go test -tags=integration ./... (Docker required)"
	@echo "  make migrate-validate — docker: atlas migrate validate (образ $(ATLAS_IMAGE))"
	@echo "  make migrate-apply — docker: atlas migrate apply (DATABASE_URL; см. .env.example)"
	@echo "  make compose-config — docker compose config"
	@echo "  make compose-up     — сборка статики + docker compose up -d"
	@echo "  make compose-down   — docker compose down"
	@echo "  make structurizr-url — напечатать URL Structurizr Lite (порт из STRUCTURIZR_HTTP_PORT или 8091)"
	@echo "  make deploy         — ./deploy.sh (серверный деплой; см. docs/DEPLOYMENT_STRATEGY.md)"

structurizr-url:
	@printf 'Structurizr Lite: http://127.0.0.1:%s/\n' "$${STRUCTURIZR_HTTP_PORT:-8091}"

docs-build:
	cd docs-site && npm ci --prefer-offline && npm run build

docs-serve:
	cd docs-site && npm run serve

openapi-lint:
	npx --yes @redocly/cli@1.25.0 lint openapi/openapi.yaml openapi/mail-gateway-openapi.yaml --config redocly.yaml

go-vet:
	go vet ./...

go-build:
	go build -o bin/april-profile ./cmd/april-profile
	go build -o bin/april-worker ./cmd/april-worker

integration-test:
	go test -tags=integration ./...

migrate-validate:
	docker run --rm -v "$(CURDIR):/work" -w /work $(ATLAS_IMAGE) migrate validate --dir "file://atlas/migrations"

migrate-apply:
	test -n "$$DATABASE_URL" || (echo "DATABASE_URL is not set" >&2; exit 1)
	docker run --rm --network host -v "$(CURDIR):/work" -w /work -e DATABASE_URL $(ATLAS_IMAGE) migrate apply --env local

frontend-build:
	cd frontend && npm ci && npm run build

frontend-lint:
	cd frontend && npm ci && npm run lint

frontend-test:
	cd frontend && npm ci && npm run test

compose-config:
	docker compose config

compose-up: docs-build
	docker compose up -d

compose-down:
	docker compose down

deploy:
	./deploy.sh
