'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe2, Mic, Volume2, Loader2 } from 'lucide-react';
import { getLanguage, INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';
import { transcribeWithWhisper } from '@/lib/browserWhisper';

const KEY = 'agriconnect_language';

const COMMANDS: Record<string, string[]> = {
  '/': ['home','मुखपृष्ठ','முகப்பு','హోమ్','ಮುಖಪುಟ','ഹോം','હોમ','ਘਰ','বাড়ি','ଘର','আৰম্ভ','ہوم'],
  '/farmer': ['farmer','farmer dashboard','किसान','விவசாயி','రైతు','ರೈತ','കർഷകൻ','ખેડૂત','ਕਿਸਾਨ','কৃষক','ଚାଷୀ','کسان'],
  '/fpo': ['fpo','fpo dashboard','फपो','எஃப்பிஓ','ఎఫ్‌పీఓ','ಎಫ್‌ಪಿಒ','എഫ്‌പിഒ','એફપીઓ','এফপিও','ଏଫପିଓ'],
  '/buyer': ['buyer','market','marketplace','खरीदार','बाज़ार','வாங்குபவர்','சந்தை','కొనుగోలుదారు','మార్కెట్','ಖರೀದಿದಾರ','ಮಾರುಕಟ್ಟೆ','വാങ്ങുന്നയാൾ','വിപണി','ખરીદદાર','બજાર','ਖਰੀਦਦਾਰ','ਬਾਜ਼ਾਰ','ক্রেতা','بازار'],
  '/matching': ['matching','smart matching','स्मार्ट मैचिंग','स्मार्ट मिलान','ஸ்மார்ட் மேட்சிங்','స్మార్ట్ మ్యాచింగ్','ಸ್ಮಾರ್ಟ್ ಮ್ಯಾಚಿಂಗ್','സ്മാർട്ട് മാച്ചിംഗ്','સ્માર્ટ મેચિંગ','ਸਮਾਰਟ ਮੈਚਿੰਗ'],
  '/logistics': ['logistics','delivery','परिवहन','लॉजिस्टिक्स','போக்குவரத்து','டெலிவரி','రవాణా','ಲಾಜಿಸ್ಟಿಕ್ಸ್','ഗതാഗതം','પરિવહન','ਲੌਜਿਸਟਿਕਸ','পরিবহন','پریونحن'],
};

function routeFromCommand(text: string): string | null {
  const normalized = text.toLocaleLowerCase().trim();
  for (const [route, words] of Object.entries(COMMANDS)) if (words.some((word) => normalized.includes(word.toLocaleLowerCase()))) return route;
  return null;
}

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [language, setLanguage] = useState<LanguageCode>('en-IN');
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguage(language).speechCode;
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceText = (text: string) => {
    const route = routeFromCommand(text);
    if (route) router.push(route);
    else speak('Please say Farmer, FPO, Buyer, Matching, Logistics, or Home.');
  };

  const recorderFallback = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      speak('Microphone is not available. Please allow microphone access for this website.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setListening(false); setProcessing(true);
        try {
          const text = await transcribeWithWhisper(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }), getLanguage(language).name);
          if (text) handleVoiceText(text);
          else speak('I could not hear a command. Please try again.');
        } catch (error) {
          console.error(error);
          speak('Voice navigation could not finish. Please try again.');
        } finally { setProcessing(false); }
      };
      recorder.start(); setListening(true);
    } catch (error) {
      console.error(error); setListening(false); speak('Please allow microphone access and try again.');
    }
  };

  const startVoice = async () => {
    if (processing) return;
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) { await recorderFallback(); return; }
    try {
      const recognition = new Recognition();
      recognition.lang = getLanguage(language).speechCode;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = async (event: any) => {
        setListening(false);
        if (['not-allowed','service-not-allowed','network'].includes(event.error)) await recorderFallback();
      };
      recognition.onresult = (event: any) => {
        const text = Array.from(event.results as any).map((x: any) => x[0]?.transcript || '').join(' ');
        handleVoiceText(text);
      };
      recognition.start();
    } catch { await recorderFallback(); }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex items-center rounded-xl border border-emerald-200 bg-white shadow-sm">
        <Globe2 className="ml-2.5 h-4 w-4 text-emerald-700" />
        <select aria-label="Choose application language" value={language} onChange={(e) => changeLanguage(e.target.value as LanguageCode)} className={`appearance-none bg-transparent py-2 pl-1.5 pr-2 text-sm font-semibold text-slate-800 outline-none ${compact ? 'max-w-[145px]' : 'max-w-[180px]'}`}>
          {INDIAN_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.nativeName} · {item.name}</option>)}
        </select>
      </div>
      <button onClick={() => speak('Welcome to AgriConnect. Speak to open Farmer, FPO, Buyer, Matching or Logistics.')} title="Hear in selected language" className="rounded-xl border border-emerald-200 bg-white p-2 text-emerald-700 hover:bg-emerald-50"><Volume2 className="h-4 w-4" /></button>
      <button onClick={startVoice} disabled={processing} title="Voice navigation" className={`rounded-xl p-2 text-white shadow-sm transition ${listening ? 'bg-amber-500 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-600'} disabled:opacity-60`}>
        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
      </button>
    </div>
  );
}
