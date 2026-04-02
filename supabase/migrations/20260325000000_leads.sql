-- Leads table: captures email interest before signup (Product Hunt, landing page CTAs)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'landing', -- 'landing', 'product_hunt', 'pricing'
  plan_interest text,                      -- 'free', 'single', 'pro'
  created_at timestamptz DEFAULT now(),
  UNIQUE (email)
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write leads (no user access needed)
CREATE POLICY "Service role can manage leads"
  ON public.leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
