'use client';

import { useEffect, useMemo, useState } from 'react';
import { store } from '@/lib/store';
import { rankLotsForDemand } from '@/lib/matchingEngine';

export default function MatchingPage() {
  const [selectedDemandId, setSelectedDemandId] = useState('');
  const [storeVersion, setStoreVersion] = useState(0);
  const [isCreatingDemoLot, setIsCreatingDemoLot] = useState(false);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => setStoreVersion((version) => version + 1));
    return unsubscribe;
  }, []);

  const state = store.getState();
  const demands = state.buyerDemands.filter((d) => d.status === 'open');
  const selectedDemand = demands.find((d) => d.id === selectedDemandId) || demands[0];
  const demand = selectedDemand;

  const ranked = useMemo(
    () => demand
      ? rankLotsForDemand(
          demand,
          state.lots,
          state.lotListings,
          state.farmerListings,
          state.users,
          state.fpos,
          state.mandiPrices,
        )
      : [],
    [demand, state.lots, state.lotListings, state.farmerListings, state.users, state.fpos, state.mandiPrices, storeVersion],
  );

  const createDemoLot = () => {
    if (isCreatingDemoLot) return;
    setIsCreatingDemoLot(true);
    try {
      const tomatoListings = state.farmerListings
        .filter((listing) => listing.crop.toLowerCase() === 'tomato' && listing.status === 'listed')
        .slice(0, 6)
        .map((listing) => listing.id);
      if (tomatoListings.length === 0) {
        window.alert('No eligible demo farmer listings are available. Use Reset Demo or create farmer listings first.');
        return;
      }
      const fpoId = state.fpos[0]?.id;
      if (!fpoId) {
        window.alert('No FPO is available for demo aggregation.');
        return;
      }
      store.createLotFromListings(fpoId, tomatoListings);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to create the demo lot.');
    } finally {
      setIsCreatingDemoLot(false);
    }
  };

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">AgriConnect Decision Engine</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">Buyer ↔ Lot Matching</h1>
        <p className="mt-1 text-sm text-slate-500">Rank verified lots using crop, quantity, quality, price, distance and delivery feasibility. The recommendation stays explainable.</p>
        {demands.length > 0 && (
          <select value={demand?.id || ''} onChange={(e) => setSelectedDemandId(e.target.value)} className="mt-5 w-full max-w-xl rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">
            {demands.map((item) => <option key={item.id} value={item.id}>{item.crop} · {item.required_quantity_kg.toLocaleString()} kg · max ₹{item.maximum_price_per_kg}/kg · {item.delivery_location}</option>)}
          </select>
        )}
      </section>

      {ranked.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">No created lot is ready for this demand</h2>
              <p className="mt-1 text-amber-900">The buyer demand exists, but matching only considers FPO-created lots. Create the demo aggregation from the seeded farmer listings to test the full B4 flow.</p>
            </div>
            <button type="button" onClick={createDemoLot} disabled={isCreatingDemoLot} className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
              {isCreatingDemoLot ? 'Creating lot…' : 'Create demo FPO lot'}
            </button>
          </div>
        </section>
      ) : ranked.map((item, index) => (
        <section key={item.lot.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">#{index + 1} recommended option</div>
              <h2 className="mt-1 text-lg font-black text-slate-900">{item.lot.crop} · {item.quantityMatchedKg.toLocaleString()} kg</h2>
              <p className="text-sm text-slate-500">FPO lot {item.lot.id.slice(0, 8)} · {item.lot.quality} · {item.distanceKm.toFixed(1)} km to buyer</p>
            </div>
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center"><div className="text-xs font-bold text-emerald-700">MATCH SCORE</div><div className="text-2xl font-black text-emerald-800">{item.score}/100</div></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-6">
            {Object.entries(item.breakdown).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] font-bold uppercase text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</div><div className="mt-1 text-sm font-black text-slate-800">{value}/20</div></div>)}
          </div>
          <div className="mt-5 rounded-xl border border-slate-100 p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Why this match?</div><ul className="mt-2 space-y-1 text-sm text-slate-700">{item.explanation.map((reason) => <li key={reason}>✓ {reason}</li>)}</ul></div>
          {item.priceIntelligence && <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white"><div className="text-xs font-bold uppercase tracking-wider text-slate-300">Price intelligence</div><div className="mt-1 flex flex-wrap items-baseline gap-4"><span className="text-2xl font-black">₹{item.priceIntelligence.predictedPrice.toFixed(2)}/kg</span><span className="text-sm">Expected ₹{item.priceIntelligence.minPrice.toFixed(2)}–₹{item.priceIntelligence.maxPrice.toFixed(2)}</span><span className="text-sm">{item.priceIntelligence.trend} · {item.priceIntelligence.demandLevel} demand · {item.priceIntelligence.confidence}% confidence</span></div><p className="mt-2 text-sm text-slate-300">{item.priceIntelligence.recommendation}</p></div>}
        </section>
      ))}
    </main>
  );
}
