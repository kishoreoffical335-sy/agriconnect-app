'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { rankLotsForDemand } from '@/lib/matchingEngine';
import { Sparkles, CheckCircle2, ArrowRight, Package, Store, MapPin, IndianRupee } from 'lucide-react';

export default function MatchingPage() {
  const router = useRouter();
  const [state, setState] = useState(store.getState());
  const [selectedDemandId, setSelectedDemandId] = useState(store.getState().buyerDemands[0]?.id || '');

  useEffect(() => {
    const update = () => {
      setState(store.getState());
    };
    update();
    return store.subscribe(update);
  }, []);

  const demands = state.buyerDemands.filter((d) => d.status === 'open');
  const demand = demands.find((d) => d.id === selectedDemandId) || demands[0];

  const ranked = useMemo(
    () =>
      demand
        ? rankLotsForDemand(
            demand,
            state.lots,
            state.lotListings,
            state.farmerListings,
            state.users,
            state.fpos,
            state.mandiPrices
          )
        : [],
    [demand, state.lots, state.lotListings, state.farmerListings, state.users, state.fpos, state.mandiPrices]
  );

  const handleExecuteMatch = (lotId: string, demandId: string) => {
    try {
      const match = store.matchLotWithDemand(lotId, demandId);
      alert(`Match confirmed! Score: ${match.match_score}/100. Pushed to FPO & Logistics dispatch.`);
      router.push('/fpo');
    } catch (err: any) {
      alert(err?.message || 'Matching failed');
    }
  };

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> AgriConnect Decision Engine
        </div>
        <h1 className="mt-1 text-2xl font-black text-slate-900">Buyer ↔ Lot Matching Workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rank verified lots using crop, quantity, quality, price, distance and delivery feasibility. The recommendation stays explainable.
        </p>
        {demands.length > 0 ? (
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-600 mb-1">Select Open Buyer Demand:</label>
            <select
              value={demand?.id}
              onChange={(e) => setSelectedDemandId(e.target.value)}
              className="w-full max-w-xl rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              {demands.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.crop} · {item.required_quantity_kg.toLocaleString()} kg · max ₹{item.maximum_price_per_kg}/kg · {item.delivery_location}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs font-medium rounded-xl border border-blue-200">
            All current buyer demands are matched or completed. Post a new demand in the Buyer portal to match.
          </div>
        )}
      </section>

      {ranked.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          No eligible created lots are currently available for this demand. FPO managers can aggregate farmer listings into a created lot in the FPO Hub.
        </section>
      ) : (
        ranked.map((item, index) => (
          <section key={item.lot.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  #{index + 1} recommended option
                </div>
                <h2 className="mt-1 text-lg font-black text-slate-900">
                  {item.lot.crop} · {item.quantityMatchedKg.toLocaleString()} kg ({item.lot.quality})
                </h2>
                <p className="text-sm text-slate-500">
                  FPO lot #{item.lot.id.slice(0, 8)} · {item.distanceKm.toFixed(1)} km to buyer destination
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center border border-emerald-200">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">MATCH SCORE</div>
                  <div className="text-2xl font-black text-emerald-800">{item.score}/100</div>
                </div>

                {demand && (
                  <button
                    onClick={() => handleExecuteMatch(item.lot.id, demand.id)}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-colors"
                  >
                    Confirm & Match
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
              {Object.entries(item.breakdown).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-slate-50 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div className="mt-1 text-sm font-black text-slate-800">{value}/20</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Why this match?
              </div>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {item.explanation.map((reason) => (
                  <li key={reason} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {item.priceIntelligence && (
              <div className="rounded-xl bg-slate-900 p-4 text-white">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Price Intelligence Guidance
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-4">
                  <span className="text-2xl font-black">₹{item.priceIntelligence.predictedPrice.toFixed(2)}/kg</span>
                  <span className="text-sm text-slate-300">Expected ₹{item.priceIntelligence.minPrice.toFixed(2)}–₹{item.priceIntelligence.maxPrice.toFixed(2)}</span>
                  <span className="text-sm text-slate-300">
                    {item.priceIntelligence.trend} trend · {item.priceIntelligence.demandLevel} demand · {item.priceIntelligence.confidence}% confidence
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.priceIntelligence.recommendation}</p>
              </div>
            )}
          </section>
        ))
      )}
    </main>
  );
}
