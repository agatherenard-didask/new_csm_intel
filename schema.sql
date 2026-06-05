-- CSM Intelligence Dashboard — PostgreSQL Schema
-- Designed for future migration from mock data (data.ts) to live database.

CREATE TYPE tier AS ENUM ('Premium', 'Standard', 'Light');
CREATE TYPE client_stage AS ENUM ('Kick off', 'Onboarding', 'Conception/diffusion', 'Running');
CREATE TYPE onboarding_track AS ENUM ('mentoring', 'formation initiale');
CREATE TYPE ticket_status AS ENUM ('résolu', 'en cours', 'abandonné');
CREATE TYPE alert_severity AS ENUM ('critical', 'warning', 'info');
CREATE TYPE alert_category AS ENUM ('adoption', 'stakeholder', 'renewal', 'expansion', 'onboarding');

-- ── Core accounts table ─────────────────────────────────────────────────────
CREATE TABLE accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id           TEXT UNIQUE,           -- HubSpot deal/company id
  name                  TEXT NOT NULL,
  tier                  tier NOT NULL,
  csm                   TEXT NOT NULL,
  kam                   TEXT NOT NULL,
  mrr                   NUMERIC(10,2) NOT NULL DEFAULT 0,
  contract_start        DATE NOT NULL,
  contract_end          DATE NOT NULL,
  client_stage          client_stage NOT NULL,
  app_name              TEXT,
  app_url               TEXT,
  slack_channel_url     TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── Weekly CSM pulse snapshots ──────────────────────────────────────────────
CREATE TABLE pulses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  score       SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  note        TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Latest pulse view (used by scoring engine)
CREATE VIEW latest_pulse AS
  SELECT DISTINCT ON (account_id) account_id, score, recorded_at
  FROM pulses
  ORDER BY account_id, recorded_at DESC;

-- ── Usage metrics (daily snapshot from Didask App API) ──────────────────────
CREATE TABLE usage_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,
  u_log           SMALLINT,   -- days since last user login
  l_log           SMALLINT,   -- days since last long activity
  seats_used      INT,
  credits_used    INT,
  content_count   INT,
  trend_30d       NUMERIC(5,2),  -- % change vs 30 days ago
  UNIQUE (account_id, snapshot_date)
);

-- ── Meeting / interaction log ───────────────────────────────────────────────
CREATE TABLE interactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,  -- 'meeting', 'email', 'call'
  occurred_at   TIMESTAMPTZ NOT NULL,
  next_meeting  TIMESTAMPTZ,
  note          TEXT
);

-- ── Contract terms (seats, credits) ────────────────────────────────────────
CREATE TABLE contract_terms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  seats_contract  INT NOT NULL,
  credits_contract INT,
  ai_activated    BOOLEAN DEFAULT false,
  coach_activated BOOLEAN DEFAULT false,
  effective_from  DATE NOT NULL,
  effective_to    DATE
);

-- ── Support tickets (synced from Intercom) ─────────────────────────────────
CREATE TABLE support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  external_id     TEXT UNIQUE,    -- Intercom conversation id
  topic           TEXT NOT NULL,
  status          ticket_status NOT NULL DEFAULT 'en cours',
  opened_at       DATE NOT NULL,
  closed_at       DATE,
  url             TEXT
);

-- ── NPS responses ──────────────────────────────────────────────────────────
CREATE TABLE nps_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  score       SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 10),
  verbatim    TEXT,
  recorded_at DATE NOT NULL
);

-- ── Onboarding progress ────────────────────────────────────────────────────
CREATE TABLE onboarding_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE UNIQUE,
  track             onboarding_track NOT NULL,
  current_step      TEXT NOT NULL,
  start_date        DATE NOT NULL,
  planned_end_date  DATE NOT NULL,
  mentor            TEXT,
  mentor_sentiment  SMALLINT CHECK (mentor_sentiment BETWEEN 1 AND 5),
  mentor_note       TEXT,
  completed_at      TIMESTAMPTZ
);

-- ── Health score history (daily computed snapshot) ─────────────────────────
CREATE TABLE health_score_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  health_score  SMALLINT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
  churn_risk    SMALLINT NOT NULL CHECK (churn_risk BETWEEN 0 AND 100),
  priority_score SMALLINT NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  UNIQUE (account_id, snapshot_date)
);

-- ── Generated alerts ───────────────────────────────────────────────────────
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category        alert_category NOT NULL,
  severity        alert_severity NOT NULL,
  title           TEXT NOT NULL,
  detail          TEXT,
  suggested_action TEXT,
  generated_at    TIMESTAMPTZ DEFAULT now(),
  dismissed_at    TIMESTAMPTZ,
  dismissed_by    TEXT
);

-- Indexes for common query patterns
CREATE INDEX ON alerts (account_id, dismissed_at) WHERE dismissed_at IS NULL;
CREATE INDEX ON health_score_history (account_id, snapshot_date DESC);
CREATE INDEX ON usage_snapshots (account_id, snapshot_date DESC);
CREATE INDEX ON support_tickets (account_id, status);
