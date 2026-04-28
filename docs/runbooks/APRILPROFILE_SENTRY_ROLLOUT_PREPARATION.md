# AprilProfile Sentry rollout preparation (pre-implementation)

## 1. Scope and intent

This runbook defines the preparation-only baseline for Sentry integration in `april-profile-1`.  
Runtime SDK wiring is out of scope and is reserved for the implementation task (`038` in `april-worker` tracker).

## 2. Required environment variables

Use placeholders only. Never commit real DSN or auth tokens.

- `SENTRY_DSN` — project DSN (secret; set only in runtime environment).
- `SENTRY_ENVIRONMENT` — deployment environment (`local`, `dev`, `stage`, `prod`).
- `SENTRY_RELEASE` — release marker (recommended: git SHA).
- `SENTRY_TRACES_SAMPLE_RATE` — traces sampling ratio, float `0.0..1.0`.
- `SENTRY_PROFILES_SAMPLE_RATE` — profiles sampling ratio, float `0.0..1.0`.
- `SENTRY_REPLAYS_SESSION_SAMPLE_RATE` — replay sampling for all sessions, float `0.0..1.0`.
- `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` — replay sampling for sessions with errors, float `0.0..1.0`.
- `SENTRY_DEBUG` — local debug logging (`true` only for local troubleshooting).

Recommended prep defaults (to revisit during implementation rollout):

- `SENTRY_TRACES_SAMPLE_RATE=0.1`
- `SENTRY_PROFILES_SAMPLE_RATE=0.0`
- `SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.0`
- `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0`

## 3. Data safety: redaction and filtering policy

AprilProfile handles personal and profile data. Before enabling Sentry event delivery:

1. **PII redaction is mandatory**:
   - mask emails, phones, person names, passport/ID-like fields;
   - do not send raw profile payloads (`document`) as event extras;
   - do not send JWT tokens, cookies, auth headers.
2. **Correlation fields must be preserved**:
   - keep `requestId` and `correlationId` in tags or structured context;
   - `tenant_id` may be included only in hashed/anonymized form if policy allows.
3. **Noise filtering baseline**:
   - ignore browser-extension errors;
   - ignore network aborts and known non-actionable connectivity noise;
   - keep API `4xx/5xx` that affect user flows.

## 4. Cross-repo triage contract (AprilProfile <-> AprilHub)

For incident stitching between `april-profile-1` and `april-worker`:

- shared fields: `requestId`, `correlationId`, `service=april-profile`;
- environment alignment: `SENTRY_ENVIRONMENT` must match stand naming used in Hub observability;
- ownership:
  - frontend widget/runtime capture in profile UI: AprilProfile frontend owner;
  - API-related server traces/logs: AprilProfile backend owner;
  - cross-service routing and dashboards: AprilHub observability owner.

## 5. Rollout sequence (implementation task prerequisite)

1. Prepare secrets in deployment environment (not in git).
2. Validate `.env.example` placeholders and docs references.
3. Implement SDK wiring in dedicated task (`038`).
4. Run smoke checks with synthetic test error.
5. Confirm traceability chain: Sentry event <-> `requestId` logs in service logs.

## 6. Smoke checklist (for implementation task)

- Trigger one controlled frontend error from profile widget surface.
- Trigger one controlled backend/API error with expected `requestId`.
- Verify issue appears in Sentry with:
  - correct release/environment,
  - redaction applied,
  - correlation IDs present.
- Verify no secrets appear in breadcrumbs/contexts.

## 7. Rollback / mitigation

If errors spike or data policy is violated:

1. Set sampling rates to `0.0` (or disable SDK init via feature flag/env guard in implementation task).
2. Re-deploy and verify no new events are sent.
3. Keep logs-based triage path (`requestId`/`correlationId`) as fallback.
4. Open incident note with root cause and follow-up actions.

## 8. Definition of ready for implementation

Preparation is considered complete when:

- env variable contract is documented in `.env.example`;
- redaction/filtering rules are documented and accepted;
- rollout/smoke/rollback steps are documented;
- cross-repo ownership and correlation contract is fixed;
- mirrored reports exist in both repositories.
