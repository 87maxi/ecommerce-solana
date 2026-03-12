'use client';

import { RoleBasedDashboard } from '@/components/RoleBasedDashboard';

export default function Home() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mt-8">
          <RoleBasedDashboard />
        </div>
      </div>
    </div>
  );
}