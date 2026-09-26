'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CaseOverview } from '@/types';
import { Printer, CheckCircle2, Phone, MapPin, Calendar, Clock } from 'lucide-react';

export default function PrintPlanPage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      fetch(`/api/cases/${caseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setOverview(data.data);
          setLoading(false);
        });
    }
  }, [caseId]);

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <p className="text-sm font-bold text-stone-700">Loading Printable Plan...</p>
      </div>
    );
  }

  const { caseData, seniorProfile, members, tasks, costSummary } = overview;

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
      {/* Print Action Bar (Hidden on print) */}
      <div className="print:hidden flex items-center justify-between pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Printable Transition Plan</h1>
          <p className="text-xs text-stone-500">Share with family, medical staff, or move coordinators</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center space-x-2 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save to PDF</span>
        </button>
      </div>

      {/* Printable Header */}
      <div className="border-b-2 border-stone-900 pb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-serif font-bold text-2xl text-emerald-950">MoveWell</span>
            <span className="text-xs text-stone-400 uppercase tracking-widest font-bold">Transition Summary</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">{seniorProfile.name}&apos;s Housing Transition Plan</h2>
          <p className="text-xs text-stone-600 mt-1">
            Post-Hospital Transition &bull; Houston, TX ({caseData.zipCode}) &bull; Target Move: Nov 7, 2026
          </p>
        </div>

        <div className="text-right space-y-1">
          <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full border border-rose-300">
            {caseData.urgency}
          </span>
          <p className="text-xs text-stone-500 font-medium">Discharge: Nov 1, 2026</p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-xl border border-stone-300 bg-stone-50">
        <div>
          <p className="text-[10px] font-bold text-stone-500 uppercase">Primary Coordinator</p>
          <p className="text-sm font-bold text-stone-900">Sarah (Daughter)</p>
          <p className="text-xs text-stone-600">Chicago, IL (Remote)</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-stone-500 uppercase">Local Support</p>
          <p className="text-sm font-bold text-stone-900">Jennifer (Sister)</p>
          <p className="text-xs text-stone-600">Houston, TX (Local)</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-stone-500 uppercase">Estimated Budget Range</p>
          <p className="text-sm font-bold text-emerald-900">
            ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
          </p>
          <p className="text-[10px] text-stone-500 italic">User budget: ${costSummary.userBudget.toLocaleString()}</p>
        </div>
      </div>

      {/* Task Checklist */}
      <div className="space-y-6">
        <h3 className="text-lg font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          Transition Action Plan
        </h3>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="p-3.5 rounded-lg border border-stone-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full border border-stone-400 ${task.status === 'COMPLETED' ? 'bg-emerald-700 border-emerald-800' : 'bg-white'}`}></span>
                  <span className={`font-bold text-sm ${task.status === 'COMPLETED' ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                    {task.title}
                  </span>
                </div>
                <span className="font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded text-[10px]">
                  {task.status}
                </span>
              </div>

              {task.whyItMatters && (
                <p className="text-stone-600 pl-5 text-[11px] leading-relaxed">
                  <strong>Why:</strong> {task.whyItMatters}
                </p>
              )}

              <div className="flex items-center space-x-4 pl-5 text-[10px] text-stone-500">
                {task.dueDate && <span>Due: {task.dueDate}</span>}
                {task.assignee && <span>Assigned to: {task.assignee.name}</span>}
                {(task.minEstimatedCost > 0 || task.maxEstimatedCost > 0) && (
                  <span>Cost: ${task.minEstimatedCost} - ${task.maxEstimatedCost}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer Footer */}
      <div className="pt-6 border-t border-stone-300 text-center text-xs text-stone-500 italic">
        &ldquo;{costSummary.disclaimer}&rdquo; &bull; Generated by MoveWell Transition Platform &bull; {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
