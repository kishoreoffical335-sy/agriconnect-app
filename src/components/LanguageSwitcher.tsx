'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe2, Mic, Volume2 } from 'lucide-react';
import { getLanguage, INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';

const KEY = 'agriconnect_language';

const COMMANDS: Record<string, string[]> = {
  '/': ['home','मुखपृष्ठ','முகப்பு','హోమ్','ಮುಖಪುಟ','ഹോം','હોમ','ਬਾਜ਼ਾਰ','বাড়ি','ଘର','ଆରମ୍ଭ'],
  '/farmer': ['farmer','farmer dashboard','किसान','விவசாயி','రైతు','ರೈತ','കർഷകൻ','ખેડૂત','ਕਿਸਾਨ','কৃষক','ଚାଷୀ'],
  '/fpo': ['fpo','fpo dashboard','फपो','எஃப்பிஓ','ఎఫ్‌పీఓ','ಎಫ್‌ಪಿಒ','എഫ്‌പിഒ','એફપીઓ','এফপিও'],
  '/buyer': ['buyer','market','marketplace','खरीदार','बाज़ार','வாங்குபவர்','சந்தை','కొనుగోలుదారు','మార్కెట్','ಖರೀದಿದಾರ','ಮಾರುಕಟ್ಟೆ','വാങ്ങുന്നയാൾ','വിപണി','ખરીદદાર','બજાર','ਖਰੀਦਦਾਰ','ਬਾਜ਼ਾਰ'],
  '/matching': ['matching','smart matching','स्मार्ट मैचिंग','स्मાર્ટ मिलान','ஸ்மார்ட் மேட்சிங்','స్మార్ట్ మ్యాచింగ్','ಸ್ಮಾರ್ಟ್ ಮ್ಯಾಚಿಂಗ್','സ്മാർട്ട് മാച്ചിംഗ്'],
  '/logistics': ['logistics','delivery','परिवहन','लॉजिस्टिक्स','போக்குவரத்து','டெலிவரி','రవాణా','ಲಾಜಿಸ್ಟಿಕ್ಸ್','ഗതാഗതം','પરિવહન','ਲੌਜਿਸਟਿਕਸ'],
};

function routeFromCommand(text: string): string | null {
  const normalized = text.toLocaleLowerCase().trim();
  for (const [route, words] of Object.entries(COMMANDS)) {
    if (words.some((word) => normalized.includes(word.toLocaleLowerCase()))) return route;
  }
  return null;
}

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [language, setLanguage] = useState<LanguageCode>('en-IN');
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as LanguageCode | null;
    if (saved && INDIAN_LANGUAGES.some((l) => l.code === saved)) setLanguage(saved);
  }, []);

  const changeLanguage = (value: LanguageCode) => {
    setLanguage(value);
    localStorage.setItem(KEY, value);
    document.documentElement.lang = value;
    window.dispatchEvent(new CustomEvent('agriconnect-language-change', { detail: value }));
  };

  const speakWelcome = () => {
    if (!('speechSynthesis' in window)) return;
    const selected = getLanguage(language);
    const utterance = new SpeechSynthesisUtterance('Welcome to AgriConnect. Speak to open Farmer, FPO, Buyer, Matching or Logistics.');
    utterance.lang = selected.speechCode;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Use the Farmer Voice Listing for multilingual browser Whisper transcription.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = getLanguage(language).speechCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results as any).map((x: any) => x[0]?.transcript || '').join(' ');
      const route = routeFromCommand(text);
      if (route) {
        router.push(route);
        return;
      }
      const utterance = new SpeechSynthesisUtterance('Please say Farmer, FPO, Buyer, Matching, Logistics, or Home.');
      utterance.lang = getLanguage(language).speechCode;
      window.speechSynthesis.speak(utterance);
    };
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
          className={`appearance-none bg-transparent py-2 pl-1.5 pr-2 text-sm font-semibold text-slate-800 outline-none ${compact ? 'max-w-[145px]' : 'max-w-[180px]'}`}
        >
          {INDIAN_LANGUAGES.map((item) => (
            <option key={item.code} value={item.code}>{item.nativeName} · {item.name}</option>
          ))}
        </select>
      </div>
      <button onClick={speakWelcome} title="Hear in selected language" className="rounded-xl border border-emerald-200 bg-white p-2 text-emerald-700 hover:bg-emerald-50">
        <Volume2 className="h-4 w-4" />
      </button>
      <button onClick={startVoice} title="Voice navigation" className={`rounded-xl p-2 text-white shadow-sm transition ${listening ? 'bg-amber-500 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-600'}`}>
        <Mic className="h-4 w-4" />
      </button>
    </div>
  );
}
