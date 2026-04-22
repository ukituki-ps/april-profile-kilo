-- Ретраи публикации outbox: счётчик попыток, безопасная причина ошибки, отложенная повторная попытка.
ALTER TABLE profile_outbox
ADD COLUMN publish_attempts integer NOT NULL DEFAULT 0,
ADD COLUMN last_publish_error text,
ADD COLUMN next_retry_at timestamptz;

COMMENT ON COLUMN profile_outbox.publish_attempts IS 'Число неудачных попыток Publish (сбрасывается при published).';
COMMENT ON COLUMN profile_outbox.last_publish_error IS 'Краткая причина последней ошибки публикации (без PII/payload).';
COMMENT ON COLUMN profile_outbox.next_retry_at IS 'До какого момента строка не берётся в батч (экспоненциальный backoff).';

CREATE INDEX profile_outbox_pending_retry_idx ON profile_outbox (status, next_retry_at, created_at)
WHERE
    status = 'pending';
