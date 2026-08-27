'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { User, FarmerListing, SettlementLine } from '@/lib/types';
import VoiceListingModal from '@/components/VoiceListingModal';
import { generateFarmerRecommendation, AgriRecommendation } from '@/lib/recommendationEngine';
import {
  Mic,
  PlusCircle,
  Package,
  Coins,
  Sparkles,
  CheckCircle2,
  Clock,
  Truck,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  Calendar,
  AlertCircle,
  ChevronRight,
  Info,
  MapPin,
  Store,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';

export default function FarmerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'produce' | 'intelligence' | 'earnings'>('home');
  const [myListings, setMyListings] = useState<FarmerListing[]>([]);
  const [mySettlementLines, setMySettlementLines] = useState<SettlementLine[]>([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual Form State
  const [manualCrop, setManualCrop] = useState('Tomato');
  const [manualQty, setManualQty] = useState('2000');
  const [manualQuality, setManualQuality] = useState('Grade A');
  const [manualDate, setManualDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [manualPrice, setManualPrice] = useState('24.00');
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  // Intelligence Target Crop
  const [intelCrop, setIntelCrop] = useState('Tomato');

  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const update = () => {
      const user = store.getCurrentUser();
      if (!user || user.role !== 'farmer') {
        const farmers = store.getState().users.filter((u) => u.role === 'farmer');
        if (farmers.length > 0) {
          store.loginAs(farmers[0].id);
          setCurrentUser(farmers[0]);
        }
      } else {
        setCurrentUser(user);
      }

      const st = store.getState();
      setState(st);

      if (user) {
        const listings = st.farmerListings.filter((l) => l.farmer_id === user.id);
        const setLines = st.settlementLines.filter((sl) => sl.farmer_id === user.id);
        setMyListings(listings);
        setMySettlementLines(setLines);
        if (listings.length > 0) {
          setIntelCrop(listings[0].crop);
        }
      }
    };

    update();
    return store.subscribe(update);
  }, []);

  // Compute recommendation for current farmer & crop
  const farmerRecommendation = useMemo<AgriRecommendation | null>(() => {
    if (!currentUser) return null;
    const listingForCrop = myListings.find((l) => l.crop.toLowerCase() === intelCrop.toLowerCase());
    return generateFarmerRecommendation(
      {
        crop: intelCrop,
        quantityKg: listingForCrop ? listingForCrop.quantity_kg : 2000,
        quality: listingForCrop ? listingForCrop.quality : 'Grade A',
        village: currentUser.village,
        district: currentUser.district,
        latitude: currentUser.latitude,
        longitude: currentUser.longitude,
        readyDate: listingForCrop?.ready_date,
        expectedPricePerKg: listingForCrop?.expected_price_per_kg || 24,
      },
      {
        buyerDemands: state.buyerDemands,
        mandiPrices: state.mandiPrices,
        users: state.users,
        fpos: state.fpos,
      }
    );
  }, [currentUser, intelCrop, myListings, state.buyerDemands, state.mandiPrices, state.users, state.fpos]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQty || parseInt(manualQty, 10) <= 0) {
      alert('Please enter a valid quantity in kg');
      return;
    }

    store.addFarmerListing({
      crop: manualCrop,
      quantity_kg: parseInt(manualQty, 10),
      quality: manualQuality,
      ready_date: manualDate,
      expected_price_per_kg: parseFloat(manualPrice),
      village: currentUser?.village,
    });

    setShowManualForm(false);
    setActiveTab('produce');
  };

  const handleSwitchToManual = (prefillData?: any) => {
    if (prefillData) {
      setManualCrop(prefillData.crop || 'Tomato');
      setManualQty(String(prefillData.quantity_kg || '2000'));
      setManualQuality(prefillData.quality || 'Grade A');
      setManualDate(prefillData.ready_date || manualDate);
      setManualPrice(String(prefillData.expected_price_per_kg || '24.00'));
    }
    setIsVoiceModalOpen(false);
    setShowManualForm(true);
  };

  // Status Badge Helper
  const getStatusBadge = (status: FarmerListing['status']) => {
    switch (status) {
      case 'listed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            🟢 Listed
          </span>
        );
      case 'lotted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            📦 Lotted
          </span>
        );
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            🎯 Matched
          </span>
        );
      case 'picked_up':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            🚚 Picked Up
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            🏢 Delivered
          </span>
        );
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-900 border border-green-400">
            💰 Settled
          </span>
        );
      default:
        return null;
    }
  };

  // Aggregated Earnings
  const totalGross = mySettlementLines.reduce((s, sl) => s + sl.gross_value, 0);
  const totalLogistics = mySettlementLines.reduce((s, sl) => s + sl.logistics_share, 0);
  const totalFpoComm = mySettlementLines.reduce((s, sl) => s + sl.fpo_commission, 0);
  const totalPlatform = mySettlementLines.reduce((s, sl) => s + sl.platform_fee, 0);
  const totalNet = mySettlementLines.reduce((s, sl) => s + sl.net_realization, 0);
  const avgRetention =
    totalGross > 0 ? Math.round((totalNet / totalGross) * 1000) / 10 : 93.3;

  const TrendIcon =
    farmerRecommendation?.priceForecast.trend === 'Rising'
      ? TrendingUp
      : farmerRecommendation?.priceForecast.trend === 'Falling'
      ? TrendingDown
      : Minus;

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            🌾 Farmer Portal • Tamil Nadu Collective
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">
            Good Morning, {currentUser?.name || 'Farmer'}
          </h1>
          <p className="text-xs text-slate-500">
            Village: {currentUser?.village || 'Kanchipuram'} • Unit: strictly in Kilograms (kg)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'home'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏠 Home
          </button>
          <button
            onClick={() => setActiveTab('produce')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'produce'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 My Produce ({myListings.length})
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'intelligence'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💡 Market Intelligence
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'earnings'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 My Earnings
          </button>
        </div>
      </div>

      {/* TAB 1: HOME (Greeting & Primary CTAs) */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Main Action Card */}
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-700/40 relative overflow-hidden">
            <div className="relative z-10 max-w-xl space-y-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-400/30 inline-block">
                🎤 Voice-First Produce Listing
              </span>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                What do you have to sell today?
              </h2>
              <p className="text-emerald-100/80 text-sm">
                Speak naturally in Tamil or English. AgriConnect extracts your crop, quality, harvest date, and normalizes quantity into kilograms.
              </p>

              {/* CTAs */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-emerald-500/30 hover:scale-105"
                >
                  <Mic className="w-5 h-5" />
                  <span>TAP TO SPEAK</span>
                </button>

                <button
                  onClick={() => setShowManualForm(!showManualForm)}
                  className="flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm sm:text-base rounded-2xl transition-colors backdrop-blur-md"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>ENTER MANUALLY</span>
                </button>

                <button
                  onClick={() => setActiveTab('intelligence')}
                  className="flex items-center gap-2 px-4 py-3.5 bg-emerald-700/60 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>VIEW PRICE & DEMAND ADVICE</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Decision Snapshot Widget */}
          {farmerRecommendation && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Today&apos;s Price & Demand Advisory ({farmerRecommendation.crop})
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Recommendation: {farmerRecommendation.action}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Expected Price</span>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">
                    ₹{farmerRecommendation.priceForecast.predictedPrice.toFixed(2)}/kg
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Range: ₹{farmerRecommendation.priceForecast.minPrice}–₹{farmerRecommendation.priceForecast.maxPrice}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Price Trend</span>
                  <div className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1">
                    <TrendIcon className="w-4 h-4 text-emerald-600" />
                    <span>{farmerRecommendation.priceForecast.trend}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {farmerRecommendation.priceForecast.confidence}% confidence
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Demand Velocity</span>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    {farmerRecommendation.demandForecast.growthTrend}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    ~{farmerRecommendation.demandForecast.historicalAverageDailyKg.toLocaleString()} kg/day
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Preferred Market</span>
                  <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {farmerRecommendation.preferredMarket.split('(')[0]}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {farmerRecommendation.matchingBuyers.length} buyers in area
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                💡 <span className="font-semibold text-slate-800">{farmerRecommendation.actionReason}</span>
              </p>
            </div>
          )}

          {/* Manual Listing Form */}
          {showManualForm && (
            <div className="bg-white rounded-2xl border-2 border-emerald-500 p-6 shadow-md animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                  Manual Produce Listing Form
                </h3>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Crop
                  </label>
                  <select
                    value={manualCrop}
                    onChange={(e) => setManualCrop(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Onion">Onion</option>
                    <option value="Potato">Potato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Quantity (kg) <span className="text-emerald-700 font-bold">*Must be in kg</span>
                  </label>
                  <input
                    type="number"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    placeholder="e.g. 2000"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={manualQuality}
                    onChange={(e) => setManualQuality(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Grade A">Grade A (Export / Prime)</option>
                    <option value="Grade B">Grade B (Standard Market)</option>
                    <option value="Grade C">Grade C (Processing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ready / Harvest Date
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Expected Price per kg (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="e.g. 24.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Village Location
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.village || 'Kanchipuram'}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                  >
                    Create Listing
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Produce Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Recent Active Listings
              </h3>
              <button
                onClick={() => setActiveTab('produce')}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {myListings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No produce listed yet. Tap microphone above or enter manually.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myListings.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">
                        {item.crop}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-emerald-700 text-base">
                        {item.quantity_kg.toLocaleString()} kg
                      </span>{' '}
                      • {item.quality}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Ready: {item.ready_date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY PRODUCE (Table & Status Progression) */}
      {activeTab === 'produce' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                My Produce Inventory ({myListings.length})
              </h3>
              <p className="text-xs text-slate-500">
                Track status across the aggregation and logistics pipeline
              </p>
            </div>
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Mic className="w-4 h-4" /> Add Produce
            </button>
          </div>

          {/* Status Progression Legend */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 text-[11px] uppercase mr-2">
              Lifecycle:
            </span>
            <span>🟢 Listed</span> → <span>📦 Lotted</span> →{' '}
            <span>🎯 Matched</span> → <span>🚚 Picked Up</span> →{' '}
            <span>🏢 Delivered</span> → <span>💰 Settled</span>
          </div>

          {/* Listings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Crop</th>
                  <th className="py-3 px-3">Quantity (kg)</th>
                  <th className="py-3 px-3">Quality</th>
                  <th className="py-3 px-3">Ready Date</th>
                  <th className="py-3 px-3">Expected Price</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {myListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {listing.crop}
                    </td>
                    <td className="py-3.5 px-3 font-black text-emerald-700 text-sm">
                      {listing.quantity_kg.toLocaleString()} kg
                    </td>
                    <td className="py-3.5 px-3">{listing.quality}</td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {listing.ready_date}
                    </td>
                    <td className="py-3.5 px-3">
                      ₹{listing.expected_price_per_kg?.toFixed(2) || '24.00'}/kg
                    </td>
                    <td className="py-3.5 px-3">{getStatusBadge(listing.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MARKET INTELLIGENCE & BUYER MATCHES */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> AgriConnect Combined Intelligence Engine
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Crop Pricing & Demand Guidance
                </h2>
                <p className="text-xs text-slate-500">
                  Transparent decision-support for smallholder farmers. Know the fair market price and buyer demand before dispatch.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Crop</label>
                <select
                  value={intelCrop}
                  onChange={(e) => setIntelCrop(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl font-semibold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Onion">Onion</option>
                  <option value="Potato">Potato</option>
                </select>
              </div>
            </div>

            {farmerRecommendation && (
              <div className="space-y-6">
                {/* Recommendation Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/40">
                      🎯 Action Advice: {farmerRecommendation.action}
                    </span>
                    <span className="text-xs text-slate-300">
                      Target Realization: ~89% of gross value
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white">
                    {farmerRecommendation.actionReason}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                      <span className="text-slate-300 block text-[10px] uppercase font-bold">Expected Price</span>
                      <span className="text-base font-black text-emerald-300">
                        ₹{farmerRecommendation.priceForecast.predictedPrice.toFixed(2)}/kg
                      </span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                      <span className="text-slate-300 block text-[10px] uppercase font-bold">Price Range</span>
                      <span className="text-base font-black text-white">
                        ₹{farmerRecommendation.priceForecast.minPrice}–₹{farmerRecommendation.priceForecast.maxPrice}
                      </span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                      <span className="text-slate-300 block text-[10px] uppercase font-bold">Market Trend</span>
                      <span className="text-base font-black text-white flex items-center gap-1">
                        <TrendIcon className="w-4 h-4 text-emerald-400" />
                        {farmerRecommendation.priceForecast.trend}
                      </span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                      <span className="text-slate-300 block text-[10px] uppercase font-bold">Demand Level</span>
                      <span className="text-base font-black text-white">
                        {farmerRecommendation.priceForecast.demandLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Drivers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Key Market Factors
                    </h4>
                    <ul className="text-xs text-slate-700 space-y-1.5">
                      {farmerRecommendation.keyDrivers.map((driver, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      FPO Collective Advantage
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      By selling through the <span className="font-bold text-slate-800">Tamil Nadu Farmers Collective</span>, your produce is aggregated with neighbouring farmers in your village, unlocking wholesale buyer contracts that pay ₹3-5/kg above unorganized local spot mandis.
                    </p>
                  </div>
                </div>

                {/* Matching Buyers Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-blue-600" />
                      Matching Buyer Demands ({farmerRecommendation.matchingBuyers.length})
                    </h4>
                    <span className="text-xs text-slate-500">
                      Ranked by compatibility, distance, and ceiling price
                    </span>
                  </div>

                  {farmerRecommendation.matchingBuyers.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      No active institutional buyer requests currently match this crop. FPO managers will aggregate your produce for next open auction cycle.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {farmerRecommendation.matchingBuyers.map((buyer) => (
                        <div
                          key={buyer.demandId}
                          className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">
                              {buyer.buyerName}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                              Match: {buyer.matchScore}/100
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 space-y-1">
                            <div>Location: <span className="font-medium text-slate-800">{buyer.buyerLocation}</span> ({buyer.distanceKm.toFixed(1)} km)</div>
                            <div>Required Volume: <span className="font-bold text-blue-700">{buyer.requiredQuantityKg.toLocaleString()} kg</span></div>
                            <div>Ceiling Price: <span className="font-bold text-emerald-700">₹{buyer.maxPricePerKg.toFixed(2)}/kg</span></div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            {buyer.reasons.join(' • ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MY EARNINGS (Payment Transparency Card) */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {/* Main Earnings Summary Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Transparent Payment Summary
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  💰 YOUR FINAL PAYMENT
                </h3>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Net Retention Rate
                </span>
                <span className="text-lg font-black text-emerald-400">
                  You retained {avgRetention}% of gross value
                </span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="max-w-md space-y-3 font-mono text-sm sm:text-base">
              <div className="flex items-center justify-between text-slate-200">
                <span>Gross Produce Value:</span>
                <span className="font-bold text-white">
                  ₹{totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-red-400">
                <span>− Proportional Logistics Share:</span>
                <span>
                  −₹{totalLogistics.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-amber-400">
                <span>− FPO Commission (4%):</span>
                <span>
                  −₹{totalFpoComm.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-purple-400">
                <span>− Platform Fee (1.5%):</span>
                <span>
                  −₹{totalPlatform.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="h-px bg-slate-700 my-2" />

              <div className="flex items-center justify-between text-lg sm:text-xl font-black text-emerald-400 pt-1">
                <span>NET REALIZATION:</span>
                <span>
                  ₹{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2">
              <button
                onClick={() => setShowBreakdownModal(true)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg"
              >
                View Full Settlement Breakdown
              </button>
            </div>
          </div>

          {/* Breakdown Modal */}
          {showBreakdownModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-base">
                    Detailed Settlement Line Item
                  </h4>
                  <button
                    onClick={() => setShowBreakdownModal(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs"
                  >
                    ✕ Close
                  </button>
                </div>

                {mySettlementLines.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No completed settlements yet. Deliveries in transit will appear here automatically upon completion.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {mySettlementLines.map((line) => (
                      <div
                        key={line.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
                      >
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>Quantity: {line.quantity_kg.toLocaleString()} kg</span>
                          <span className="text-emerald-700">
                            Net: ₹{line.net_realization.toFixed(2)} ({line.percentage_retained}% Retained)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 pt-1">
                          <div>Gross: ₹{line.gross_value.toFixed(2)}</div>
                          <div>Logistics: −₹{line.logistics_share.toFixed(2)}</div>
                          <div>FPO (4%): −₹{line.fpo_commission.toFixed(2)}</div>
                          <div>Fee (1.5%): −₹{line.platform_fee.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Listing Modal Component */}
      <VoiceListingModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={() => {
          setActiveTab('produce');
        }}
        onSwitchToManual={handleSwitchToManual}
      />
    </div>
  );
}
