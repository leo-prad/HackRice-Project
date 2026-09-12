CREATE EXTENSION IF NOT EXISTS timescaledb;

ALTER TABLE xp_events DROP CONSTRAINT IF EXISTS xp_events_pkey;
ALTER TABLE xp_events ADD CONSTRAINT xp_events_pkey PRIMARY KEY (created_at, id);

SELECT create_hypertable(
  'xp_events',
  by_range('created_at'),
  migrate_data => TRUE,
  if_not_exists => TRUE
);

CREATE MATERIALIZED VIEW IF NOT EXISTS xp_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket(INTERVAL '1 day', created_at) AS bucket,
  user_id,
  SUM(delta)::BIGINT AS xp_earned,
  COUNT(*) FILTER (WHERE delta > 0)::BIGINT AS award_count
FROM xp_events
GROUP BY bucket, user_id
WITH NO DATA;

ALTER MATERIALIZED VIEW xp_daily SET (timescaledb.materialized_only = FALSE);

SELECT add_continuous_aggregate_policy(
  'xp_daily',
  start_offset => INTERVAL '30 days',
  end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute',
  if_not_exists => TRUE
);
