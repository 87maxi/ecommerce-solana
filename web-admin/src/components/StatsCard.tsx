'use client';

import React from 'react';

import { Card, CardContent } from '@/components/ui/card';

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
};

export function StatsCard({
  title,
  value,
  icon,
  color,
  description,
}: StatsCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5 hover:border-cyan-500/40">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div
            className={`flex-shrink-0 rounded-xl p-3 ${color} shadow-lg opacity-90 hover:opacity-100 transition-opacity`}
          >
            {icon}
          </div>
          <div className="ml-6 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-400 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {value}
                </div>
              </dd>
              {description && (
                <dd className="mt-2 text-sm text-slate-500">
                  {description}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
