-- MoveWell Database Migration: 20260927000000_drafts_and_auth.sql
-- First-Class Drafts, Case Locations, and User Profile Linkage

-- 1. Intake Drafts
CREATE TABLE IF NOT EXISTS intake_drafts (
    id VARCHAR(255) PRIMARY KEY,
    owner_user_id VARCHAR(255) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intake_drafts_owner ON intake_drafts(owner_user_id);

-- 2. Transition Cases owner column
ALTER TABLE transition_cases ADD COLUMN IF NOT EXISTS owner_user_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_transition_cases_owner ON transition_cases(owner_user_id);

-- 3. Case Members user_id column
ALTER TABLE case_members ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_case_members_user_id ON case_members(user_id);

-- 4. Plan Drafts
CREATE TABLE IF NOT EXISTS plan_drafts (
    id VARCHAR(255) PRIMARY KEY,
    owner_user_id VARCHAR(255) NOT NULL,
    intake_draft_id VARCHAR(255) REFERENCES intake_drafts(id) ON DELETE SET NULL,
    senior_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    discharge_timing JSONB DEFAULT '{}'::jsonb,
    proposed_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    proposed_members JSONB NOT NULL DEFAULT '[]'::jsonb,
    proposed_budget NUMERIC(10, 2),
    budget_status VARCHAR(20) NOT NULL DEFAULT 'UNSET',
    proposed_locations JSONB DEFAULT '[]'::jsonb,
    proposed_resource_needs JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    case_id VARCHAR(255) REFERENCES transition_cases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plan_drafts_owner ON plan_drafts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_plan_drafts_case_id ON plan_drafts(case_id);

-- 5. Case Locations
CREATE TABLE IF NOT EXISTS case_locations (
    id VARCHAR(255) PRIMARY KEY,
    plan_draft_id VARCHAR(255) REFERENCES plan_drafts(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_case_locations_draft ON case_locations(plan_draft_id);
CREATE INDEX IF NOT EXISTS idx_case_locations_case ON case_locations(case_id);
CREATE INDEX IF NOT EXISTS idx_case_locations_zip ON case_locations(zip_code);
