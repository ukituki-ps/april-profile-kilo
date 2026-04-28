# AprilProfile error telemetry triage runbook

## 1. Goal

Provide a repeatable incident flow for AprilProfile errors using:

- Sentry as incident entrypoint,
- Loki/Grafana logs for request-level timeline,
- Prometheus metrics for operational impact validation.

## 2. Preconditions

- Access to Sentry project for AprilProfile.
- Access to Loki/Grafana and Prometheus dashboards used in AprilHub observability contour.
- Correlation fields are present in events/logs: `requestId`, `correlationId`, `route`, `module/widget`, `service`.

## 3. Triage workflow

1. **Open Sentry issue**
   - Check environment, release, first/last seen.
   - Confirm event category: frontend runtime, API `400/404`, API `5xx`, unknown.
2. **Extract correlation identifiers**
   - Read `requestId` and `correlationId` from tags/contexts.
   - If only one ID exists, continue with that identifier.
3. **Correlate in Loki**
   - Query logs by `requestId`/`correlationId`.
   - Build timeline: request entry, handler/module, downstream call, final status.
4. **Validate impact in metrics**
   - Check request/error counters and latency for matching route/service window.
   - Determine if issue is isolated, noisy, or incident-grade.
5. **Classify root cause**
   - `frontend-runtime`: UI code path/interaction issue.
   - `backend-domain`: business logic or validation defect.
   - `integration/downstream`: dependency timeout/unavailability/contract drift.
6. **Apply mitigation**
   - hotfix/revert/feature flag/sampling adjustment according to severity.
   - create follow-up task with links to Sentry event and Loki query snapshot.

## 4. Severity hints

- **P1**: user-facing outage or persistent `5xx` spike.
- **P2**: significant degradation, recurring actionable errors.
- **P3**: localized defect with workaround, no broad impact.

## 5. Data safety checks

For every investigated issue:

- verify no secrets or sensitive profile payload leaked in Sentry event;
- if leakage is detected, stop rollout, disable sampling, and start security incident flow;
- document leakage source and required redaction fix.

## 6. Escalation and ownership

- Frontend runtime path: AprilProfile frontend owner.
- API and domain failures: AprilProfile backend owner.
- Cross-service observability/routing mismatch: AprilHub observability owner.

## 7. Evidence checklist for task/incident report

- Sentry issue link(s),
- correlation ID used for Loki lookup,
- key log evidence and route/module,
- metric impact window,
- root cause and mitigation summary,
- follow-up ticket(s).
