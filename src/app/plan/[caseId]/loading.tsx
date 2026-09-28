import React from 'react';

export default function WorkspaceLoading() {
  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#183331]">
      <div className="flex">
        {/* Sidebar Skeleton */}
        <aside className="hidden lg:block w-[238px] border-r border-[#e1e9e3] bg-white p-6 min-h-screen">
          <div className="h-9 w-32 bg-[#edf2ee] rounded-xl animate-pulse mb-8" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-full bg-[#f2f6f2] rounded-lg animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Content Skeleton */}
        <main className="flex-1 p-6 sm:p-10 max-w-[1240px] mx-auto space-y-6">
          <div className="h-10 w-64 bg-[#edf2ee] rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-white border border-[#e1e9e3] rounded-2xl animate-pulse" />
            <div className="h-32 bg-white border border-[#e1e9e3] rounded-2xl animate-pulse" />
            <div className="h-32 bg-white border border-[#e1e9e3] rounded-2xl animate-pulse" />
          </div>
          <div className="h-64 bg-white border border-[#e1e9e3] rounded-2xl animate-pulse" />
        </main>
      </div>
    </div>
  );
}
