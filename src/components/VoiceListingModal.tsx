'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Edit3, Mic, MicOff, Volume2, X } from 'lucide-react';
import { store } from '@/lib/store';
import { INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';
import { parseVoiceListing, ParsedVoiceListing } from '@/lib/voiceListing';

interface VoiceListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToManual: (prefillData?: any) => void;
}

const LANG_KEY = 'agriconnect_language';

export default function VoiceListingModal({ isOpen, onClose, onSuccess, onSwitchToManual }: VoiceListingModalProps) {
  const [language, setLanguage] = useState<LanguageCode>('en-IN');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedVoiceListing | null>(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem(LANG_KEY) as LanguageCode | null;
    if (saved && INDIAN_LANGUAGES.some((x) => x.code === saved)) setLanguage(saved);
  }, [isOpen]);

  const selected = INDIAN_LANGUAGES.find((x) => x.code === language) || INDIAN_LANGUAGES[0];

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = selected.speechCode;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const startListening = () => {
    setError(''); setTranscript(''); setParsed(null);
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) { setError('Voice input is not supported in this browser. Please use Chrome or Edge.'); return; }
    try {
      const r = new Recognition();
      recognitionRef.current = r;
      r.lang = selected.speechCode;
      r.continuous = false;
      r.interimResults = false;
      r.maxAlternatives = 3;
      r.onstart = () => setListening(true);
      r.onresult = (event: any) => {
        const text = Array.from(event.results as any).map((x: any) => x[0]?.transcript || '').join(' ').trim();
        setTranscript(text);
        if (text) setParsed(parseVoiceListing(text));
      };
      r.onerror = (event: any) => setError(event.error === 'not-allowed' ? 'Microphone permission was denied. Allow microphone access and try again.' : `Voice input error: ${event.error || 'unknown'}.`);
      r.onend = () => setListening(false);
      r.start();
    } catch { setListening(false); setError('Could not start the microphone. Try again.'); }
  };

  const stopListening = () => recognitionRef.current?.stop();

  const confirm = () => {
    if (!parsed) return;
    store.addFarmerListing(parsed);
    speak(`${parsed.crop}, ${parsed.quantity_kg} kilograms, ${parsed.quality}. Listing confirmed.`);
    onSuccess(); onClose();
  };

  const chooseLanguage = (value: LanguageCode) => {
    setLanguage(value); localStorage.setItem(LANG_KEY, value); document.documentElement.lang = value;
    window.dispatchEvent(new CustomEvent('agriconnect-language-change', { detail: value }));
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-emerald-900 px-6 py-5 text-white">
          <div><h2 className="text-xl font-black">Voice listing</h2><p className="mt-1 text-xs text-emerald-100">Speak naturally. We convert your words into a listing for you to confirm.</p></div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <Volume2 className="h-5 w-5 text-emerald-700" />
            <label className="flex-1 text-xs font-bold text-emerald-950">Voice & dashboard language</label>
            <select value={language} onChange={(e) => chooseLanguage(e.target.value as LanguageCode)} className="max-w-[210px] rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-900 outline-none">
              {INDIAN_LANGUAGES.map((x) => <option key={x.code} value={x.code}>{x.nativeName} · {x.name}</option>)}
            </select>
          </div>
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-[#f7fbf3] p-8 text-center">
            <button onClick={listening ? stopListening : startListening} className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-white shadow-xl transition ${listening ? 'animate-pulse bg-amber-500' : 'bg-emerald-800 hover:scale-105'}`}>
              {listening ? <MicOff className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
            </button>
            <p className="mt-4 text-base font-black text-emerald-950">{listening ? 'Listening…' : 'Tap and speak'}</p>
            <p className="mt-1 text-xs text-slate-500">{selected.nativeName} · {selected.name}</p>
          </div>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {transcript && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-[11px] font-black uppercase tracking-wider text-slate-500">You said</div><p className="mt-1 text-sm font-semibold text-slate-800">“{transcript}”</p></div>}
          {parsed && <div className="rounded-2xl border-2 border-emerald-500 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 className="h-5 w-5" /> Please confirm your listing</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Produce</span><b>{parsed.crop}</b></div><div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Quantity</span><b>{parsed.quantity_kg.toLocaleString()} kg</b></div><div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Quality</span><b>{parsed.quality}</b></div><div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Ready</span><b>{parsed.ready_date}</b></div></div>
            <div className="mt-4 flex flex-wrap justify-end gap-2"><button onClick={() => onSwitchToManual(parsed)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold"><Edit3 className="h-4 w-4" /> Edit</button><button onClick={confirm} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-emerald-950"><CheckCircle2 className="h-4 w-4" /> Confirm listing</button></div>
          </div>}
        </div>
      </div>
    </div>
  );
}
