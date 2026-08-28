'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe2, Mic, Volume2 } from 'lucide-react';
import { getLanguage, INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';

const KEY = 'agriconnect_language';
const PROMPTS: Partial<Record<LanguageCode, { welcome: string; retry: string }>> = {
  'hi-IN': { welcome: 'एग्रीकनेक्ट में आपका स्वागत है। किसान, एफपीओ, खरीदार, स्मार्ट मैचिंग, लॉजिस्टिक्स या होम कहें।', retry: 'कृपया किसान, एफपीओ, खरीदार, स्मार्ट मैचिंग, लॉजिस्टिक्स या होम कहें।' },
  'te-IN': { welcome: 'అగ్రికనెక్ట్‌కు స్వాగతం. రైతు, ఎఫ్‌పీఓ, కొనుగోలుదారు, స్మార్ట్ మ్యాచింగ్, లాజిస్టిక్స్ లేదా హోమ్ అని చెప్పండి.', retry: 'దయచేసి రైతు, ఎఫ్‌పీఓ, కొనుగోలుదారు, స్మార్ట్ మ్యాచింగ్, లాజిస్టిక్స్ లేదా హోమ్ అని చెప్పండి.' },
  'ta-IN': { welcome: 'அக்ரிகனெக்ட்டுக்கு வரவேற்கிறோம். விவசாயி, எஃப்பிஓ, வாங்குபவர், ஸ்மார்ட் மேட்சிங், லாஜிஸ்டிக்ஸ் அல்லது முகப்பு என்று சொல்லுங்கள்.', retry: 'விவசாயி, எஃப்பிஓ, வாங்குபவர், ஸ்மார்ட் மேட்சிங், லாஜிஸ்டிக்ஸ் அல்லது முகப்பு என்று சொல்லுங்கள்.' },
  'en-IN': { welcome: 'Welcome to AgriConnect. Say Farmer, FPO, Buyer, Smart Matching, Logistics, or Home.', retry: 'Please say Farmer, FPO, Buyer, Smart Matching, Logistics, or Home.' },
};

const COMMANDS: Record<string, string[]> = {
  '/': ['home','मुखपृष्ठ','முகப்பு','హోమ్','హోమ్ పేజీ','ಮುಖಪುಟ','ഹോം','હોમ','ਬਾਜ਼ਾਰ','বাড়ি','ଘର','ଆରମ୍ଭ'],
  '/farmer': ['farmer','farmer dashboard','किसान','விவசாயி','రైతు','రైతు డాష్‌బోర్డ్','ರೈತ','കർഷകൻ','ખેડૂત','ਕਿਸਾਨ','কৃষক','ଚାଷୀ'],
  '/fpo': ['fpo','fpo dashboard','फपो','एफपीओ','எஃப்பிஓ','ఎఫ్‌పీఓ','ಎಫ್‌ಪಿಒ','എഫ്‌പിഒ','એફપીઓ','এফপিও'],
  '/buyer': ['buyer','market','marketplace','खरीदार','बाज़ार','வாங்குபவர்','சந்தை','కొనుగోలుదారు','మార్కెట్','ఖరీదుదారు','మార్కెట్','ಖರೀದಿದಾರ','മാർക്കറ്റ്','വാങ്ങുന്നയാൾ','વിപણી','ਖਰੀਦਦਾਰ','বাজার'],
  '/matching': ['matching','smart matching','स्मार्ट मैचिंग','स्मार्ट मिलान','ஸ்மார்ட் மேட்சிங்','స్మార్ట్ మ్యాచింగ్','స్మార్ట్ మ్యాచ్','ಸ್ಮಾರ್ಟ್ ಮ್ಯಾಚಿಂಗ್','സ്മാർട്ട് മാച്ചിംഗ്'],
  '/logistics': ['logistics','delivery','परिवहन','लॉजिस्टिक्स','போக்குவரத்து','டெலிவரி','రవాణా','లాజిస్టిక్స్','ಲಾಜಿಸ್ಟಿಕ್ಸ್','ഗതാഗതം','પરિવહન','ਲੌਜਿਸਟਿਕਸ'],
};

function routeFromCommand(text: string): string | null {
  const normalized = text.toLocaleLowerCase().trim();
  for (const [route, words] of Object.entries(COMMANDS)) {
    if (words.some(word => normalized.includes(word.toLocaleLowerCase()))) return route;
  }
  return null;
}

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [language, setLanguage] = useState<LanguageCode>('en-IN');
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as LanguageCode | null;
    if (saved && INDIAN_LANGUAGES.some(l => l.code === saved)) setLanguage(saved);
  }, []);

  const changeLanguage = (value: LanguageCode) => {
    setLanguage(value);
    localStorage.setItem(KEY, value);
    document.documentElement.lang = value;
    window.dispatchEvent(new CustomEvent('agriconnect-language-change', { detail: value }));
  };

  const speakPrompt = (kind: 'welcome' | 'retry') => {
    if (!('speechSynthesis' in window)) return;
    const selected = getLanguage(language);
    const text = PROMPTS[language]?.[kind] || PROMPTS['en-IN']![kind];
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = selected.speechCode;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const startVoice = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      speakPrompt('retry');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = getLanguage(language).speechCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results as any).map((x: any) => x[0]?.transcript || '').join(' ');
      const route = routeFromCommand(text);
      if (route) router.push(route);
      else speakPrompt('retry');
    };
    recognition.start();
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex items-center rounded-xl border border-emerald-200 bg-white shadow-sm">
        <Globe2 className="ml-2.5 h-4 w-4 text-emerald-700" />
        <select aria-label="Choose application language" value={language} onChange={e => changeLanguage(e.target.value as LanguageCode)} className={`appearance-none bg-transparent py-2 pl-1.5 pr-2 text-sm font-semibold text-slate-800 outline-none ${compact ? 'max-w-[145px]' : 'max-w-[180px]'}`}>
          {INDIAN_LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.nativeName} · {item.name}</option>)}
        </select>
      </div>
      <button onClick={() => speakPrompt('welcome')} title="Hear in selected language" className="rounded-xl border border-emerald-200 bg-white p-2 text-emerald-700 hover:bg-emerald-50"><Volume2 className="h-4 w-4" /></button>
      <button onClick={startVoice} title="Voice navigation" className={`rounded-xl p-2 text-white shadow-sm transition ${listening ? 'bg-amber-500 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-600'}`}><Mic className="h-4 w-4" /></button>
    </div>
  );
}
