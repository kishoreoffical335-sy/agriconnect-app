'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Edit3, Mic, MicOff, Volume2, X, Loader2 } from 'lucide-react';
import { store } from '@/lib/store';
import { getLanguage, INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';
import { parseVoiceListing, ParsedVoiceListing } from '@/lib/voiceListing';
import { transcribeWithWhisper, whisperSupported } from '@/lib/browserWhisper';

interface VoiceListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToManual: (prefillData?: ParsedVoiceListing) => void;
}

const LANG_KEY = 'agriconnect_language';
const WHISPER_FIRST = new Set<LanguageCode>(['hi-IN', 'te-IN']);

const COPY: Record<string, Record<string, string>> = {
  'en-IN': {
    title:'Voice listing', subtitle:'Speak naturally. We convert your words into a listing for you to confirm.', language:'Voice & dashboard language', speak:'Tap and speak', listening:'Listening… tap to stop', processing:'Understanding your voice…', said:'You said', confirm:'Please confirm your listing', produce:'Produce', quantity:'Quantity', quality:'Quality', ready:'Ready', edit:'Edit', confirmListing:'Confirm listing', micError:'Voice input could not start. Allow microphone access and try again.', noSpeech:'No speech detected. Please try again.'
  },
  'hi-IN': {
    title:'आवाज़ से सूची', subtitle:'स्वाभाविक रूप से बोलें। हम आपकी बात को सूची में बदलकर पुष्टि के लिए दिखाएंगे।', language:'आवाज़ और डैशबोर्ड भाषा', speak:'बोलने के लिए दबाएं', listening:'सुन रहे हैं… रोकने के लिए दबाएं', processing:'आपकी आवाज़ समझ रहे हैं…', said:'आपने कहा', confirm:'अपनी सूची की पुष्टि करें', produce:'उपज', quantity:'मात्रा', quality:'गुणवत्ता', ready:'तैयार', edit:'संपादित करें', confirmListing:'सूची की पुष्टि करें', micError:'आवाज़ शुरू नहीं हो सकी। माइक्रोफ़ोन की अनुमति दें और फिर कोशिश करें।', noSpeech:'आवाज़ नहीं मिली। कृपया फिर से बोलें।'
  },
  'te-IN': {
    title:'వాయిస్ జాబితా', subtitle:'సహజంగా మాట్లాడండి. మీ మాటలను జాబితాగా మార్చి నిర్ధారణకు చూపిస్తాము.', language:'వాయిస్ మరియు డాష్‌బోర్డ్ భాష', speak:'మాట్లాడటానికి నొక్కండి', listening:'వింటున్నాము… ఆపడానికి నొక్కండి', processing:'మీ మాటలను అర్థం చేసుకుంటున్నాము…', said:'మీరు చెప్పింది', confirm:'మీ జాబితాను నిర్ధారించండి', produce:'పంట', quantity:'పరిమాణం', quality:'నాణ్యత', ready:'సిద్ధం', edit:'సవరించండి', confirmListing:'జాబితాను నిర్ధారించండి', micError:'వాయిస్ ప్రారంభం కాలేదు. మైక్రోఫోన్ అనుమతించి మళ్లీ ప్రయత్నించండి.', noSpeech:'మాట వినిపించలేదు. దయచేసి మళ్లీ మాట్లాడండి.'
  },
};

