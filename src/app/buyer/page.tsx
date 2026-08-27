'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { store } from '@/lib/store';
import { User, BuyerDemand, Match, Lot } from '@/lib/types';
import { predictBuyerDemand, DemandPredictionResult } from '@/lib/demandPrediction';
import { rankLotsForDemand } from '@/lib/matchingEngine';
import {
  Store,
  PlusCircle,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';

export default function BuyerPage() {
  const [buyerUser, setBuyerUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'demands' | 'matched' | 'discover' | 'forecast'>('demands');
  const [showDemandModal, setShowDemandModal] = useState(false);

  // Demand Form
  const [crop, setCrop] = useState('Tomato');
  const [requiredQty, setRequiredQty] = useState('10000');
  const [minQuality, setMinQuality] = useState('Grade A');
  const [maxPrice, setMaxPrice] = useState('25.00');
  const [deliveryLocation, setDeliveryLocation] = useState('Chennai Wholesale Terminal');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  // Demand Forecast Interactive State
  const [forecastCrop, setForecastCrop] = useState('Tomato');
  const [forecastLocation, setForecastLocation] = useState('Chennai Wholesale Terminal');
  const [forecastHorizon, setForecastHorizon] = useState(7);
  const [forecastResult, setForecastResult] = useState<DemandPredictionResult | null>(null);

  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const update = () => {
      const cur = store.getCurrentUser();
      if (!cur || cur.role !== 'buyer') {
        const buyers = store.getState().users.filter((u) => u.role === 'buyer');
        if (buyers.length > 0) {
          store.loginAs(buyers[0].id);
          setBuyerUser(buyers[0]);
        }
      } else {
        setBuyerUser(cur);
      }
      setState(store.getState());
    };

    update();
    return store.subscribe(update);
  }, []);

  // Compute forecast whenever parameters change
  useEffect(() => {
    const res = predictBuyerDemand(
      {
        crop: forecastCrop,
        location: forecastLocation,
        horizonDays: forecastHorizon,
      },
      state.buyerDemands
    );
    setForecastResult(res);
  }, [forecastCrop, forecastLocation, forecastHorizon, state.buyerDemands]);

  const myDemands = state.buyerDemands.filter((d) => d.buyer_id === buyerUser?.id);
  const myMatches = state.matches.filter((m) =>
    myDemands.some((d) => d.id === m.buyer_demand_id)
  );

  // Available matching opportunities for active open demands
  const openDemands = myDemands.filter((d) => d.status === 'open');
  const activeSelectedDemand = openDemands[0] || myDemands[0];

  const rankedLots = useMemo(() => {
    if (!activeSelectedDemand) return [];
    return rankLotsForDemand(
      activeSelectedDemand,
      state.lots,
      state.lotListings,
      state.farmerListings,
      state.users,
      state.fpos,
      state.mandiPrices
    );
  }, [
    activeSelectedDemand,
    state.lots,
    state.lotListings,
    state.farmerListings,
    state.users,
    state.fpos,
    state.mandiPrices,
  ]);

  const handlePostDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredQty || parseInt(requiredQty, 10) <= 0) {
      alert('Please enter a valid quantity in kg');
      return;
    }

    store.createBuyerDemand({
      crop,
      required_quantity_kg: parseInt(requiredQty, 10),
      minimum_quality: minQuality,
      maximum_price_per_kg: parseFloat(maxPrice),
      delivery_location: deliveryLocation,
      delivery_date: deliveryDate,
    });

    setShowDemandModal(false);
    alert('Institutional demand published successfully!');
  };

  const handleMatchLot = (lotId: string, demandId: string) => {
    try {
      const match = store.matchLotWithDemand(lotId, demandId);
      alert(`Match created successfully! Match Score: ${match.match_score}/100. Pushed to FPO & Logistics dispatch.`);
      setActiveTab('matched');
    } catch (err: any) {
      alert(err?.message || 'Matching failed');
    }
  };

  const TrendIcon =
    forecastResult?.growthTrend === 'Surging'
      ? TrendingUp
      : forecastResult?.growthTrend === 'Declining'
      ? TrendingDown
      : Minus;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
              Institutional Sourcing Hub
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              AI Demand & Price Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {buyerUser?.name || 'Wholesale Buyer'}
          </h1>
          <p className="text-xs text-slate-500">
            Source aggregated, quality-graded produce directly from verified FPOs with explainable matchmaking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDemandModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Post Institutional Demand
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('demands')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'demands'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📋 My Demands ({myDemands.length})
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'discover'
              ? 'bg-purple-50 text-purple-800 border border-purple-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🎯 Discover & Match Lots ({rankedLots.length})
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'forecast'
              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📈 Demand Forecasting AI
        </button>
        <button
          onClick={() => setActiveTab('matched')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'matched'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ✅ Matched Lots ({myMatches.length})
        </button>
      </div>

      {/* TAB 1: MY DEMANDS */}
      {activeTab === 'demands' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Active Procurement Requirements
            </h2>
            <span className="text-xs text-slate-500">
              {myDemands.filter((d) => d.status === 'open').length} open demands awaiting match
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Crop</th>
                  <th className="py-3 px-3">Required (kg)</th>
                  <th className="py-3 px-3">Quality</th>
                  <th className="py-3 px-3">Max Price</th>
                  <th className="py-3 px-3">Delivery Date</th>
                  <th className="py-3 px-3">Delivery Location</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {myDemands.map((demand) => (
                  <tr key={demand.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {demand.crop}
                    </td>
                    <td className="py-3.5 px-3 font-black text-blue-700 text-sm">
                      {demand.required_quantity_kg.toLocaleString()} kg
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 font-semibold rounded-md text-slate-700">
                        {demand.minimum_quality}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold">
                      ₹{demand.maximum_price_per_kg.toFixed(2)}/kg
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {demand.delivery_date}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500">
                      {demand.delivery_location}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          demand.status === 'open'
                            ? 'bg-blue-100 text-blue-800'
                            : demand.status === 'matched'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {demand.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {demand.status === 'open' ? (
                        <button
                          onClick={() => setActiveTab('discover')}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          Find Lots →
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold">Matched ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DISCOVER & MATCH LOTS */}
      {activeTab === 'discover' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                  AgriConnect Matching Engine
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  Available FPO Aggregated Lots
                </h2>
                <p className="text-xs text-slate-500">
                  Lots ranked by crop compatibility, quantity fulfillment, quality grade, distance, and price intelligence.
                </p>
              </div>

              {openDemands.length > 0 && (
                <div className="text-xs font-medium bg-purple-50 text-purple-800 p-2.5 rounded-xl border border-purple-200">
                  Matching against demand: <span className="font-bold">{activeSelectedDemand.crop} ({activeSelectedDemand.required_quantity_kg.toLocaleString()} kg)</span>
                </div>
              )}
            </div>
          </div>

          {rankedLots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Unmatched FPO Lots Available</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All lots for this crop are currently matched, or FPO managers have not yet aggregated farmer listings into a created lot.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rankedLots.map((item, index) => {
                const fpo = state.fpos.find((f) => f.id === item.lot.fpo_id);

                return (
                  <div
                    key={item.lot.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded-md">
                            Rank #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-400 font-mono">
                            Lot #{item.lot.id.slice(0, 8)}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mt-1">
                          {item.lot.total_quantity_kg.toLocaleString()} kg {item.lot.crop} · {item.lot.quality}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Origin FPO: <span className="font-bold text-slate-800">{fpo?.name || 'Tamil Nadu Collective'}</span> ({fpo?.village}, {fpo?.district}) · <span className="font-semibold text-purple-700">{item.distanceKm.toFixed(1)} km away</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Match Score</div>
                          <div className="text-2xl font-black text-emerald-700">
                            {item.score}/100
                          </div>
                        </div>

                        {activeSelectedDemand && (
                          <button
                            onClick={() => handleMatchLot(item.lot.id, activeSelectedDemand.id)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-colors"
                          >
                            Procure & Match
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Breakdown Pillars */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Crop Fit</span>
                        <span className="font-bold text-slate-800">{item.breakdown.cropFit}/20</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Quantity</span>
                        <span className="font-bold text-slate-800">{item.breakdown.quantityFit}/20</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Quality</span>
                        <span className="font-bold text-slate-800">{item.breakdown.qualityFit}/20</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Price</span>
                        <span className="font-bold text-slate-800">{item.breakdown.priceFit}/20</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Distance</span>
                        <span className="font-bold text-slate-800">{item.breakdown.distanceFit}/20</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Feasibility</span>
                        <span className="font-bold text-slate-800">{item.breakdown.feasibilityFit}/20</span>
                      </div>
                    </div>

                    {/* Explainable reasons */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Why this match is recommended:
                      </div>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {item.explanation.map((reason, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEMAND FORECASTING AI */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Phase 1 · Predictive Buyer Demand Modeling
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Institutional Demand Forecast & Procurement Planning
            </h2>
            <p className="text-xs text-slate-500">
              Predict regional produce demand velocity by crop, destination market, and time horizon using seasonal indices and active wholesale benchmarks.
            </p>

            {/* Input Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Crop</label>
                <select
                  value={forecastCrop}
                  onChange={(e) => setForecastCrop(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Onion">Onion</option>
                  <option value="Potato">Potato</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Regional Consumption Hub</label>
                <select
                  value={forecastLocation}
                  onChange={(e) => setForecastLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Chennai Wholesale Terminal">Chennai Wholesale Terminal</option>
                  <option value="Bangalore Central Hub">Bangalore Central Hub</option>
                  <option value="Coimbatore Hub">Coimbatore Hub</option>
                  <option value="Kanchipuram Hub">Kanchipuram Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Forecast Horizon</label>
                <select
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={3}>Next 3 Days (Immediate)</option>
                  <option value={7}>Next 7 Days (1 Week)</option>
                  <option value={14}>Next 14 Days (2 Weeks)</option>
                  <option value={30}>Next 30 Days (Monthly Outlook)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Forecast Output KPIs */}
          {forecastResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase">
                    Predicted Total Demand
                  </span>
                  <div className="text-2xl font-black text-indigo-950 mt-1">
                    {forecastResult.predictedDemandKg.toLocaleString()} kg
                  </div>
                  <span className="text-[11px] text-indigo-600 font-medium">
                    Over {forecastResult.horizonDays} days
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Expected Demand Band
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {forecastResult.minDemandKg.toLocaleString()} – {forecastResult.maxDemandKg.toLocaleString()} kg
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ± Uncertainty buffer
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Growth Trend
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-1 flex items-center gap-1.5">
                    <TrendIcon className="w-5 h-5 text-indigo-600" />
                    <span>{forecastResult.growthTrend}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Seasonal Index: {forecastResult.seasonalIndex}x
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Forecast Reliability
                  </span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {forecastResult.confidence}%
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Model Confidence
                  </span>
                </div>
              </div>

              {/* Actionable Strategy Advice */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-2">
                <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Recommended Procurement Strategy
                </div>
                <p className="text-sm font-semibold text-blue-50 leading-relaxed">
                  {forecastResult.procurementRecommendation}
                </p>
                <div className="pt-2 border-t border-blue-800/60 flex flex-wrap gap-4 text-xs text-blue-200">
                  {forecastResult.primaryDrivers.map((driver, idx) => (
                    <span key={idx}>• {driver}</span>
                  ))}
                </div>
              </div>

              {/* Daily Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Day-by-Day Forecast Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Projected Intake (kg)</th>
                        <th className="py-2.5 px-3">Lower Band (kg)</th>
                        <th className="py-2.5 px-3">Upper Band (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {forecastResult.dailyForecast.map((point) => (
                        <tr key={point.date} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{point.date}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-700">{point.demandKg.toLocaleString()} kg</td>
                          <td className="py-2.5 px-3 text-slate-500">{point.lowerKg.toLocaleString()} kg</td>
                          <td className="py-2.5 px-3 text-slate-500">{point.upperKg.toLocaleString()} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-400">
                  * Note: Projections are indicative estimates based on regional historical indices and active institutional velocity, not financial guarantees.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MATCHED LOTS */}
      {activeTab === 'matched' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myMatches.length === 0 ? (
            <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Matched Lots Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Go to the &quot;Discover & Match Lots&quot; tab to pair your open demands with available FPO produce lots.
              </p>
            </div>
          ) : (
            myMatches.map((match) => {
              const lot = state.lots.find((l) => l.id === match.lot_id);
              const demand = state.buyerDemands.find((d) => d.id === match.buyer_demand_id);
              const fpo = state.fpos.find((f) => f.id === lot?.fpo_id);
              const route = state.pickupRoutes.find((r) => r.match_id === match.id);

              return (
                <div
                  key={match.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Match #{match.id.slice(0, 8)}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                      Score: {match.match_score}/100
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700">
                    <div className="font-bold text-slate-900 text-sm">
                      {match.quantity_matched_kg.toLocaleString()} kg {lot?.crop || 'Tomato'} ({lot?.quality})
                    </div>
                    <div>Origin Collective: <span className="font-bold">{fpo?.name}</span> ({fpo?.village})</div>
                    <div>Final Agreed Price: <span className="font-bold text-emerald-700">₹{match.price_per_kg}/kg</span></div>
                    <div>Total Order Value: <span className="font-bold text-slate-900">₹{(match.price_per_kg * match.quantity_matched_kg).toLocaleString()}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Logistics Status:</span>
                    <span className="font-bold text-purple-700 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      {lot?.status === 'delivered'
                        ? '✅ Delivered to Hub'
                        : route
                        ? `🚚 In Transit (${route.total_distance_km} km)`
                        : '📋 Route Pending'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CREATE DEMAND MODAL */}
      {showDemandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" /> Post Institutional Demand
              </h3>
              <button
                onClick={() => setShowDemandModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handlePostDemand} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Crop</label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Onion">Onion</option>
                  <option value="Potato">Potato</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Quantity (kg)</label>
                <input
                  type="number"
                  value={requiredQty}
                  onChange={(e) => setRequiredQty(e.target.value)}
                  required
                  placeholder="e.g. 10000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-blue-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Minimum Quality</label>
                <select
                  value={minQuality}
                  onChange={(e) => setMinQuality(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Grade A">Grade A (Prime)</option>
                  <option value="Grade B">Grade B (Standard)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Ceiling Price (₹/kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Delivery Location</label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Delivery Target Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2 pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDemandModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Post Demand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
