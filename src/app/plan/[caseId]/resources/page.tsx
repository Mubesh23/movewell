'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { ServiceResource } from '@/types';
import {
  BookOpen,
  MapPin,
  Phone,
  Globe,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
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
    { id: 'donation', label: 'Donation Pickup' },
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
    <div className="min-h-screen bg-sand-100 flex flex-col">
      <Navbar caseId={caseId} seniorName="Local Resources" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-brand-950">Local Houston Resources</h1>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Open Referral HSDS catalog of verified senior transition providers in Harris County
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-brand-900 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-stone-500 font-medium">Finding local verified resources...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-700" />
                      {res.verification?.verificationStatus || 'Verified listing'}
                    </span>
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">
                      {res.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base text-brand-950 leading-tight">
                      {res.name}
                    </h3>
                    <p className="text-xs font-semibold text-stone-600 mt-0.5">
                      {res.organizationName}
                    </p>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                    {res.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-stone-500 pt-2 border-t border-stone-100">
                    {res.location && (
                      <p className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-stone-400 flex-shrink-0" />
                        <span>{res.location.address}, {res.location.city} {res.location.zipCode}</span>
                      </p>
                    )}
                    {res.location?.phone && (
                      <p className="flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1 text-stone-400 flex-shrink-0" />
                        <span>{res.location.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    Verified {res.verification?.lastVerifiedAt}
                  </span>
                  <a
                    href="https://example.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-brand-900 hover:text-brand-700 flex items-center space-x-1"
                  >
                    <span>Contact</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AIAssistant caseId={caseId} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