export default function VoiceListingModal({ isOpen, onClose, onSuccess, onSwitchToManual }: VoiceListingModalProps) {
  const [language, setLanguage] = useState<LanguageCode>('en-IN');
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedVoiceListing | null>(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem(LANG_KEY) as LanguageCode | null;
    if (saved && INDIAN_LANGUAGES.some(x => x.code === saved)) setLanguage(saved);
  }, [isOpen]);

  const selected = getLanguage(language);
  const copy = COPY[language] || COPY['en-IN'];

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = selected.speechCode;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const applyTranscript = (text: string) => {
    const clean = text.trim();
    if (!clean) {
      setError(copy.noSpeech);
      return;
    }
    setTranscript(clean);
    setParsed(parseVoiceListing(clean));
  };

  const startRecorder = async () => {
    if (!whisperSupported() || !navigator.mediaDevices?.getUserMedia) {
      setError(copy.micError);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
      streamRef.current = stream;
      chunksRef.current = [];
      let mime = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mime = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mime = 'audio/mp4';
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setListening(false);
        setProcessing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          const text = await transcribeWithWhisper(blob, language);
          applyTranscript(text);
        } catch (e) {
          console.error(e);
          setError(copy.micError);
        } finally {
          setProcessing(false);
        }
      };
      recorder.start(250);
      setListening(true);
    } catch (e) {
      console.error(e);
      setError(copy.micError);
    }
  };

  const startBrowserRecognition = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return false;
    try {
      const r = new Recognition();
      recognitionRef.current = r;
      r.lang = selected.speechCode;
      r.continuous = false;
      r.interimResults = false;
      r.maxAlternatives = 5;
      r.onstart = () => setListening(true);
      r.onresult = (event: any) => {
        const text = Array.from(event.results as any).map((x: any) => x[0]?.transcript || '').join(' ');
        applyTranscript(text);
      };
      r.onerror = async (event: any) => {
        setListening(false);
        const code = event.error || 'unknown';
        if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'network') await startRecorder();
        else setError(`${copy.micError} (${code})`);
      };
      r.onend = () => setListening(false);
      r.start();
      return true;
    } catch {
      return false;
    }
  };

  const startListening = async () => {
    setError(''); setTranscript(''); setParsed(null);
    // Hindi/Telugu deliberately use browser Whisper first. This avoids Safari's
    // service-not-allowed failure and makes the selected language deterministic.
    if (WHISPER_FIRST.has(language)) {
      await startRecorder();
      return;
    }
    if (!startBrowserRecognition()) await startRecorder();
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const confirm = () => {
    if (!parsed) return;
    store.addFarmerListing(parsed);
    speak(language === 'hi-IN' ? `${parsed.crop}, ${parsed.quantity_kg} किलोग्राम, ${parsed.quality}. सूची की पुष्टि हो गई।` : language === 'te-IN' ? `${parsed.crop}, ${parsed.quantity_kg} కిలోగ్రాములు, ${parsed.quality}. జాబితా నిర్ధారించబడింది.` : `${parsed.crop}, ${parsed.quantity_kg} kilograms, ${parsed.quality}. Listing confirmed.`);
    onSuccess();
    onClose();
  };

  const chooseLanguage = (value: LanguageCode) => {
    setLanguage(value);
    localStorage.setItem(LANG_KEY, value);
    document.documentElement.lang = value;
    window.dispatchEvent(new CustomEvent('agriconnect-language-change', { detail: value }));
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-emerald-900 px-6 py-5 text-white">
          <div><h2 className="text-xl font-black">{copy.title}</h2><p className="mt-1 text-xs text-emerald-100">{copy.subtitle}</p></div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <Volume2 className="h-5 w-5 text-emerald-700" />
            <label className="flex-1 text-xs font-bold text-emerald-950">{copy.language}</label>
            <select value={language} onChange={e => chooseLanguage(e.target.value as LanguageCode)} className="max-w-[230px] rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-900 outline-none">
              {INDIAN_LANGUAGES.map(x => <option key={x.code} value={x.code}>{x.nativeName} · {x.name}</option>)}
            </select>
          </div>
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-[#f7fbf3] p-8 text-center">
            <button disabled={processing} onClick={listening ? stopListening : startListening} className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-white shadow-xl transition disabled:cursor-wait ${listening ? 'animate-pulse bg-amber-500' : 'bg-emerald-800 hover:scale-105'}`}>
              {processing ? <Loader2 className="h-9 w-9 animate-spin" /> : listening ? <MicOff className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
            </button>
            <p className="mt-4 text-base font-black text-emerald-950">{processing ? copy.processing : listening ? copy.listening : copy.speak}</p>
            <p className="mt-1 text-xs text-slate-500">{selected.nativeName} · {selected.name}</p>
          </div>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {transcript && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-[11px] font-black uppercase tracking-wider text-slate-500">{copy.said}</div><p className="mt-1 text-sm font-semibold text-slate-800">“{transcript}”</p></div>}
          {parsed && <div className="rounded-2xl border-2 border-emerald-500 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 className="h-5 w-5" /> {copy.confirm}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">{copy.produce}</span><b>{parsed.crop}</b></div><div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">{copy.quantity}</span><b>{parsed.quantity_kg.toLocaleString()} kg</b></div><div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">{copy.quality}</span><b>{parsed.quality}</b></div><div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">{copy.ready}</span><b>{parsed.ready_date}</b></div></div>
            <div className="mt-4 flex flex-wrap justify-end gap-2"><button onClick={() => onSwitchToManual(parsed)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold"><Edit3 className="h-4 w-4" /> {copy.edit}</button><button onClick={confirm} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-emerald-950"><CheckCircle2 className="h-4 w-4" /> {copy.confirmListing}</button></div>
          </div>}
        </div>
      </div>
    </div>
  );
}
