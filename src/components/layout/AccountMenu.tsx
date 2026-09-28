'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Plus, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { AuthModal } from '@/components/auth/AuthModal';

interface AuthUserState {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

interface AccountMenuProps {
  className?: string;
}

export function AccountMenu({ className = '' }: AccountMenuProps) {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUserState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return;

    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const meta = user.user_metadata || {};
          setAuthUser({
            id: user.id,
            email: user.email,
            name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Account',
            avatarUrl: meta.avatar_url || meta.picture,
          });
        }
      });
    } catch {
      // Offline / fallback
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
        await supabase.auth.signOut();
      }
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setAuthUser(null);
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const userInitial = authUser?.name
    ? authUser.name.charAt(0).toUpperCase()
    : 'U';

  if (!authUser) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbdcd0] bg-white text-xs font-semibold text-[#183331] hover:bg-[#f1f6f1] transition-colors cursor-pointer shadow-2xs"
        >
          <UserIcon size={14} className="text-[#1f4d45]" />
          <span>Sign in</span>
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 py-1 px-2 rounded-xl hover:bg-[#f1f6f1] border border-transparent hover:border-[#cbdcd0] transition-colors cursor-pointer"
        aria-label="User account menu"
      >
        {authUser.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={authUser.avatarUrl}
            alt={authUser.name || 'User avatar'}
            className="w-8 h-8 rounded-full object-cover border border-[#1f4d45]/30 shadow-2xs"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-[#1f4d45] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
            {userInitial}
          </span>
        )}
        <span className="hidden sm:inline text-xs font-semibold text-[#183331] max-w-[120px] truncate">
          {authUser.name?.split(' ')[0]}
        </span>
        <ChevronDown size={14} className="text-[#71847d]" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#e1e9e3] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
          <div className="px-3 py-2 border-b border-[#e1e9e3] mb-1">
            <p className="text-xs font-bold text-[#183331] truncate">{authUser.name}</p>
            <p className="text-[11px] text-[#71847d] truncate">{authUser.email}</p>
          </div>

          <Link
            href="/home"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#183331] hover:bg-[#f1f6f1] transition-colors"
          >
            <LayoutGrid className="w-4 h-4 text-[#1f4d45]" />
            <span>My transitions</span>
          </Link>

          <Link
            href="/get-started"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#183331] hover:bg-[#f1f6f1] transition-colors"
          >
            <Plus className="w-4 h-4 text-[#1f4d45]" />
            <span>Start a new transition</span>
          </Link>

          <div className="my-1 border-t border-[#e1e9e3]" />

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
