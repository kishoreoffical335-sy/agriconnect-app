'use client';

import { useEffect, useState } from 'react';
import { Globe2, Mic, Volume2 } from 'lucide-react';
import { getLanguage, INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';

const KEY = 'agriconnect_language';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [language, setLanguage] = useState<LanguageCode>('en-IN');
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as LanguageCode | null;
    if (saved && INDIAN_LANGUAGES.some((l) => l.code === saved)) setLanguage(saved);
  }, []);

  const changeLanguage = (value: LanguageCode) => {
    setLanguage(value);
    localStorage.setItem(KEY, value);
    window.dispatchEvent(new CustomEvent('agriconnect-language-change', { detail: value }));
    document.documentElement.lang = value;
  };

  const speakWelcome = () => {
    if (!('speechSynthesis' in window)) return;
    const selected = getLanguage(language);
    const utterance = new SpeechSynthesisUtterance('Welcome to AgriConnect. Speak to list your produce and track your earnings.');
    utterance.lang = selected.speechCode;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported by this browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = getLanguage(language).speechCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex items-center rounded-xl border border-emerald-200 bg-white shadow-sm">
        <Globe2 className="ml-2.5 h-4 w-4 text-emerald-700" />
        <select
          aria-label="Choose application language"
          value={language}
          onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
          className={`appearance-none bg-transparent py-2 pl-1.5 pr-2 text-sm font-semibold text-slate-800 outline-none ${compact ? 'max-w-[105px]' : 'max-w-[150px]'}`}
        >
          {INDIAN_LANGUAGES.map((item) => (
            <option key={item.code} value={item.code}>{item.nativeName} · {item.name}</option>
          ))}
        </select>
      </div>
      <button onClick={speakWelcome} title="Hear in selected language" className="rounded-xl border border-emerald-200 bg-white p-2 text-emerald-700 hover:bg-emerald-50">
        <Volume2 className="h-4 w-4" />
      </button>
      <button onClick={startVoice} title="Voice control" className={`rounded-xl p-2 text-white shadow-sm transition ${listening ? 'bg-amber-500 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-600'}`}>
        <Mic className="h-4 w-4" />
      </button>
    </div>
  );
}
