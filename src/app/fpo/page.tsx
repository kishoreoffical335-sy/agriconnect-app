'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import {
  User,
  FPO,
  FarmerListing,
  Lot,
  BuyerDemand,
  Match,
  PickupRoute,
  Settlement,
} from '@/lib/types';
import MandiChart from '@/components/MandiChart';
import RouteMap from '@/components/RouteMap';
import { calculateMatchScore } from '@/lib/geoUtils';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Package,
  Store,
  TrendingUp,
  MapPin,
  Truck,
  Coins,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  HelpCircle,
  FileText,
} from 'lucide-react';

export default function FPOPage() {
  const [fpoUser, setFpoUser] = useState<User | null>(null);
  const [currentFpo, setCurrentFpo] = useState<FPO | null>(null);
  const [isVerifiedEntered, setIsVerifiedEntered] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'produce'
    | 'mandi'
    | 'demands'
    | 'matchmaking'
    | 'routes'
    | 'settlement'
    | 'revenue'
  >('dashboard');

  // Multi-select for produce aggregation
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [selectedLotForMatch, setSelectedLotForMatch] = useState<string>('');
  const [selectedDemandForMatch, setSelectedDemandForMatch] = useState<string>('');
  const [selectedMatchForRoute, setSelectedMatchForRoute] = useState<string>('');
  const [selectedLogisticsId, setSelectedLogisticsId] = useState<string>('');

  // Store data state
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const update = () => {
      const cur = store.getCurrentUser();
      if (!cur || cur.role !== 'fpo_manager') {
        const managers = store.getState().users.filter((u) => u.role === 'fpo_manager');
        if (managers.length > 0) {
          store.loginAs(managers[0].id);
          setFpoUser(managers[0]);
        }
      } else {
        setFpoUser(cur);
      }

      const st = store.getState();
      setState(st);

      const fpo = st.fpos.find((f) => f.id === (cur?.fpo_id || st.fpos[0].id)) || st.fpos[0];
      setCurrentFpo(fpo);

      // Auto-initialize matchmaker selections if not set
      const fpoLots = st.lots.filter((l) => l.fpo_id === fpo.id);
      if (fpoLots.length > 0) {
        setSelectedLotForMatch((prev) => prev || fpoLots[0].id);
      }
      if (st.buyerDemands.length > 0) {
        setSelectedDemandForMatch((prev) => prev || st.buyerDemands[0].id);
      }
      if (st.matches.length > 0) {
        setSelectedMatchForRoute((prev) => prev || st.matches[0].id);
      }
    };

    update();
    return store.subscribe(update);
  }, []);

  const fpoId = currentFpo?.id || state.fpos[0]?.id;
  const connectedFarmers = state.users.filter((u) => u.fpo_id === fpoId);
  const connectedListings = store.getAllListingsForFPO(fpoId);
  const activeLots = state.lots.filter((l) => l.fpo_id === fpoId);
  const openDemands = state.buyerDemands;
  const matches = state.matches;
  const routes = state.pickupRoutes.filter((r) => r.fpo_id === fpoId);
  const settlements = state.settlements.filter((s) => s.fpo_id === fpoId);
  const logisticsUsers = state.users.filter((u) => u.role === 'logistics');

  // Aggregation Handler
  const handleCreateLot = () => {
    if (selectedListingIds.length === 0) {
      alert('Please select at least 1 farmer listing to aggregate');
      return;
    }
    const lot = store.createLotFromListings(fpoId, selectedListingIds);
    setSelectedListingIds([]);
    setSelectedLotForMatch(lot.id); // Auto-select newly created lot
    alert(`Buyer-ready Lot created: ${lot.total_quantity_kg.toLocaleString()} kg ${lot.quality} ${lot.crop}`);
    setActiveTab('matchmaking');
  };

  // Matchmaking Handler
  const handleConfirmMatch = () => {
    // Robust selection retrieval from state with active fallback
    const lotIdToMatch = selectedLotForMatch || (activeLots.length > 0 ? activeLots[0].id : '');
    const demandIdToMatch = selectedDemandForMatch || (openDemands.length > 0 ? openDemands[0].id : '');

    console.log('handleConfirmMatch executing with:', { lotIdToMatch, demandIdToMatch });

    if (!lotIdToMatch || !demandIdToMatch) {
      alert('Please select both a Lot and a Buyer Demand to match');
      return;
    }

    const match = store.matchLotWithDemand(lotIdToMatch, demandIdToMatch);
    setSelectedMatchForRoute(match.id);
    alert(`Match Confirmed! Score: ${match.match_score}/100.\n\nProceeding to Transportation Route Planning...`);
    setActiveTab('routes');
  };

  // Route Dispatch Handler
  const handleAssignRoute = () => {
    const matchIdToRoute = selectedMatchForRoute || (matches.length > 0 ? matches[0].id : '');
    const logId = selectedLogisticsId || (logisticsUsers.length > 0 ? logisticsUsers[0].id : '');

    if (!matchIdToRoute) {
      alert('Please select a confirmed match');
      return;
    }
    if (!logId) {
      alert('No logistics partner available');
      return;
    }
    const route = store.planAndAssignRoute(matchIdToRoute, logId);
    alert(`Pickup Route #${route.id.slice(0, 8)} generated (${route.number_of_stops} stops, ${route.total_distance_km} km). Assigned to Logistics Partner!`);
  };


  // Helper for match score preview
  const previewLot = activeLots.find((l) => l.id === selectedLotForMatch) || activeLots[0];
  const previewDemand = openDemands.find((d) => d.id === selectedDemandForMatch) || openDemands[0];
  const matchEvaluation = previewLot && previewDemand
    ? calculateMatchScore(
        previewLot.total_quantity_kg,
        previewDemand.required_quantity_kg,
        previewLot.quality,
        previewDemand.minimum_quality,
        24,
        previewDemand.maximum_price_per_kg,
        48.5,
        2
      )
    : null;

  // Selected listings for visual banner
  const selectedListingsObjects = connectedListings.filter((l) =>
    selectedListingIds.includes(l.id)
  );
  const selectedTotalKg = selectedListingsObjects.reduce((s, l) => s + l.quantity_kg, 0);

  // --- SCREEN 1: FPO VERIFICATION SCREEN ---
  if (!isVerifiedEntered) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">
              🏢 FPO VERIFICATION PORTAL
            </span>
            <h1 className="text-3xl font-black text-slate-900">
              {currentFpo?.name}
            </h1>
            <p className="text-sm font-semibold text-slate-500 font-mono">
              Registration ID: {currentFpo?.registration_id}
            </p>
          </div>

          {/* Verification Badge Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Location
              </span>
              <span className="text-xs font-bold text-slate-800">
                {currentFpo?.village}, {currentFpo?.district}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Farmers
              </span>
              <span className="text-xs font-bold text-emerald-700">
                {connectedFarmers.length} Registered
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Active Listings
              </span>
              <span className="text-xs font-bold text-slate-800">
                {connectedListings.length} Listings
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-800 block uppercase font-bold">
                Status
              </span>
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified FPO
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic">
            Demo FPO Verification (Demonstrating cooperative entity compliance for SIH)
          </p>

          <button
            onClick={() => setIsVerifiedEntered(true)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-base shadow-lg shadow-emerald-200 transition-all hover:scale-[1.01]"
          >
            Enter FPO Operational Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // --- SCREEN 2: FPO OPERATIONAL DASHBOARD & TABS ---
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              TNFC-001 Verified Hub
            </span>
            <span className="text-xs text-slate-500 font-mono">
              GPS: {currentFpo?.latitude}, {currentFpo?.longitude}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {currentFpo?.name}
          </h1>
          <p className="text-xs text-slate-500">
            Cooperative aggregation, mandi benchmarking, route planning, and revenue management
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Operations
          </button>
          <button
            onClick={() => setActiveTab('produce')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'produce'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 Produce ({connectedListings.length})
          </button>
          <button
            onClick={() => setActiveTab('mandi')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'mandi'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 Mandi Prices
          </button>
          <button
            onClick={() => setActiveTab('demands')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'demands'
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏪 Buyer Demands ({openDemands.length})
          </button>
          <button
            onClick={() => setActiveTab('matchmaking')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'matchmaking'
                ? 'bg-white text-amber-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎯 Matchmaker
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'routes'
                ? 'bg-white text-purple-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ Logistics Map
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'revenue'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 Revenue & Charges
          </button>
        </div>
      </div>

      {/* TAB 1: OPERATIONS DASHBOARD (8 KPI Cards) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block">
                Total Farmers
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {connectedFarmers.length}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                Tamil Nadu Cluster
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block">
                Available Produce
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {connectedListings
                  .reduce((s, l) => s + l.quantity_kg, 0)
                  .toLocaleString()}{' '}
                kg
              </span>
              <span className="text-[10px] text-slate-400">Strictly in kg</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block">
                Active Lots
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {activeLots.length} Lots
              </span>
              <span className="text-[10px] text-slate-400">Aggregated</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block">
                Open Buyer Demands
              </span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">
                {openDemands.length} Demands
              </span>
              <span className="text-[10px] text-slate-400">Chennai/Bangalore</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block">
                Matched Lots
              </span>
              <span className="text-2xl font-black text-purple-600 mt-1 block">
                {matches.length} Matched
              </span>
              <span className="text-[10px] text-slate-400">Scored 0-100</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block">
                Active Routes
              </span>
              <span className="text-2xl font-black text-indigo-600 mt-1 block">
                {routes.filter((r) => r.status !== 'completed').length} Pending
              </span>
              <span className="text-[10px] text-slate-400">Logistics dispatch</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 font-medium block">
                Completed Deliveries
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {routes.filter((r) => r.status === 'completed').length} Done
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                Settled to farmers
              </span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-[11px] text-emerald-800 font-bold block">
                FPO Commission (4%)
              </span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">
                ₹{settlements.reduce((s, st) => s + st.fpo_commission, 0).toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Transparent revenue
              </span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              ⚡ FPO Operational Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('produce')}
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-colors"
              >
                <Package className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">
                  Aggregate Produce
                </span>
                <span className="text-[10px] text-slate-500">
                  Select listings to lot
                </span>
              </button>

              <button
                onClick={() => setActiveTab('mandi')}
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-amber-600 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">
                  Check Mandi Trends
                </span>
                <span className="text-[10px] text-slate-500">
                  14-day price charts
                </span>
              </button>

              <button
                onClick={() => setActiveTab('matchmaking')}
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-colors"
              >
                <Sparkles className="w-5 h-5 text-blue-600 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">
                  Score & Match Buyer
                </span>
                <span className="text-[10px] text-slate-500">
                  Algorithm 0-100
                </span>
              </button>

              <button
                onClick={() => setActiveTab('routes')}
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-colors"
              >
                <Truck className="w-5 h-5 text-purple-600 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">
                  Dispatch Logistics
                </span>
                <span className="text-[10px] text-slate-500">
                  Haversine route plan
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VIEW FARMER PRODUCE & CREATE LOT */}
      {activeTab === 'produce' && (
        <div className="space-y-5">
          {/* Visual Aggregation Banner when items selected */}
          {selectedListingIds.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-5 rounded-2xl border border-emerald-500/40 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Aggregation Flow Visualizer
                </span>
                <span className="text-xs font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                  {selectedListingIds.length} Farmers Selected
                </span>
              </div>

              {/* Visual Summary: 6 FARMERS -> 10,000 kg -> GRADE A TOMATO -> BUYER-READY LOT */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/70 rounded-xl text-center text-xs">
                <div className="flex-1 min-w-[100px]">
                  <span className="font-extrabold text-white block">
                    {selectedListingIds.length} FARMERS
                  </span>
                  <span className="text-[10px] text-slate-400">Contributors</span>
                </div>
                <div className="text-emerald-400 font-bold">↓</div>
                <div className="flex-1 min-w-[100px]">
                  <span className="font-extrabold text-emerald-400 text-sm block">
                    {selectedTotalKg.toLocaleString()} kg
                  </span>
                  <span className="text-[10px] text-slate-400">Aggregated Weight</span>
                </div>
                <div className="text-emerald-400 font-bold">↓</div>
                <div className="flex-1 min-w-[100px]">
                  <span className="font-extrabold text-white block">
                    GRADE A TOMATO
                  </span>
                  <span className="text-[10px] text-slate-400">Standardized</span>
                </div>
                <div className="text-emerald-400 font-bold">↓</div>
                <div className="flex-1 min-w-[100px]">
                  <span className="font-extrabold text-amber-400 block">
                    BUYER-READY LOT
                  </span>
                  <span className="text-[10px] text-amber-300">Ready for Match</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={() => setSelectedListingIds([])}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  Deselect All
                </button>
                <button
                  onClick={handleCreateLot}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-105"
                >
                  Create Lot from Selected ({selectedTotalKg.toLocaleString()} kg)
                </button>
              </div>
            </div>
          )}

          {/* Farmer Listings Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Connected Farmers&apos; Produce Listings ({connectedListings.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Select listings to aggregate into bulk lots for institutional buyers
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSelectedListingIds(
                      connectedListings
                        .filter((l) => l.status === 'listed')
                        .map((l) => l.id)
                    )
                  }
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors"
                >
                  Select All Available
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10">Select</th>
                    <th className="py-3 px-3">Farmer</th>
                    <th className="py-3 px-3">Village</th>
                    <th className="py-3 px-3">Crop</th>
                    <th className="py-3 px-3">Quantity (kg)</th>
                    <th className="py-3 px-3">Quality</th>
                    <th className="py-3 px-3">Ready Date</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {connectedListings.map((listing) => {
                    const isSelected = selectedListingIds.includes(listing.id);
                    const isAvailable = listing.status === 'listed';

                    return (
                      <tr
                        key={listing.id}
                        onClick={() => {
                          if (!isAvailable) return;
                          setSelectedListingIds((prev) =>
                            prev.includes(listing.id)
                              ? prev.filter((id) => id !== listing.id)
                              : [...prev, listing.id]
                          );
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50/70'
                            : isAvailable
                            ? 'hover:bg-slate-50'
                            : 'opacity-60 bg-slate-50/30'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            disabled={!isAvailable}
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {listing.farmerName}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{listing.village}</td>
                        <td className="py-3 px-3">{listing.crop}</td>
                        <td className="py-3 px-3 font-bold text-emerald-800 text-sm">
                          {listing.quantity_kg.toLocaleString()} kg
                        </td>
                        <td className="py-3 px-3">{listing.quality}</td>
                        <td className="py-3 px-3 text-slate-500">
                          {listing.ready_date}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              listing.status === 'listed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {listing.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANDI PRICE BENCHMARKING */}
      {activeTab === 'mandi' && (
        <div className="space-y-4">
          <MandiChart prices={state.mandiPrices} />
        </div>
      )}

      {/* TAB 4: BUYER DEMANDS */}
      {activeTab === 'demands' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              Active Institutional Buyer Demands ({openDemands.length})
            </h3>
            <p className="text-xs text-slate-500">
              Verified wholesale purchase orders with max pricing and delivery deadlines
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {openDemands.map((demand) => {
              const buyer = state.users.find((u) => u.id === demand.buyer_id);
              return (
                <div
                  key={demand.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-base">
                      {buyer?.name || 'Buyer'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        demand.status === 'open'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {demand.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Required:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {demand.required_quantity_kg.toLocaleString()} kg {demand.crop}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Max Price:</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        ₹{demand.maximum_price_per_kg.toFixed(2)}/kg
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Min Quality:</span>
                      <span className="font-medium text-slate-700">{demand.minimum_quality}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Target Delivery:</span>
                      <span className="font-medium text-slate-700">{demand.delivery_date}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-1 border-t border-slate-200/60 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location: {demand.delivery_location}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: MATCHMAKER & SCORING */}
      {activeTab === 'matchmaking' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Automated Match Engine
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              Map Aggregated Lot to Buyer Demand
            </h3>
          </div>

          {/* Select Lot and Demand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. Select Available Lot:
              </label>
              {activeLots.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  No lots created yet. Go to &quot;Produce&quot; tab and click &quot;Create Lot&quot;.
                </div>
              ) : (
                <select
                  value={selectedLotForMatch || (activeLots.length > 0 ? activeLots[0].id : '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    console.log('Selected Lot ID:', val);
                    setSelectedLotForMatch(val);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {activeLots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.crop} — {lot.total_quantity_kg.toLocaleString()} kg ({lot.quality}) [{lot.status}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                2. Select Buyer Demand:
              </label>
              {openDemands.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  No buyer demands available.
                </div>
              ) : (
                <select
                  value={selectedDemandForMatch || (openDemands.length > 0 ? openDemands[0].id : '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    console.log('Selected Buyer Demand ID:', val);
                    setSelectedDemandForMatch(val);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {openDemands.map((demand) => {
                    const b = state.users.find((u) => u.id === demand.buyer_id);
                    return (
                      <option key={demand.id} value={demand.id}>
                        {b?.name || 'Buyer'} — {demand.required_quantity_kg.toLocaleString()} kg {demand.crop} @ Max ₹{demand.maximum_price_per_kg}/kg
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>

          {/* Match Score Calculation Card */}
          {matchEvaluation && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 border border-slate-800 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> 🎯 MATCH SCORE
                  </span>
                  <h4 className="text-3xl font-black text-white mt-0.5">
                    {matchEvaluation.totalScore} <span className="text-lg font-normal text-slate-400">/ 100</span>
                  </h4>
                </div>
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold self-start sm:self-auto">
                  ✓ High Match Compatibility ({matchEvaluation.totalScore}%)
                </div>
              </div>

              {/* 5 Criteria Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Quantity Fit ({previewLot?.total_quantity_kg.toLocaleString()} kg)</span>
                  </div>
                  <span className="font-bold text-emerald-400">{matchEvaluation.breakdown.quantityFit}/20</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Quality Fit ({previewLot?.quality})</span>
                  </div>
                  <span className="font-bold text-emerald-400">{matchEvaluation.breakdown.qualityFit}/20</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Price Fit (Max ₹{previewDemand?.maximum_price_per_kg}/kg)</span>
                  </div>
                  <span className="font-bold text-emerald-400">{matchEvaluation.breakdown.priceFit}/20</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Distance Fit (&lt; 200 km regional transit)</span>
                  </div>
                  <span className="font-bold text-emerald-400">{matchEvaluation.breakdown.distanceFit}/20</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 sm:col-span-2">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Delivery Feasibility (Target: {previewDemand?.delivery_date})</span>
                  </div>
                  <span className="font-bold text-emerald-400">{matchEvaluation.breakdown.feasibilityFit}/20</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleConfirmMatch}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                  Confirm Match & Proceed to Route Planning →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TRANSPORTATION & LOGISTICS MAP */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          {/* Interactive Map Visualizer */}
          <RouteMap
            fpo={currentFpo!}
            farmers={connectedListings.map((l, idx) => {
              const u = state.users.find((user) => user.id === l.farmer_id)!;
              return {
                user: u,
                quantity_kg: l.quantity_kg,
                crop: l.crop,
                isPickedUp: l.status === 'picked_up' || l.status === 'delivered' || l.status === 'settled',
                stopSequence: idx + 1,
              };
            })}
            buyer={state.users.find((u) => u.role === 'buyer')!}
            showRoute={true}
            totalDistanceKm={48.8}
            transportationCost={1210}
          />

          {/* Route Dispatch Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Transportation Route Planning (Nearest-Neighbor Tour)
                </h3>
                <p className="text-xs text-slate-500">
                  Start: FPO HUB → Visit 6 Farmers → End: BUYER Location (Chennai Wholesale Hub)
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                Cost: ₹1,210 (₹300 fixed + ₹13/km + ₹50/stop)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Confirmed Match:
                </label>
                {matches.length === 0 ? (
                  <div className="text-xs text-amber-700 p-2 bg-amber-50 rounded-lg">
                    No matches yet. Confirm a match in Matchmaker tab.
                  </div>
                ) : (
                  <select
                    value={selectedMatchForRoute || matches[0]?.id}
                    onChange={(e) => setSelectedMatchForRoute(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        Match #{m.id.slice(0, 8)} ({m.quantity_matched_kg.toLocaleString()} kg @ ₹{m.price_per_kg}/kg)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Logistics Partner:
                </label>
                <select
                  value={selectedLogisticsId || logisticsUsers[0]?.id}
                  onChange={(e) => setSelectedLogisticsId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  {logisticsUsers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.village})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAssignRoute}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Dispatch to Logistics Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: FPO REVENUE & CHARGES */}
      {activeTab === 'revenue' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Transparent Revenue Statement
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                FPO Revenue & Charges
              </h3>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
              100% Unbundled & Disclosed
            </span>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 font-mono text-xs sm:text-sm">
              <div className="flex justify-between text-slate-700">
                <span>Total Buyer Purchase Value:</span>
                <span className="font-bold text-slate-900">
                  ₹{settlements.reduce((s, st) => s + st.buyer_value, 250000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Total Farmer Gross Allocation:</span>
                <span className="font-bold text-slate-900">
                  ₹{(250000 - 1210).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total Logistics Cost (Dispatched):</span>
                <span>−₹{settlements.reduce((s, st) => s + st.logistics_cost, 1210).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Total FPO Commission (4% of gross):</span>
                <span>+₹{settlements.reduce((s, st) => s + st.fpo_commission, 9951.60).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Total Platform Tech Fee (1.5%):</span>
                <span>₹{settlements.reduce((s, st) => s + st.platform_fee, 3731.85).toLocaleString()}</span>
              </div>

              <div className="h-px bg-slate-300 my-2" />

              <div className="flex justify-between text-base font-black text-emerald-800">
                <span>FPO Estimated Operating Profit:</span>
                <span>+₹9,951.60</span>
              </div>
            </div>

            <div className="bg-emerald-900 text-white p-5 rounded-2xl border border-emerald-800 space-y-3">
              <h4 className="font-bold text-sm text-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Zero Hidden Charges Guarantee
              </h4>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Unlike traditional mandis where middlemen deduct arbitrary handling fees, moisture losses, and unofficial cuts, AgriConnect standardizes all deductions into clear, transparent line items shown upfront to both the farmer and the buyer.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-mono text-emerald-300 block">
                  • 4.0% FPO Operating Margin
                </span>
                <span className="text-[11px] font-mono text-emerald-300 block">
                  • 1.5% Cloud Platform Fee
                </span>
                <span className="text-[11px] font-mono text-emerald-300 block">
                  • Actual Haversine Distance Logistics Cost
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
