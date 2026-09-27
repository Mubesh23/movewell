'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { PageHeader } from '@/components/movewell/PageHeader';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { ServiceResource } from '@/types';
import {
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function ResourcesPage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [resources, setResources] = useState<ServiceResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Services' },
    { id: 'senior_move_management', label: 'Senior Move Managers' },
    { id: 'moving', label: 'Movers' },
    { id: 'donation', label: 'Donation' },
    { id: 'junk_removal', label: 'Junk Removal' },
    { id: 'home_modification', label: 'Home Modifications' },
    { id: 'storage', label: 'Storage' },
  ];

  const fetchResources = async (cat?: string) => {
    setLoading(true);
    try {
      const url = cat && cat !== 'ALL' ? `/api/resources?category=${cat}` : '/api/resources';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setResources(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans">
      <Navbar caseId={caseId} seniorName="Local Directory" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        <PageHeader
          title="Verified Local Resources"
          subtitle="Open Referral HSDS directory of verified senior transition providers, public agencies, and vetted services in Greater Houston."
          statusLabel="Harris County Coverage"
          statusVariant="info"
          summaryItems={[
            { label: 'Directory', value: `${resources.length} providers` },
            { label: 'Area Coverage', value: 'Houston & Harris Co.' },
            { label: 'Data Standard', value: 'Open Referral HSDS' },
          ]}
        />

        {/* Category Filter Tabs */}
        <div>
          <Tabs
            tabs={categories}
            activeTab={selectedCategory}
            onChange={setSelectedCategory}
            variant="pill"
          />
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-muted">Loading verified providers…</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-xl border border-stone-line p-8">
            <p className="text-sm font-medium text-charcoal">No providers found in this category.</p>
            <p className="text-xs text-muted mt-1">Try selecting &ldquo;All Services&rdquo; to browse other providers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((res) => (
              <Section
                key={res.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-forest/30 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="completed" className="text-[10px]">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {res.verification?.verificationStatus || 'Verified Provider'}
                    </Badge>
                    <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                      {res.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base text-charcoal leading-snug">
                      {res.name}
                    </h3>
                    {res.organizationName && res.organizationName !== res.name && (
                      <p className="text-xs text-muted mt-0.5 font-medium">
                        {res.organizationName}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-charcoal/80 leading-relaxed line-clamp-3">
                    {res.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-muted pt-2 border-t border-stone-line/60">
                    {res.location && (
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-text shrink-0 mt-0.5" />
                        <span>
                          {res.location.address}, {res.location.city} {res.location.zipCode}
                        </span>
                      </p>
                    )}
                    {res.location?.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-text shrink-0" />
                        <a
                          href={`tel:${res.location.phone.replace(/[^0-9]/g, '')}`}
                          className="hover:text-forest transition-colors underline-offset-2 hover:underline"
                        >
                          {res.location.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-line/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted">
                    {res.verification?.lastVerifiedAt
                      ? `Verified ${res.verification.lastVerifiedAt}`
                      : 'Verified listing'}
                  </span>
                  {res.website ? (
                    <a
                      href={res.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-forest hover:text-forest/80 text-xs transition-colors"
                    >
                      <span>Visit Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : res.location?.phone ? (
                    <a
                      href={`tel:${res.location.phone.replace(/[^0-9]/g, '')}`}
                      className="font-semibold text-forest hover:text-forest/80 text-xs transition-colors"
                    >
                      Call Provider
                    </a>
                  ) : null}
                </div>
              </Section>
            ))}
          </div>
        )}
      </main>

      <AIAssistant caseId={caseId} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
