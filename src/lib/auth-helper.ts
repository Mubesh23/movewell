import { NextRequest } from 'next/server';
import { supabase } from '../db/client';

/**
 * Extracts the user identifier from Supabase Auth header or cookie,
 * or falls back to an anonymous session identifier.
 */
export async function getSessionUserId(req: NextRequest): Promise<string> {
  // 1. Supabase Bearer token in Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ') && supabase) {
    const token = authHeader.substring(7);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user?.id) return user.id;
    } catch {
      // Fall through to anonymous identifiers
    }
  }

  // 2. Custom header if supplied by client
  const headerUserId = req.headers.get('x-user-id');
  if (headerUserId && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }

  // 3. Cookie-based persistent anonymous session
  const cookieUserId = req.cookies.get('movewell_user_id')?.value;
  if (cookieUserId && cookieUserId.trim().length > 0) {
    return cookieUserId.trim();
  }

  // 4. Fallback generated anonymous session
  return 'anon-' + Math.random().toString(36).substring(2, 10);
}
