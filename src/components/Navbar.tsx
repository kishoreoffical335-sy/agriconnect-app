'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { User, UserRole } from '@/lib/types';
import { Sprout, Building2, Store, Truck, RotateCcw, UserCheck, ChevronDown, Menu, X, BarChart3, Handshake } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const update = () => { setCurrentUser(store.getCurrentUser()); setAllUsers(store.getState().users); };
    update();
    return store.subscribe(update);
  }, []);

  const goUser = (user: User) => {
    store.loginAs(user.id); setOpen(false); setMobile(false);
    router.push(user.role === 'farmer' ? '/farmer' : user.role === 'fpo_manager' ? '/fpo' : user.role === 'buyer' ? '/buyer' : '/logistics');
  };

  const badge = (role?: UserRole) => role === 'farmer' ? 'Farmer' : role === 'fpo_manager' ? 'FPO' : role === 'buyer' ? 'Buyer' : role === 'logistics' ? 'Logistics' : 'Guest';
  const nav = [
    ['/farmer', 'Farmer', Sprout], ['/fpo', 'FPO', Building2], ['/buyer', 'Buyer', Store], ['/matching', 'Matching', Handshake], ['/price-prediction', 'Price AI', BarChart3], ['/logistics', 'Logistics', Truck]
  ] as const;

  const reset = () => { if (!confirm('Reset AgriConnect demo data?')) return; setResetting(true); store.resetDemo(); setTimeout(() => { setResetting(false); router.push('/'); }, 300); };

  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3" onClick={() => setMobile(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200"><Sprout className="h-5 w-5" /></span>
          <span><span className="block text-lg font-black tracking-tight text-slate-950">AgriConnect</span><span className="hidden text-[10px] font-bold uppercase tracking-[.12em] text-emerald-700 sm:block">Farm to market</span></span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">{nav.map(([href, label, Icon]) => <Link key={href} href={href} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${pathname.startsWith(href) ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block"><button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold shadow-sm hover:bg-slate-50"><UserCheck className="h-4 w-4 text-emerald-700" /><span className="max-w-28 truncate">{currentUser?.name || 'Select user'}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{badge(currentUser?.role)}</span><ChevronDown className="h-3.5 w-3.5 text-slate-400" /></button>{open && <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">{allUsers.map(user => <button key={user.id} onClick={() => goUser(user)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold hover:bg-emerald-50"><span>{user.name}</span><span className="text-slate-400">{badge(user.role)}</span></button>)}</div>}</div>
          <button onClick={reset} disabled={resetting} className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 sm:block" title="Reset demo"><RotateCcw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} /></button>
          <button onClick={() => setMobile(!mobile)} className="rounded-xl border border-slate-200 bg-white p-2 lg:hidden">{mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {mobile && <div className="border-t border-slate-100 py-3 lg:hidden"><nav className="grid grid-cols-2 gap-2">{nav.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setMobile(false)} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${pathname.startsWith(href) ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-700'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav></div>}
    </div>
  </header>;
}
