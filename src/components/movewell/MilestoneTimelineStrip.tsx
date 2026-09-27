'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface MilestoneItem {
  date: string;
  title: string;
  detail?: string;
  active?: boolean;
}

interface MilestoneTimelineStripProps {
  caseId: string;
  dischargeDate?: string;
  daysUntilDischarge?: number;
}

export const MilestoneTimelineStrip: React.FC<MilestoneTimelineStripProps> = ({
  caseId,
  dischargeDate,
  daysUntilDischarge,
}) => {
  const formatDischargeLabel = () => {
    if (dischargeDate) {
      const parts = dischargeDate.split('-');
      if (parts.length === 3) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const m = months[parseInt(parts[1], 10) - 1];
        return `${m} ${parseInt(parts[2], 10)}`;
      }
    }
    return daysUntilDischarge !== undefined ? `In ${daysUntilDischarge}d` : 'Target date';
  };

  const milestones: MilestoneItem[] = [
    {
      date: 'STEP 1',
      title: 'Confirm discharge destination',
      detail: 'Hospital rehab vs return home',
      active: true,
    },
    {
      date: 'STEP 2',
      title: 'Home safety & access visit',
      detail: 'Check stairs, grab bars & walker access',
    },
    {
      date: formatDischargeLabel(),
      title: 'Discharge & transportation',
      detail: 'Secure medical ride & family receiver',
    },
    {
      date: 'FIRST 30 DAYS',
      title: 'First home health check-in',
      detail: 'Medication review & care coverage',
    },
  ];

  return (
    <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
        <div>
          <h2 className="font-semibold text-sm sm:text-base text-[#183331]">
            Upcoming timeline
          </h2>
          <p className="mt-0.5 text-xs text-[#879890]">
            A simple, grounding view of the milestones ahead
          </p>
        </div>
        <Link
          href={`/plan/${caseId}/tasks`}
          className="text-xs font-semibold text-[#3f6c5c] hover:text-[#1f4d45] inline-flex items-center gap-1 transition-colors"
        >
          <span>View all tasks</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {milestones.map((m, idx) => (
          <div
            key={idx}
            className={`relative rounded-xl p-4 border transition-all ${
              m.active
                ? 'bg-[#eff7f0] border-[#bcd6c3]'
                : 'bg-[#f7f9f7] border-[#eef3ef]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`size-2 rounded-full shrink-0 ${
                  m.active ? 'bg-[#b96c2c] ring-4 ring-[#b96c2c]/20' : 'bg-[#b9cbbd]'
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9b94]">
                {m.date}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#183331] leading-tight">
              {m.title}
            </p>
            {m.detail && (
              <p className="mt-1 text-xs text-[#71847d] leading-relaxed">
                {m.detail}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
