import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BRAND_NAME } from '@/lib/brand';
import { ShieldCheck, Lock, EyeOff, UserCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#183331] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1F4D45] uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Trust &amp; Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#183331] mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#71847D] leading-relaxed">
            Last updated: September 2026. How {BRAND_NAME} protects your family&apos;s transition data.
          </p>
        </div>

        <div className="space-y-8 bg-white rounded-3xl border border-[#E3E9E5] p-6 sm:p-10 shadow-xs">
          <section>
            <h2 className="text-lg font-bold text-[#183331] mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1F4D45]" />
              Private Family Workspace
            </h2>
            <p className="text-sm text-[#667572] leading-relaxed">
              Your transition plan, notes, tasks, family member details, and senior profile information are private to your family care circle. {BRAND_NAME} does not sell personal information or share family transition details with advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#183331] mb-2 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-[#1F4D45]" />
              Information We Collect &amp; How It Is Used
            </h2>
            <p className="text-sm text-[#667572] leading-relaxed mb-3">
              We collect information that you explicitly share during your planning conversations with Nora or input into your workspace:
            </p>
            <ul className="list-disc pl-5 text-sm text-[#667572] space-y-1.5 leading-relaxed">
              <li>Senior living context (mobility considerations, home layout, approximate timing).</li>
              <li>General transition location (ZIP code and city) used solely for local resource discovery.</li>
              <li>Family member names and roles for task distribution within your care circle.</li>
              <li>Google account email and ID for authentication and access control.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#183331] mb-2 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#1F4D45]" />
              Third-Party Service Providers
            </h2>
            <p className="text-sm text-[#667572] leading-relaxed">
              We do not broker, sell, or automatically dispatch unapproved outreach to vendors or movers. Any future provider outreach requires explicit family confirmation and previews the exact data being shared before dispatch.
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
