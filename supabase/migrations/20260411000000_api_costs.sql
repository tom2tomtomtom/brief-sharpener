-- API cost tracking table for monitoring and budget enforcement
create table if not exists api_costs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_tier text not null,            -- guest | free | single | pro | agency
  user_id uuid references auth.users(id),
  extract_input_tokens integer not null default 0,
  extract_output_tokens integer not null default 0,
  chat_input_tokens integer not null default 0,
  chat_output_tokens integer not null default 0,
  extract_cost_usd numeric(10,6) not null default 0,
  chat_cost_usd numeric(10,6) not null default 0,
  total_cost_usd numeric(10,6) not null default 0,
  brief_length integer not null default 0,
  response_length integer not null default 0,
  duration_ms integer not null default 0
);

-- Index for daily/monthly aggregation queries
create index idx_api_costs_created_at on api_costs(created_at desc);
create index idx_api_costs_user_tier on api_costs(user_tier);

-- RLS: only service role can insert/read (no user access)
alter table api_costs enable row level security;

-- No policies = only service_role key can access
