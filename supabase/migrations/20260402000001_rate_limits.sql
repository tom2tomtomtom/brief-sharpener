-- Rate limiting table for serverless-safe request throttling
create table if not exists rate_limits (
  ip text primary key,
  request_count integer not null default 1,
  window_start timestamptz not null default now()
);

-- Index on window_start for cleanup queries
create index if not exists idx_rate_limits_window_start on rate_limits (window_start);
