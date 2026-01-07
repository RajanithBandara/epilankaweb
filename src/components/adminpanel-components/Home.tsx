'use client';

export default function HomeDash() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold mb-2">Stats</h2>
            <p className="text-sm text-gray-300">Quick overview of your app metrics.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold mb-2">Map</h2>
            <p className="text-sm text-gray-300">Embed your map component here.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold mb-2">Activity</h2>
            <p className="text-sm text-gray-300">Recent actions and notifications.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

