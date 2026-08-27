'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, IndianRupee } from 'lucide-react';

type Result = {
  crop: string;
  predictedPrice: number;
  minPrice: number;
  maxPrice: number;
  trend: 'Rising' | 'Stable' | 'Falling';
  demandLevel: 'High' | 'Balanced' | 'Low' | 'Unknown';
  confidence: number;
  baselinePrice: number;
  demandAdjustmentPct: number;
  trainingPoints: number;
  model: string;
  recommendation: string;
};

export default function PricePredictionPage() {
  const [crop, setCrop] = useState('Tomato');
  const [quantityKg, setQuantityKg] = useState('5000');
  const [demandKg, setDemandKg] = useState('6000');
  const [quality, setQuality] = useState('Grade A');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function predict() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/price-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop, quantityKg, demandKg, quality }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Prediction failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }

  const TrendIcon = result?.trend === 'Rising' ? TrendingUp : result?.trend === 'Falling' ? TrendingDown : Minus;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> Step 1D · AI Price Intelligence
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Market Price Prediction</h1>
        <p className="text-sm text-slate-500 mt-1">Predict a practical selling range using mandi history, market trend and buyer demand.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900">Prediction inputs</h2>
          <label className="block text-xs font-bold text-slate-600">Crop<select value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"><option>Tomato</option><option>Onion</option><option>Potato</option></select></label>
          <label className="block text-xs font-bold text-slate-600">Available supply (kg)<input type="number" value={quantityKg} onChange={e => setQuantityKg(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
          <label className="block text-xs font-bold text-slate-600">Buyer demand (kg)<input type="number" value={demandKg} onChange={e => setDemandKg(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
          <label className="block text-xs font-bold text-slate-600">Quality<select value={quality} onChange={e => setQuality(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"><option>Grade A</option><option>Grade B</option><option>Grade C</option><option>Premium</option></select></label>
          <button onClick={predict} disabled={loading} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3">{loading ? 'Predicting…' : 'Predict Price'}</button>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          {!result ? (
            <div className="h-full min-h-[300px] flex items-center justify-center text-center text-slate-400 text-sm">Enter the market inputs and run the prediction.</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-emerald-50 p-4"><div className="text-xs text-emerald-700 font-bold">Predicted price</div><div className="text-2xl font-black text-emerald-800 mt-1 flex items-center"><IndianRupee className="w-5 h-5" />{result.predictedPrice.toFixed(2)}</div><div className="text-xs text-slate-500">per kg</div></div>
                <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500 font-bold">Expected range</div><div className="text-lg font-black text-slate-900 mt-2">₹{result.minPrice}–₹{result.maxPrice}</div><div className="text-xs text-slate-500">per kg</div></div>
                <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500 font-bold">Trend</div><div className="text-lg font-black text-slate-900 mt-2 flex gap-1 items-center"><TrendIcon className="w-5 h-5" />{result.trend}</div></div>
                <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500 font-bold">Confidence</div><div className="text-lg font-black text-slate-900 mt-2">{result.confidence}%</div><div className="text-xs text-slate-500">model confidence</div></div>
              </div>

              <div className="border border-emerald-100 bg-emerald-50 rounded-2xl p-5">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Farmer recommendation</div>
                <p className="font-bold text-slate-900 mt-2">{result.recommendation}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-500">Market baseline</span><div className="font-bold mt-1">₹{result.baselinePrice}/kg</div></div>
                <div><span className="text-slate-500">Demand level</span><div className="font-bold mt-1">{result.demandLevel}</div></div>
                <div><span className="text-slate-500">Demand adjustment</span><div className="font-bold mt-1">{result.demandAdjustmentPct > 0 ? '+' : ''}{result.demandAdjustmentPct}%</div></div>
                <div><span className="text-slate-500">Historical points</span><div className="font-bold mt-1">{result.trainingPoints}</div></div>
              </div>
              <p className="text-[11px] text-slate-400">Model: {result.model}. This is a decision-support estimate, not a guaranteed market price.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
