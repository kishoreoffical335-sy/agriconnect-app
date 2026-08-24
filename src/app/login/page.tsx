'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { SEEDED_USERS } from '@/lib/seedData';
import { User, UserRole } from '@/lib/types';
import {
  Sprout,
  Building2,
  Store,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');

  const usersByRole = SEEDED_USERS.filter((u) => u.role === selectedRole);

  const handleLogin = (user: User) => {
    store.loginAs(user.id);
    if (user.role === 'farmer') router.push('/farmer');
    else if (user.role === 'fpo_manager') router.push('/fpo');
    else if (user.role === 'buyer') router.push('/buyer');
    else if (user.role === 'logistics') router.push('/logistics');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Multi-Role Authentication
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Select Your Persona
        </h1>
        <p className="text-sm text-slate-500">
          Experience data isolation and role-specific workflows across the supply chain
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedRole('farmer')}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
            selectedRole === 'farmer'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="text-sm">Farmer</span>
          <span className="text-[11px] text-slate-400">6 Accounts</span>
        </button>

        <button
          onClick={() => setSelectedRole('fpo_manager')}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
            selectedRole === 'fpo_manager'
              ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 font-bold'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-sm">FPO Manager</span>
          <span className="text-[11px] text-slate-400">2 Collectives</span>
        </button>

        <button
          onClick={() => setSelectedRole('buyer')}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
            selectedRole === 'buyer'
              ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-500/20 font-bold'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <span className="text-sm">Wholesale Buyer</span>
          <span className="text-[11px] text-slate-400">2 Buyers</span>
        </button>

        <button
          onClick={() => setSelectedRole('logistics')}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
            selectedRole === 'logistics'
              ? 'bg-purple-50 border-purple-500 text-purple-950 ring-2 ring-purple-500/20 font-bold'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-sm">Logistics Partner</span>
          <span className="text-[11px] text-slate-400">2 Fleets</span>
        </button>
      </div>

      {/* User Accounts List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available {selectedRole.replace('_', ' ')} Accounts
          </span>
          <span className="text-xs text-slate-500">
            Click any account to authenticate instantly
          </span>
        </div>

        <div className="space-y-2.5">
          {usersByRole.map((user) => (
            <button
              key={user.id}
              onClick={() => handleLogin(user)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group"
            >
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-emerald-800 text-sm sm:text-base">
                  {user.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {user.email} • {user.village}, {user.district}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
