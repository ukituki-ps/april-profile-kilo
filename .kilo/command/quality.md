---
description: Run the April Profile quality gate (lint + tests)
---
Run the mandatory quality gate for April Profile. Read AGENTS.md for exact commands.

Execute (in order, stop on first failure):
1. `make frontend-lint` — TypeScript check + lint
2. `make frontend-test` — Vitest + RTL tests in frontend/
3. `make go-vet` — Go vet checks
4. `make openapi-lint` — OpenAPI spec validation

If any step fails: fix the failures. Re-run the full pipeline until all pass.
Report final status: PASS or FAIL with summary of each step.