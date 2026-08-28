'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sprout, Store, Building2, Truck, BrainCircuit } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const links = [
  { href: '/farmer', label: 'Farmer', icon: Sprout },
  { href: '/fpo', label: 'FPO', icon: Building2 },
  { href: '/buyer', label: 'Marketplace', icon: Store },
  { href: '/matching', label: 'Smart Match', icon: BrainCircuit },
  { href: '/logistics', label: 'Logistics', icon: Truck },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur-xl shadow-[0_2px_14px_rgba(15,75,30,0.06)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-fit items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-800 to-green-500 text-white shadow-md shadow-emerald-100">
            <Sprout className="h-6 w-6" />
          </div>
          <div className="leading-none">
            <div className="text-xl font-black tracking-tight text-emerald-950">Agri<span className="text-emerald-600">Connect</span></div>
            <div className="mt-1 hidden text-[10px] font-semibold tracking-wide text-slate-500 sm:block">CONNECT • AGGREGATE • GROW TOGETHER</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-800'}`}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link href="/login" className="hidden rounded-xl bg-amber-400 px-4 py-2 text-sm font-extrabold text-emerald-950 shadow-sm hover:bg-amber-300 sm:block">Get Started</Link>
        </div>
      </div>
    </header>
  );
}
