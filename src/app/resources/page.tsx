'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { BRAND_NAME } from '@/lib/brand';
import {
  MapPin,
  Phone,
  Search,
  Building,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { ResourceCandidate, ResourceTrustLabel } from '@/types';

export default function PublicResourcesPage() {
  const [zipCode, setZipCode] = useState('77004');
  const [activeZip, setActiveZip] = useState('77004');
  const [category, setCategory] = useState<string>('ALL');
  const [resources, setResources] = useState<ResourceCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditingZip, setIsEditingZip] = useState(false);

  const categories = [
    { id: 'ALL', label: 'All Services' },
    { id: 'moving', label: 'Senior Moving' },
    { id: 'home_modification', label: 'Home Safety & Ramps' },
    { id: 'transportation', label: 'Transportation' },
    { id: 'donation', label: 'Donation & Decluttering' },
    { id: 'storage', label: 'Storage' },
  ];

  const fetchResources = async (zip: string, cat: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (zip) params.append('zipCode', zip);
      if (cat && cat !== 'ALL') params.append('category', cat);
      const res = await fetch(`/api/resources?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Map raw resources to candidate cards with provenance labels
        const mapped: ResourceCandidate[] = json.data.map((r: any) => {
          let trustLabel: ResourceTrustLabel = 'Nearby option';
          const nameLower = (r.name || '').toLowerCase();
          const descLower = (r.description || '').toLowerCase();
          const orgLower = (r.organizationName || '').toLowerCase();

          if (
            r.costType === 'free_public_service' ||
            nameLower.includes('metro') ||
            nameLower.includes('county') ||
            nameLower.includes('area agency') ||
            orgLower.includes('county')
          ) {
            trustLabel = 'Public agency';
          } else if (
            orgLower.includes('nonprofit') ||
            descLower.includes('nonprofit') ||
            descLower.includes('volunteer') ||
            r.costType === 'sliding_scale'
          ) {
            trustLabel = 'Nonprofit';
          } else if (r.verification?.verificationStatus?.toLowerCase().includes('verified')) {
            trustLabel = 'BridgeWell-reviewed';
          } else if (r.organizationName) {
            trustLabel = 'Directory listing';
          }

          return {
            id: r.id,
            name: r.name,
            category: r.category,
            description: r.description,
            phone: r.location?.phone,
            address: r.location?.address,
            city: r.location?.city,
            state: r.location?.state,
            zipCode: r.location?.zipCode,
            trustLabel,
            costType: r.costType,
            website: r.website,
          };
        });
        setResources(mapped);
      } else {
        setResources([]);
      }
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(activeZip, category);
  }, [activeZip, category]);

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.trim().length >= 5) {
      setActiveZip(zipCode.trim());
      setIsEditingZip(false);
    }
  };

  const getTrustLabelBadgeClass = (label?: ResourceTrustLabel) => {
    switch (label) {
      case 'Public agency':
        return 'bg-[#EAF1F7] text-[#345B73] border-[#CDE0ED]';
      case 'Nonprofit':
        return 'bg-[#F2EDF8] text-[#5E3D82] border-[#DFD3EC]';
      case 'BridgeWell-reviewed':
        return 'bg-[#E8F3EA] text-[#366854] border-[#CCE0D1]';
      case 'Directory listing':
        return 'bg-[#F4F5F4] text-[#55635F] border-[#DFE2E0]';
      default:
        return 'bg-[#F7F8F5] text-[#667572] border-[#E3E9E5]';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#183331] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header Banner */}
        <div className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-[#1F4D45] uppercase tracking-wider mb-2">
            <Navigation className="w-3.5 h-3.5" />
            <span>Community Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#183331] mb-3">
            Find help near your family member
          </h1>
          <p className="text-sm sm:text-base text-[#667572] max-w-2xl leading-relaxed">
            Discover verified senior movers, accessibility contractors, and local support programs matched to your parent&apos;s neighborhood.
          </p>

          {/* Location Bar */}
          <div className="mt-6 inline-flex flex-wrap items-center gap-3 p-2 sm:p-2.5 rounded-2xl bg-white border border-[#E3E9E5] shadow-2xs">
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#183331] font-semibold">
              <MapPin className="w-4 h-4 text-[#1F4D45]" />
              <span>Location:</span>
              <strong className="text-[#1F4D45]">ZIP {activeZip}</strong>
              <span className="text-[#879890] font-normal">
                {activeZip.startsWith('770') || activeZip.startsWith('772') ? '(Greater Houston, TX)' : ''}
              </span>
            </div>

            {isEditingZip ? (
              <form onSubmit={handleZipSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={5}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 5-digit ZIP"
                  className="w-28 px-2.5 py-1 text-xs rounded-lg border border-[#1F4D45] bg-[#F7F8F5] text-[#183331] focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-[#1F4D45] text-white text-xs font-semibold hover:bg-[#163D37]"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingZip(false)}
                  className="px-2 py-1 text-xs text-[#667572] hover:text-[#183331]"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingZip(true)}
                className="text-xs text-[#1F4D45] font-semibold hover:underline px-3 py-1 rounded-lg hover:bg-[#F2F6F3] transition-colors"
              >
                Change ZIP
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1F4D45] text-white shadow-xs'
                    : 'bg-white border border-[#DCE5DF] text-[#667572] hover:text-[#183331] hover:bg-[#F2F6F3]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="rounded-3xl border border-[#E3E9E5] bg-white shadow-xs overflow-hidden mb-12">
          <div className="flex items-center justify-between border-b border-[#E3E9E5] px-6 py-4 bg-[#FAFBF9]">
            <div>
              <h2 className="text-base font-bold text-[#183331]">
                Nearby Providers &amp; Programs
              </h2>
              <p className="text-xs text-[#879890]">
                Filtered for ZIP {activeZip}
              </p>
            </div>
            <span className="rounded-full bg-[#E8F1EA] px-3 py-1 text-xs font-semibold text-[#1F4D45]">
              {resources.length} {resources.length === 1 ? 'service found' : 'services found'}
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#1F4D45] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#71847D]">Searching local community resources…</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="py-20 text-center px-4">
              <Search className="w-8 h-8 text-[#A0AEA8] mx-auto mb-3" />
              <p className="text-base font-semibold text-[#183331]">No listings found in this category</p>
              <p className="text-xs text-[#71847D] mt-1 max-w-md mx-auto">
                Try switching to &ldquo;All Services&rdquo; or ask Nora to help research verified options for your parent&apos;s transition.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EBF0EC]">
              {resources.map((res) => (
                <article
                  key={res.id}
                  className="p-6 hover:bg-[#FAFBF9] transition-colors flex flex-col sm:flex-row sm:items-start gap-5"
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#E8F3EA] text-[#1F4D45]">
                    <Building className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-[#183331]">{res.name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getTrustLabelBadgeClass(
                          res.trustLabel
                        )}`}
                      >
                        {res.trustLabel || 'Nearby option'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#667572] leading-relaxed mb-3">
                      {res.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#879890]">
                      {(res.city || res.address) && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#1F4D45]" />
                          <span>{res.city ? `${res.city}, TX` : res.address}</span>
                        </span>
                      )}
                      {res.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#1F4D45]" />
                          <a
                            href={`tel:${res.phone.replace(/\D/g, '')}`}
                            className="font-medium text-[#183331] hover:underline"
                          >
                            {res.phone}
                          </a>
                        </span>
                      )}
                      {res.costType && (
                        <span className="text-[11px] font-medium text-[#4F635B]">
                          {res.costType === 'free_public_service'
                            ? 'Public program / No cost'
                            : res.costType === 'sliding_scale'
                            ? 'Sliding-scale fee'
                            : 'Direct provider quote'}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Public Resources Bottom CTA */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1F4D45] to-[#173F39] text-white p-8 sm:p-10 shadow-lg text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#C8E1CE] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Transition Planning</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              Want recommendations matched to your full transition plan?
            </h3>
            <p className="text-xs sm:text-sm text-[#D6E6D9] leading-relaxed">
              Tell Nora your parent&apos;s timeline, discharge date, and home layout. She will build an integrated plan with tasks, family assignments, and local resource matches.
            </p>
          </div>

          <Link
            href={`/get-started?zipCode=${activeZip}&category=${category !== 'ALL' ? category : 'moving'}`}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white text-[#1F4D45] px-6 py-3.5 text-sm font-bold hover:bg-[#F2F6F3] shadow-md transition-all cursor-pointer"
          >
            <span>Talk to Nora</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E3E9E5] py-10 text-center text-xs text-[#667572]">
        <p>&copy; {new Date().getFullYear()} {BRAND_NAME}. Thoughtful transition coordination for families.</p>
      </footer>
    </div>
  );
}
