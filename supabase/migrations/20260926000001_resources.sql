-- MoveWell Database Migration: 20260926000001_resources.sql
-- Open Referral / HSDS-inspired Resource Directory Schema

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Services
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    cost_type VARCHAR(50) DEFAULT 'quote',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Locations & Service Areas
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    address VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Resource Verifications (Trust Model)
CREATE TABLE IF NOT EXISTS resource_verifications (
    id VARCHAR(255) PRIMARY KEY,
    service_id VARCHAR(255) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'Verified listing',
    verification_source VARCHAR(255) DEFAULT 'MoveWell Verification Team',
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_locations_zip ON locations(zip_code);
