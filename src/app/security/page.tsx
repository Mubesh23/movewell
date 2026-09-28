import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BRAND_NAME } from '@/lib/brand';
import { ShieldCheck, KeyRound, Server, FileCheck2 } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#183331] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1F4D45] uppercase tracking-wider mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Infrastructure &amp; Access</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#183331] mb-3">
            Security Overview
          </h1>
          <p className="text-sm text-[#71847D] leading-relaxed">
            How {BRAND_NAME} ensures strict data isolation, role-based boundaries, and enterprise-grade transport security.
          </p>
        </div>

        <div className="space-y-8 bg-white rounded-3xl border border-[#E3E9E5] p-6 sm:p-10 shadow-xs">
          <section>
            <h2 className="text-lg font-bold text-[#183331] mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1F4D45]" />
              Role-Based Access Control (RBAC)
            </h2>
            <p className="text-sm text-[#667572] leading-relaxed">
              Every transition case is isolated behind strict server-side authorization boundaries. Only authenticated case owners and verified care circle members can read or mutate case data. Pre-signup drafts use cryptographically secure guest tokens with HttpOnly cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#183331] mb-2 flex items-center gap-2">
              <Server className="w-5 h-5 text-[#1F4D45]" />
              Database Row-Level Security (RLS)
            </h2>
            <p className="text-sm text-[#667572] leading-relaxed">
              All persisted relational tables—including transition cases, senior profiles, tasks, and budget ledger items—enforce PostgreSQL Row-Level Security policies in Supabase, preventing unauthorized cross-tenant data access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#183331] mb-2 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#1F4D45]" />
              Encrypted Data in Transit &amp; at Rest
            </h2>
            <p className="text-sm text-[#667572] leading-relaxed">
              All client-to-server traffic is encrypted using modern TLS 1.3. Service-role administrative credentials never touch client bundles, and production cookies are flagged with HttpOnly, SameSite=Lax, and Secure attributes.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-[#E3E9E5] py-8 text-center text-xs text-[#667572]">
        <p>&copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}
