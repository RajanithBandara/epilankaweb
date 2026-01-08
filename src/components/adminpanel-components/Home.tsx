'use client';

import { COLORS } from '@/constants/theme';

export default function HomeDash() {
  return (
      <div
          className="min-h-screen px-6 py-6"
          style={{ backgroundColor: COLORS.background.main, color: COLORS.text.primary }}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1E3A8A]">Dashboard</h1>
              <p className="text-sm text-slate-500">
                Quick overview of the EpiLanka platform activity.
              </p>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-primary">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Stats</h2>
              <p className="text-sm text-slate-500">
                Quick overview of your key metrics and trends.
              </p>
            </div>

            <div className="card-primary">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Map</h2>
              <p className="text-sm text-slate-500">
                Visualize outbreaks and cases across regions.
              </p>
            </div>

            <div className="card-primary">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Activity</h2>
              <p className="text-sm text-slate-500">
                See recent actions, alerts, and notifications.
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
