CREATE TABLE IF NOT EXISTS billing.plans (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  billing_interval TEXT NOT NULL,
  price_amount NUMERIC(12, 2) NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'IDR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plans_billing_interval_check CHECK (
    billing_interval IN ('monthly', 'yearly', 'one_time')
  )
);

CREATE TABLE IF NOT EXISTS billing.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES identity.workspaces(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES billing.plans(code),
  provider_name TEXT NOT NULL,
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_start_at TIMESTAMPTZ,
  current_period_end_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_status_check CHECK (
    status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')
  )
);

CREATE INDEX IF NOT EXISTS subscriptions_workspace_status_idx
  ON billing.subscriptions (workspace_id, status);
