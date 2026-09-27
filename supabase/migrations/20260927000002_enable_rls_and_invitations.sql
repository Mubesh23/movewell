-- Migration: 20260927000002_enable_rls_and_invitations.sql
-- 1. Create case_invitations table for high-entropy single-use invitation tokens
-- 2. Enable Row Level Security (RLS) across all private and case-related tables

-- 1. Case Invitations Table
CREATE TABLE IF NOT EXISTS case_invitations (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES transition_cases(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES case_members(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_case_invitations_token_hash ON case_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_case_invitations_case_id ON case_invitations(case_id);
CREATE INDEX IF NOT EXISTS idx_case_invitations_member_id ON case_invitations(member_id);

-- Ensure prerequisite columns exist on core tables
ALTER TABLE transition_cases ADD COLUMN IF NOT EXISTS owner_user_id VARCHAR(255);
ALTER TABLE case_members ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- 2. Ensure Cost Items Table Exists
CREATE TABLE IF NOT EXISTS cost_items (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES transition_cases(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'ESTIMATE',
  amount NUMERIC(10, 2),
  min_amount NUMERIC(10, 2),
  max_amount NUMERIC(10, 2),
  provider_name TEXT,
  document_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cost_items_case_id ON cost_items(case_id);

-- 3. Ensure Case Locations Table Exists
CREATE TABLE IF NOT EXISTS case_locations (
  id VARCHAR(255) PRIMARY KEY,
  plan_draft_id VARCHAR(255),
  case_id VARCHAR(255) REFERENCES transition_cases(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'HOME',
  label VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  external_place_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_case_locations_case ON case_locations(case_id);

-- 4. Enable Row Level Security on Private & Case Tables
ALTER TABLE transition_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE senior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_invitations ENABLE ROW LEVEL SECURITY;

-- If plan_drafts and intake_drafts exist in the database, enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plan_drafts') THEN
    ALTER TABLE plan_drafts ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'intake_drafts') THEN
    ALTER TABLE intake_drafts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 3. RLS Policies: Transition Cases
-- Owners can read and write their cases; verified care circle members can read
DROP POLICY IF EXISTS "Case owners have full access" ON transition_cases;
CREATE POLICY "Case owners have full access" ON transition_cases
  FOR ALL
  USING (auth.uid() IS NOT NULL AND owner_user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Care circle members can read assigned cases" ON transition_cases;
CREATE POLICY "Care circle members can read assigned cases" ON transition_cases
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM case_members
      WHERE case_members.case_id = transition_cases.id
        AND case_members.user_id = auth.uid()::text
    )
  );

-- 4. RLS Policies: Senior Profiles
DROP POLICY IF EXISTS "Senior profiles viewable by case participants" ON senior_profiles;
CREATE POLICY "Senior profiles viewable by case participants" ON senior_profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM transition_cases
        WHERE transition_cases.id = senior_profiles.case_id
          AND transition_cases.owner_user_id = auth.uid()::text
      ) OR
      EXISTS (
        SELECT 1 FROM case_members
        WHERE case_members.case_id = senior_profiles.case_id
          AND case_members.user_id = auth.uid()::text
      )
    )
  );

-- 5. RLS Policies: Case Members
DROP POLICY IF EXISTS "Case members viewable by case participants" ON case_members;
CREATE POLICY "Case members viewable by case participants" ON case_members
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM transition_cases
        WHERE transition_cases.id = case_members.case_id
          AND transition_cases.owner_user_id = auth.uid()::text
      )
    )
  );

-- 6. RLS Policies: Tasks
DROP POLICY IF EXISTS "Tasks viewable by case participants" ON tasks;
CREATE POLICY "Tasks viewable by case participants" ON tasks
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM transition_cases
        WHERE transition_cases.id = tasks.case_id
          AND transition_cases.owner_user_id = auth.uid()::text
      ) OR
      EXISTS (
        SELECT 1 FROM case_members
        WHERE case_members.case_id = tasks.case_id
          AND case_members.user_id = auth.uid()::text
      )
    )
  );

-- 7. RLS Policies: Case Locations
DROP POLICY IF EXISTS "Locations viewable by case participants" ON case_locations;
CREATE POLICY "Locations viewable by case participants" ON case_locations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM transition_cases
        WHERE transition_cases.id = case_locations.case_id
          AND transition_cases.owner_user_id = auth.uid()::text
      ) OR
      EXISTS (
        SELECT 1 FROM case_members
        WHERE case_members.case_id = case_locations.case_id
          AND case_members.user_id = auth.uid()::text
      )
    )
  );

-- 8. RLS Policies: Cost Items
DROP POLICY IF EXISTS "Cost items viewable by case participants" ON cost_items;
CREATE POLICY "Cost items viewable by case participants" ON cost_items
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM transition_cases
        WHERE transition_cases.id = cost_items.case_id
          AND transition_cases.owner_user_id = auth.uid()::text
      ) OR
      EXISTS (
        SELECT 1 FROM case_members
        WHERE case_members.case_id = cost_items.case_id
          AND case_members.user_id = auth.uid()::text
      )
    )
  );

-- 9. RLS Policies: Case Events
DROP POLICY IF EXISTS "Events viewable by case participants" ON case_events;
CREATE POLICY "Events viewable by case participants" ON case_events
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM transition_cases
        WHERE transition_cases.id = case_events.case_id
          AND transition_cases.owner_user_id = auth.uid()::text
      ) OR
      EXISTS (
        SELECT 1 FROM case_members
        WHERE case_members.case_id = case_events.case_id
          AND case_members.user_id = auth.uid()::text
      )
    )
  );

-- 10. RLS Policies: Invitations
DROP POLICY IF EXISTS "Invitations viewable by case owner" ON case_invitations;
CREATE POLICY "Invitations viewable by case owner" ON case_invitations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM transition_cases
      WHERE transition_cases.id = case_invitations.case_id
        AND transition_cases.owner_user_id = auth.uid()::text
    )
  );

-- 11. RLS Policies: Drafts (if present)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plan_drafts') THEN
    DROP POLICY IF EXISTS "Plan drafts viewable by owner" ON plan_drafts;
    CREATE POLICY "Plan drafts viewable by owner" ON plan_drafts
      FOR ALL
      USING (auth.uid() IS NOT NULL AND owner_user_id = auth.uid()::text);
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'intake_drafts') THEN
    DROP POLICY IF EXISTS "Intake drafts viewable by owner" ON intake_drafts;
    CREATE POLICY "Intake drafts viewable by owner" ON intake_drafts
      FOR ALL
      USING (auth.uid() IS NOT NULL AND owner_user_id = auth.uid()::text);
  END IF;
END $$;
