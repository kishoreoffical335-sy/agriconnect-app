'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { User, UserRole } from '@/lib/types';
import {
  Sprout,
  Building2,
  Store,
  Truck,
  RotateCcw,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const update = () => {
      setCurrentUser(store.getCurrentUser());
      setAllUsers(store.getState().users);
    };
    update();
    return store.subscribe(update);
  }, []);

  const handleSwitchUser = (user: User) => {
    store.loginAs(user.id);
    setIsDropdownOpen(false);
    if (user.role === 'farmer') router.push('/farmer');
    else if (user.role === 'fpo_manager') router.push('/fpo');
    else if (user.role === 'buyer') router.push('/buyer');
    else if (user.role === 'logistics') router.push('/logistics');
  };

  const handleResetDemo = () => {
    if (confirm('Reset AgriConnect to initial demo state (6 farmers, 2 FPOs, 2 buyers)?')) {
      setIsResetting(true);
      store.resetDemo();
      setTimeout(() => {
        setIsResetting(false);
        router.push('/');
      }, 400);
    }
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'farmer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Sprout className="w-3.5 h-3.5 text-emerald-600" /> Farmer
          </span>
        );
      case 'fpo_manager':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Building2 className="w-3.5 h-3.5 text-amber-600" /> FPO Manager
          </span>
        );
      case 'buyer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Store className="w-3.5 h-3.5 text-blue-600" /> Buyer
          </span>
        );
      case 'logistics':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Truck className="w-3.5 h-3.5 text-purple-600" /> Logistics
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  AgriConnect <span className="text-emerald-600">FPO</span>
                </span>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Speak. Aggregate. Sell. Know What You Earn.
                </p>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-200">
              <Link
                href="/farmer"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/farmer')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Farmer
              </Link>
              <Link
                href="/fpo"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/fpo')
                    ? 'bg-amber-50 text-amber-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                FPO Hub
              </Link>
              <Link
                href="/buyer"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/buyer')
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Buyer
              </Link>
              <Link
                href="/logistics"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/logistics')
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Logistics
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Demo Fast Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm transition-colors shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-left">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-800 text-xs sm:text-sm max-w-[130px] truncate">
                    {currentUser?.name || 'Select User'}
                  </span>
                </div>
                {getRoleBadge(currentUser?.role)}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      ⚡ Quick Role Switcher
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                      SIH Demo
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {/* Farmers */}
                    <div className="p-1">
                      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                        👨🌾 Farmers
                      </div>
                      {allUsers
                        .filter((u) => u.role === 'farmer')
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSwitchUser(user)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                              currentUser?.id === user.id
                                ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{user.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {user.village}
                            </span>
                          </button>
                        ))}
                    </div>

                    {/* FPO Managers */}
                    <div className="p-1">
                      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                        🏢 FPO Managers
                      </div>
                      {allUsers
                        .filter((u) => u.role === 'fpo_manager')
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSwitchUser(user)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                              currentUser?.id === user.id
                                ? 'bg-amber-50 text-amber-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{user.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {user.village}
                            </span>
                          </button>
                        ))}
                    </div>

                    {/* Buyers */}
                    <div className="p-1">
                      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                        🏪 Buyers
                      </div>
                      {allUsers
                        .filter((u) => u.role === 'buyer')
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSwitchUser(user)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                              currentUser?.id === user.id
                                ? 'bg-blue-50 text-blue-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{user.name}</span>
                          </button>
                        ))}
                    </div>

                    {/* Logistics */}
                    <div className="p-1">
                      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                        🚚 Logistics
                      </div>
                      {allUsers
                        .filter((u) => u.role === 'logistics')
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSwitchUser(user)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                              currentUser?.id === user.id
                                ? 'bg-purple-50 text-purple-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{user.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Demo Button */}
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-sm"
              title="Reset all demo data to initial state"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
