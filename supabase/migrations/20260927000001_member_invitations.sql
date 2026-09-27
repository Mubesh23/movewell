-- Migration: Add email and invitation tracking fields to case_members
-- Run this in Supabase SQL editor

ALTER TABLE case_members
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS invitation_status TEXT NOT NULL DEFAULT 'NONE'
    CHECK (invitation_status IN ('NONE', 'PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  ADD COLUMN IF NOT EXISTS invitation_channel TEXT
    CHECK (invitation_channel IN ('EMAIL', 'SMS') OR invitation_channel IS NULL);

-- Add index for looking up members by email
CREATE INDEX IF NOT EXISTS idx_case_members_email ON case_members(email) WHERE email IS NOT NULL;

COMMENT ON COLUMN case_members.email IS 'Email address for sending care circle invitations';
COMMENT ON COLUMN case_members.invitation_status IS 'Status of the invitation: NONE, PENDING, ACCEPTED, DECLINED, EXPIRED';
COMMENT ON COLUMN case_members.invitation_channel IS 'Channel used for invitation: EMAIL or SMS';
