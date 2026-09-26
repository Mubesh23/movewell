-- MoveWell Database Migration: 20260926000000_init.sql
-- Minimum Schema for Transition Management MVP

-- 1. Transition Cases
CREATE TABLE IF NOT EXISTS transition_cases (
    id VARCHAR(255) PRIMARY KEY,
    transition_type VARCHAR(50) NOT NULL DEFAULT 'POST_HOSPITAL',
    urgency VARCHAR(20) NOT NULL DEFAULT 'URGENT',
    zip_code VARCHAR(10) NOT NULL,
    target_date DATE,
    discharge_date DATE,
    housing_status VARCHAR(50),
    destination_status VARCHAR(50),
    budget NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Senior Profiles (1:1 with TransitionCase)
CREATE TABLE IF NOT EXISTS senior_profiles (
    id VARCHAR(255) PRIMARY KEY,
    case_id VARCHAR(255) UNIQUE NOT NULL REFERENCES transition_cases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age_range VARCHAR(20),
    lives_alone BOOLEAN NOT NULL DEFAULT true,
    mobility_constraint BOOLEAN NOT NULL DEFAULT false,
    stairs_constraint BOOLEAN NOT NULL DEFAULT false,
    immediate_safety_concern BOOLEAN NOT NULL DEFAULT false,
    home_type VARCHAR(100),
    owns_home BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Case Members (Family & Collaborators)
CREATE TABLE IF NOT EXISTS case_members (
    id VARCHAR(255) PRIMARY KEY,
    case_id VARCHAR(255) NOT NULL REFERENCES transition_cases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100),
    city VARCHAR(100),
    is_local BOOLEAN NOT NULL DEFAULT false,
    availability VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'FAMILY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(255) PRIMARY KEY,
    case_id VARCHAR(255) NOT NULL REFERENCES transition_cases(id) ON DELETE CASCADE,
    template_id VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    why_it_matters TEXT,
    completion_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    priority INT NOT NULL DEFAULT 5,
    phase VARCHAR(30) NOT NULL DEFAULT 'RIGHT_NOW',
    due_date DATE,
    assignee_id VARCHAR(255) REFERENCES case_members(id) ON DELETE SET NULL,
    min_estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    max_estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Task Dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, depends_on_task_id)
);

-- 6. Case Events (Audit & Activity Timeline)
CREATE TABLE IF NOT EXISTS case_events (
    id VARCHAR(255) PRIMARY KEY,
    case_id VARCHAR(255) NOT NULL REFERENCES transition_cases(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    actor_type VARCHAR(20) NOT NULL DEFAULT 'USER',
    actor_id VARCHAR(255),
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Cost Models
CREATE TABLE IF NOT EXISTS cost_models (
    id VARCHAR(255) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    min_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) DEFAULT 'lump_sum',
    conditions JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_case_members_case_id ON case_members(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
