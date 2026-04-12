.PHONY: help docs-build docs-serve openapi-lint compose-config compose-up compose-down structurizr-url deploy

help:
	@echo "April bootstrap — цели:"
	@echo "  make docs-build     — npm run build в docs-site (Docusaurus)"
	@echo "  make docs-serve     — npm run serve (статика после build)"
	@echo "  make openapi-lint   — проверка OpenAPI в openapi/*.yaml (Redocly)"
	@echo "  make compose-config — docker compose config"
	@echo "  make compose-up     — сборка статики + docker compose up -d"
	@echo "  make compose-down   — docker compose down"
	@echo "  make structurizr-url — напечатать URL Structurizr Lite (порт из STRUCTURIZR_HTTP_PORT или 8091)"
	@echo "  make deploy         — ./deploy.sh (серверный деплой; см. docs/DEPLOYMENT_STRATEGY.md)"

structurizr-url:
	@printf 'Structurizr Lite: http://127.0.0.1:%s/\n' "$${STRUCTURIZR_HTTP_PORT:-8091}"

docs-build:
	cd docs-site && npm ci && npm run build

docs-serve:
	cd docs-site && npm run serve

openapi-lint:
	npx --yes @redocly/cli@1.25.0 lint openapi/openapi.yaml openapi/mail-gateway-openapi.yaml --config redocly.yaml

compose-config:
	docker compose config

compose-up: docs-build
	docker compose up -d

compose-down:
	docker compose down

deploy:
	./deploy.sh
