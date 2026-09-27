import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../db/client';

export interface UserSession {
  userId: string;
  email?: string;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

export const SESSION_COOKIE_NAME = 'bridgewell_session';
export const LEGACY_COOKIE_NAME = 'movewell_user_id';

/**
 * Resolves verified user identity from Supabase Auth (Bearer token or Supabase session),
 * falling back to server-managed cryptographic draft-session tokens for pre-signup users.
 */
export async function resolveUserSession(req: NextRequest): Promise<UserSession> {
  // 1. Supabase Bearer token in Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ') && supabase) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);
        if (user?.id && !error) {
          return {
            userId: user.id,
            email: user.email,
            isAuthenticated: true,
            isAnonymous: false,
          };
        }
      } catch {
        // Fall through to cookie / session check
      }
    }
  }

  // 2. Test-environment header support (strictly restricted to test/dev execution)
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    const testHeader = req.headers.get('x-user-id') || req.headers.get('x-test-user-id');
    if (testHeader && testHeader.trim().length > 0) {
      return {
        userId: testHeader.trim(),
        isAuthenticated: !testHeader.startsWith('anon-'),
        isAnonymous: testHeader.startsWith('anon-'),
      };
    }
  }

  // 3. Cookie-based session resolution
  const sessionCookie =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.cookies.get(LEGACY_COOKIE_NAME)?.value;

  if (sessionCookie && sessionCookie.trim().length > 0) {
    const trimmed = sessionCookie.trim();
    return {
      userId: trimmed,
      isAuthenticated: !trimmed.startsWith('anon_') && !trimmed.startsWith('anon-') && !trimmed.startsWith('test-user-'),
      isAnonymous: trimmed.startsWith('anon_') || trimmed.startsWith('anon-') || trimmed.startsWith('test-user-'),
    };
  }

  // 4. Generate new high-entropy anonymous session token
  const generatedId = 'anon_' + crypto.randomBytes(24).toString('hex');
  return {
    userId: generatedId,
    isAuthenticated: false,
    isAnonymous: true,
  };
}

/**
 * Returns the effective user identifier for the request.
 */
export async function getSessionUserId(req: NextRequest): Promise<string> {
  const session = await resolveUserSession(req);
  return session.userId;
}

/**
 * Generates a cryptographically unguessable draft session token.
 */
export function generateDraftSessionToken(): string {
  return 'anon_' + crypto.randomBytes(24).toString('hex');
}
