# Error Telemetry Model (AprilProfile)

## 1. Purpose

This document fixes the AprilProfile error telemetry architecture as a domain-specific mirror of the AprilHub model:

- **Sentry** is the incident layer for runtime exceptions and actionable API failures.
- **Loki/Grafana + Prometheus** remain the operational layer for logs, metrics and alerting.
- Correlation fields are unified with AprilHub to support cross-repo incident triage.

## 2. Error sources and routing

### Frontend (`frontend/`)

- Sources:
  - React runtime errors (`ErrorBoundary` and unhandled runtime exceptions),
  - Promise failures (`unhandledrejection`),
  - widget-level API failures relevant to user flow (`save_failed` and similar events).
- Routing:
  - Sentry SDK captures runtime errors and widget telemetry events.
  - Correlation context is attached to event tags/extra data.

### Backend (`cmd/april-profile`, `internal/httpapi`)

- Sources:
  - unhandled panics in request processing,
  - HTTP `5xx`,
  - selected `4xx` (`400`, `404`) when they represent user-visible failure or integration mismatch.
- Routing:
  - Sentry middleware captures panic and `5xx` incidents.
  - JSON logs in stdout remain the source for detailed timeline and request context in Loki.
  - Prometheus metrics are used for aggregate trend and alerting.

## 3. Mandatory correlation contract

The following fields are required for any error telemetry event:

- `requestId`
- `correlationId`
- `tenant` (or `tenant_hash` if policy forbids raw tenant identifier)
- `route`
- `module` (backend module) or `widget` (frontend widget name)
- `service=april-profile`

Cross-repo rule: field naming must stay compatible with AprilHub incident flow and runbooks.

## 4. Incident flow

1. **Detection in Sentry**: issue is created from runtime error or actionable API failure.
2. **Correlation in logs**: use `requestId` or `correlationId` to query Loki and restore execution timeline.
3. **Operational validation**: check Prometheus metrics/alerts for saturation, retries, 5xx spikes.
4. **Root cause classification**:
   - frontend runtime defect,
   - backend/domain defect,
   - downstream availability or contract mismatch.
5. **Mitigation and follow-up**:
   - short-term mitigation (sampling/filter, feature disable, rollback),
   - issue/task in owning repository with evidence links.

## 5. Redaction and PII policy

AprilProfile processes profile/domain data, so redaction is mandatory:

- never send raw profile payloads or document fields to Sentry;
- remove/mask auth/session secrets (`Authorization`, cookies, tokens);
- strip query-string parameters from URLs in captured events;
- do not include direct personal fields (name, email, phone, identifiers);
- include `tenant` only according to current data policy (prefer hashed value when uncertain).

## 6. Ownership boundaries

- **AprilProfile frontend owner**: widget runtime capture, UI event context, client-side filtering.
- **AprilProfile backend owner**: API/panic capture, server-side tags and redaction enforcement.
- **AprilHub observability owner**: shared dashboards, central alerting conventions, cross-service triage process.

## 7. Out of scope

- This document does not define production DSN setup.
- This document does not replace implementation runbooks for deployment rollout.
- This document does not replace business-domain debugging guides.
