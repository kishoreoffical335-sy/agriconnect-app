'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { User, BuyerDemand, Match, Lot } from '@/lib/types';
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
} from 'lucide-react';

export default function BuyerPage() {
  const [buyerUser, setBuyerUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'demands' | 'matched' | 'deliveries'>('demands');
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

  const myDemands = state.buyerDemands.filter((d) => d.buyer_id === buyerUser?.id);
  const myMatches = state.matches.filter((m) =>
    myDemands.some((d) => d.id === m.buyer_demand_id)
  );

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
              Institutional Sourcing Hub
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {buyerUser?.name || 'Wholesale Buyer'}
          </h1>
          <p className="text-xs text-slate-500">
            Source aggregated, quality-graded produce directly from verified FPOs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDemandModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Create New Demand
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
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
                    <td className="py-3.5 px-3">{demand.minimum_quality}</td>
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
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {demand.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MATCHED LOTS */}
      {activeTab === 'matched' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myMatches.map((match) => {
            const lot = state.lots.find((l) => l.id === match.lot_id);
            const demand = state.buyerDemands.find((d) => d.id === match.buyer_demand_id);
            const fpo = state.fpos.find((f) => f.id === lot?.fpo_id);

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
                  <div>Origin Collective: <span className="font-bold">{fpo?.name}</span></div>
                  <div>Final Agreed Price: <span className="font-bold text-emerald-700">₹{match.price_per_kg}/kg</span></div>
                  <div>Total Order Value: <span className="font-bold text-slate-900">₹{(match.price_per_kg * match.quantity_matched_kg).toLocaleString()}</span></div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Logistics Status:</span>
                  <span className="font-bold text-purple-700">
                    {lot?.status === 'delivered' ? '✅ Delivered to Hub' : '🚚 In Transit'}
                  </span>
                </div>
              </div>
            );
          })}
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
