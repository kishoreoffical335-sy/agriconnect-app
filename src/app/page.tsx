'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Building2, CheckCircle2, Coins, Leaf, Map, Mic, Package, Sparkles, Store, Truck, TrendingUp, Users } from 'lucide-react';
import { store } from '@/lib/store';
import { SEEDED_USERS } from '@/lib/seedData';

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ farmers: 6, produce: 10000, lots: 0, matches: 0 });

  useEffect(() => {
    const update = () => {
      const state = store.getState();
      setStats({
        farmers: state.users.filter((u) => u.role === 'farmer').length,
        produce: state.farmerListings.reduce((sum, l) => sum + l.quantity_kg, 0),
        lots: state.lots.length,
        matches: state.matches.length,
      });
    };
    update();
    return store.subscribe(update);
  }, []);

  const login = (role: string) => {
    const user = SEEDED_USERS.find((u) => u.role === role);
    if (!user) return;
    store.loginAs(user.id);
    router.push(role === 'farmer' ? '/farmer' : role === 'fpo_manager' ? '/fpo' : role === 'buyer' ? '/buyer' : '/logistics');
  };

  const roles = [
    { role: 'farmer', title: 'Farmer', desc: 'List produce by voice or form', icon: Mic, tone: 'bg-emerald-600' },
    { role: 'fpo_manager', title: 'FPO', desc: 'Aggregate and manage lots', icon: Building2, tone: 'bg-slate-900' },
    { role: 'buyer', title: 'Buyer', desc: 'Find supply and create demand', icon: Store, tone: 'bg-blue-600' },
    { role: 'logistics', title: 'Logistics', desc: 'Manage pickup and delivery', icon: Truck, tone: 'bg-amber-600' },
  ];

  return (
    <div className="space-y-10 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10 lg:px-14 lg:py-14">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Smart agricultural marketplace
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">From farm gate to buyer, <span className="text-emerald-400">connected.</span></h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">AgriConnect connects farmers, FPOs, buyers and logistics partners with transparent pricing, intelligent matching and a simple workflow.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => login('farmer')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-400">Start as Farmer <ArrowRight className="h-4 w-4" /></button>
              <Link href="/price-prediction" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"><BarChart3 className="h-4 w-4" /> Explore Price AI</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.06] p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Live marketplace</span><span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Active</span></div>
            <div className="grid grid-cols-2 gap-3">
              {[['Farmers', stats.farmers, Users], ['Produce', `${stats.produce.toLocaleString()} kg`, Package], ['Lots', stats.lots, Building2], ['Matches', stats.matches, TrendingUp]].map(([label, value, Icon]) => {
                const I = Icon as React.ElementType;
                return <div key={String(label)} className="rounded-2xl bg-white/[.07] p-4"><I className="mb-3 h-5 w-5 text-emerald-300" /><div className="text-2xl font-black">{value}</div><div className="mt-1 text-xs text-slate-400">{label}</div></div>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">Choose your workspace</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">One platform. Four roles.</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map(({ role, title, desc, icon: Icon, tone }) => <button key={role} onClick={() => login(role)} className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white ${tone}`}><Icon className="h-5 w-5" /></div><h3 className="text-lg font-black text-slate-900">{title}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{desc}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-emerald-700">Open workspace <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></button>)}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[{ icon: Mic, title: 'Speak', text: 'Create a produce listing naturally, including crop, quantity and readiness.' }, { icon: TrendingUp, title: 'Know your price', text: 'Use market context and prediction intelligence before deciding when to sell.' }, { icon: Coins, title: 'Know what you earn', text: 'Follow matching, logistics and settlement with transparent calculations.' }].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-xl font-black text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}
      </section>

      <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 className="h-5 w-5" /> End-to-end supply chain</div><h2 className="mt-2 text-2xl font-black text-slate-950">List → Aggregate → Match → Transport → Settle</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Every stage stays connected so farmers and partners can see what happens to a lot from listing through final settlement.</p></div><Link href="/matching" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">View matching <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
    </div>
  );
}
