'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Building2, CheckCircle2, ChevronRight, Mic, Package, ShoppingCart, Sprout, Truck, WalletCards } from 'lucide-react';
import { store } from '@/lib/store';
import { SEEDED_USERS } from '@/lib/seedData';
import { CROP_CATALOG, CROP_CATEGORIES } from '@/lib/cropCatalog';
import { getLanguage, INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';

const crops = CROP_CATALOG.slice(0, 10);

export default function LandingPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<LanguageCode>('en-IN');
  const [listening, setListening] = useState(false);
  const [stats, setStats] = useState({ farmers: 0, produce: 0, lots: 0, matches: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('agriconnect_language') as LanguageCode | null;
    if (saved && INDIAN_LANGUAGES.some((l) => l.code === saved)) setLanguage(saved);
    const update = () => {
      const s = store.getState();
      setStats({ farmers: s.users.filter((u) => u.role === 'farmer').length, produce: s.farmerListings.reduce((n, x) => n + x.quantity_kg, 0), lots: s.lots.length, matches: s.matches.length });
    };
    update();
    return store.subscribe(update);
  }, []);

  const selectedLanguage = useMemo(() => getLanguage(language), [language]);

  const setAppLanguage = (value: LanguageCode) => {
    setLanguage(value);
    localStorage.setItem('agriconnect_language', value);
    document.documentElement.lang = value;
    window.dispatchEvent(new CustomEvent('agriconnect-language-change', { detail: value }));
  };

  const voiceList = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return alert('Voice listing works best in Chrome or Edge.');
    const recognition = new Recognition();
    recognition.lang = selectedLanguage.speechCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      localStorage.setItem('agriconnect_voice_draft', transcript);
      router.push('/farmer?voice=1');
    };
    recognition.start();
  };

  const quickLogin = (role: string) => {
    const user = SEEDED_USERS.find((u) => u.role === role);
    if (!user) return;
    store.loginAs(user.id);
    router.push(role === 'farmer' ? '/farmer' : role === 'fpo_manager' ? '/fpo' : role === 'buyer' ? '/buyer' : '/logistics');
  };

  return (
    <div className="min-h-screen bg-[#f7fbf3]">
      <section className="relative overflow-hidden border-b border-emerald-100 bg-white">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-amber-200/35 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pt-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800"><Sprout className="h-4 w-4" /> Farmer-first marketplace</div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-emerald-950 sm:text-6xl">Sell your harvest with <span className="text-emerald-600">clarity.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">AgriConnect connects farmers, FPOs and serious buyers. List by voice, aggregate fairly, match intelligently, move efficiently and see exactly what you earn.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={voiceList} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 ${listening ? 'bg-amber-500' : 'bg-emerald-800 hover:bg-emerald-700'}`}><Mic className="h-5 w-5" /> {listening ? 'Listening…' : 'Speak to list produce'}</button>
              <Link href="/buyer" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3.5 text-sm font-black text-emerald-800 hover:bg-emerald-50">Explore marketplace <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"><span>Use AgriConnect in</span><select value={language} onChange={(e) => setAppLanguage(e.target.value as LanguageCode)} className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 font-bold text-emerald-800 outline-none">{INDIAN_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.nativeName} · {l.name}</option>)}</select><span>• voice + dashboard language</span></div>
          </div>

          <div className="relative rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-700 p-4 shadow-2xl shadow-emerald-200/50 sm:p-6">
            <div className="rounded-[1.5rem] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-500">TODAY'S FARMER HUB</p><h2 className="mt-1 text-2xl font-black text-emerald-950">Vanakkam, Ramesh 🌱</h2></div><button onClick={voiceList} className="rounded-2xl bg-amber-400 p-3 text-emerald-950"><Mic className="h-5 w-5" /></button></div>
              <div className="mt-5 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-500 p-5 text-white"><p className="text-sm font-bold">List your produce</p><p className="mt-1 text-xs text-emerald-50">Speak naturally in your selected language.</p><div className="mt-4 flex gap-2"><button onClick={voiceList} className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-emerald-950">🎙 Start voice listing</button><Link href="/farmer" className="rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white">Open dashboard</Link></div></div>
              <div className="mt-5 grid grid-cols-3 gap-2">{[['Tomato','2,000 kg','₹24'],['Onion','750 kg','₹20.1'],['Rice','1,500 kg','₹38']].map(([name, qty, price]) => <div key={name} className="rounded-xl border border-slate-100 p-3"><div className="text-xs font-bold text-slate-800">{name}</div><div className="mt-1 text-[11px] text-slate-500">{qty}</div><div className="mt-2 text-sm font-black text-emerald-700">{price}<span className="text-[9px] font-semibold">/kg</span></div></div>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Farmers', stats.farmers, UsersIcon],['Produce', `${stats.produce.toLocaleString()} kg`, Package],['Lots', stats.lots, Building2],['Matches', stats.matches, BarChart3]].map(([label, value, Icon]: any) => <div key={label as string} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"><Icon className="h-5 w-5 text-emerald-600" /><div className="mt-3 text-2xl font-black text-emerald-950">{value}</div><div className="text-xs font-semibold text-slate-500">{label}</div></div>)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-emerald-700">Daily marketplace</p><h2 className="mt-1 text-2xl font-black text-emerald-950">Produce you can trade every day</h2></div><Link href="/buyer" className="hidden items-center gap-1 text-sm font-bold text-emerald-700 sm:flex">View all <ChevronRight className="h-4 w-4" /></Link></div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{CROP_CATEGORIES.map((cat) => <span key={cat.id} className="whitespace-nowrap rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-bold text-slate-600">{cat.label}</span>)}</div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{crops.map((crop) => <Link href="/buyer" key={crop.id} className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-2xl">{crop.category === 'spices' ? '🌶️' : crop.category === 'rice' ? '🌾' : crop.category === 'wheat' || crop.category === 'grains' ? '🌾' : '🥬'}</div><div className="mt-3 text-sm font-black text-slate-900">{crop.name}</div><div className="mt-1 text-[11px] font-semibold capitalize text-slate-500">{crop.category}</div></Link>)}</div>
      </section>

      <section className="border-y border-emerald-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="grid gap-5 lg:grid-cols-4">{[[Mic,'1','Speak','List in your own language'],[Package,'2','Aggregate','FPO verifies and builds buyer-ready lots'],[ShoppingCart,'3','Match','Smart scoring connects supply and demand'],[WalletCards,'4','Know your earnings','Transparent price, charges and settlement']].map(([Icon,n,title,desc]: any) => <div key={n} className="relative rounded-2xl border border-slate-100 bg-[#f8fcf5] p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-white"><Icon className="h-5 w-5" /></div><span className="text-xs font-black text-amber-600">0{n}</span></div><h3 className="mt-4 font-black text-emerald-950">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p></div>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="rounded-[2rem] bg-emerald-950 p-7 text-white sm:p-10"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-black uppercase tracking-widest text-amber-300">Built for India</p><h2 className="mt-2 text-3xl font-black">One app. Farmer, FPO, buyer and logistics.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100">The interface is designed as a working product—not a presentation page. Every role has a job to do, every transaction has a visible state, and every key action can be driven from the farmer experience.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Farmer','/farmer'],['FPO','/fpo'],['Buyer','/buyer'],['Logistics','/logistics']].map(([label,href]) => <Link href={href} key={label} className="rounded-xl bg-white/10 px-4 py-3 text-center text-xs font-black hover:bg-white/20">{label}</Link>)}</div></div></div></section>

      <footer className="border-t border-emerald-100 bg-white py-6"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span className="font-black text-emerald-900">AgriConnect</span><span>Connect. Aggregate. Grow Together. • Language: {selectedLanguage.nativeName}</span></div></footer>
    </div>
  );
}

function UsersIcon(props: any) {
  return <Sprout {...props} />;
}
