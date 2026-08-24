'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic,
  Package,
  Building2,
  Store,
  Map,
  Truck,
  Coins,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { store } from '@/lib/store';
import { SEEDED_USERS } from '@/lib/seedData';

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    farmersCount: 6,
    totalProduceKg: 10000,
    lotsCount: 0,
    matchesCount: 0,
  });

  useEffect(() => {
    const updateStats = () => {
      const state = store.getState();
      const totalKg = state.farmerListings.reduce((s, l) => s + l.quantity_kg, 0);
      setStats({
        farmersCount: state.users.filter((u) => u.role === 'farmer').length,
        totalProduceKg: totalKg,
        lotsCount: state.lots.length,
        matchesCount: state.matches.length,
      });
    };
    updateStats();
    return store.subscribe(updateStats);
  }, []);

  const handleQuickLogin = (role: string, index = 0) => {
    const user = SEEDED_USERS.filter((u) => u.role === role)[index];
    if (user) {
      store.loginAs(user.id);
      if (role === 'farmer') router.push('/farmer');
      else if (role === 'fpo_manager') router.push('/fpo');
      else if (role === 'buyer') router.push('/buyer');
      else if (role === 'logistics') router.push('/logistics');
    }
  };

  const steps = [
    { icon: Mic, label: 'SPEAK', desc: 'Voice produce listing in Tamil / English' },
    { icon: Package, label: 'LIST', desc: 'Normalized strictly in kg with quality grade' },
    { icon: Building2, label: 'AGGREGATE', desc: 'FPO creates buyer-ready lots from farmers' },
    { icon: Store, label: 'MATCH', desc: 'Intelligent scoring (0-100) with buyer demands' },
    { icon: Map, label: 'MAP', desc: 'Interactive geographic route visualization' },
    { icon: Truck, label: 'TRANSPORT', desc: 'Optimized pickups & transparent dispatch' },
    { icon: Coins, label: 'SETTLE', desc: 'Automated payment with transparent charges' },
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative text-center py-10 sm:py-16 overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-12 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Smart India Hackathon Prototype
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            AgriConnect <span className="text-emerald-400">FPO</span>
          </h1>

          <p className="text-xl sm:text-2xl font-medium text-slate-200">
            &quot;Speak. Aggregate. Sell. Know What You Earn.&quot;
          </p>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            A transparent agricultural supply chain connecting smallholder farmers, FPO collectives, wholesale buyers, and logistics partners with zero hidden fees.
          </p>

          {/* Quick Role Access Buttons */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <button
              onClick={() => handleQuickLogin('farmer', 0)}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400/40 text-white font-bold transition-all shadow-lg hover:scale-105"
            >
              <Mic className="w-5 h-5 mb-1" />
              <span className="text-sm">Farmer Login</span>
              <span className="text-[10px] text-emerald-200 font-normal">Farmer A</span>
            </button>

            <button
              onClick={() => handleQuickLogin('fpo_manager', 0)}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-600/90 hover:bg-amber-500 border border-amber-400/40 text-white font-bold transition-all shadow-lg hover:scale-105"
            >
              <Building2 className="w-5 h-5 mb-1" />
              <span className="text-sm">FPO Manager</span>
              <span className="text-[10px] text-amber-200 font-normal">TNFC-001</span>
            </button>

            <button
              onClick={() => handleQuickLogin('buyer', 0)}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-blue-600/90 hover:bg-blue-500 border border-blue-400/40 text-white font-bold transition-all shadow-lg hover:scale-105"
            >
              <Store className="w-5 h-5 mb-1" />
              <span className="text-sm">Buyer Login</span>
              <span className="text-[10px] text-blue-200 font-normal">ABC Fresh</span>
            </button>

            <button
              onClick={() => handleQuickLogin('logistics', 0)}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-purple-600/90 hover:bg-purple-500 border border-purple-400/40 text-white font-bold transition-all shadow-lg hover:scale-105"
            >
              <Truck className="w-5 h-5 mb-1" />
              <span className="text-sm">Logistics</span>
              <span className="text-[10px] text-purple-200 font-normal">Quick Transport</span>
            </button>
          </div>
        </div>
      </section>

      {/* Visual Story Banner */}
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            End-to-End Operational Pipeline
          </h2>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            How AgriConnect Solves Agricultural Disconnect
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-2 hover:border-emerald-400 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-black tracking-wide text-slate-900">
                  {idx + 1}. {s.label}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live System Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Registered Farmers
            </span>
            <span className="text-2xl font-black text-slate-900">
              {stats.farmersCount} Farmers
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Available Produce
            </span>
            <span className="text-2xl font-black text-emerald-600">
              {stats.totalProduceKg.toLocaleString()} kg
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Active Lots
            </span>
            <span className="text-2xl font-black text-slate-900">
              {stats.lotsCount} Lots
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Buyer Matches
            </span>
            <span className="text-2xl font-black text-purple-700">
              {stats.matchesCount} Matched
            </span>
          </div>
        </div>
      </section>

      {/* SIH 11-Step Hackathon Walkthrough Guide */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Judges & Evaluators Walkthrough
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              11-Step Zero-Edit Demonstration
            </h3>
          </div>
          <button
            onClick={() => {
              store.resetDemo();
              alert('Database reset to fresh state with 6 farmers ready!');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset Initial Demo State
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-700 block">Step 1: Farmer Produce Listings</span>
            <p className="text-slate-600">
              Login as Farmer A-F. Use 🎤 voice recognition (&quot;I have 2000 kg tomato ready tomorrow&quot;) or manual form to list produce in kilograms.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-amber-700 block">Step 2 & 3: FPO Verification & Aggregation</span>
            <p className="text-slate-600">
              Login as FPO Manager (TNFC-001). Review 6 farmers&apos; 10,000 kg Grade A produce and aggregate them into a single buyer-ready lot.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-blue-700 block">Step 4 & 5: Mandi Context & Matchmaking</span>
            <p className="text-slate-600">
              Check 14-day Mandi price chart (₹25.50/kg). Match lot with ABC Fresh demand (10,000 kg @ ₹25/kg) with automated 91/100 score.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-purple-700 block">Step 6 & 7: Map Route & Dispatch</span>
            <p className="text-slate-600">
              Inspect interactive map with 6 stops (~50 km) and transparent ₹1,210 transportation cost calculation. Assign to Quick Transport.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-indigo-700 block">Step 8 & 9: Logistics Fulfillment & Settlement</span>
            <p className="text-slate-600">
              Login as Logistics partner. Mark farmer stops picked up sequentially. Mark delivered to automatically trigger transparent settlement ledger.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 block">Step 10 & 11: Earnings & FPO Profit</span>
            <p className="text-slate-600">
              Login as Farmer to view exact net realization and % retained. Login as FPO to inspect transparent 4% commission and operating margins.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
