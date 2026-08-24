'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  Edit3,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { store } from '@/lib/store';

interface VoiceListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToManual: (prefillData?: any) => void;
}

export default function VoiceListingModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToManual,
}: VoiceListingModalProps) {
  const [language, setLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<{
    crop: string;
    quantity_kg: number;
    quality: string;
    ready_date: string;
    expected_price_per_kg: number;
  } | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const samplePrompts = [
    {
      label: 'English 1',
      text: 'I have 2000 kg Grade A tomato ready tomorrow expected price 24',
    },
    {
      label: 'English 2',
      text: 'Listing 1500 kg Grade A tomato ready today price 25 per kg',
    },
    {
      label: 'Tamil / Tanglish',
      text: 'Naan 2500 kg Grade A thakkali nalaiku ready panren price 24',
    },
  ];

  // Natural Language Regex Parser for Produce Listing
  const parseSpeechToProduce = (text: string) => {
    const lower = text.toLowerCase();

    // 1. Crop Detection
    let crop = 'Tomato';
    if (lower.includes('onion') || lower.includes('vengayam')) crop = 'Onion';
    else if (lower.includes('potato') || lower.includes('urulaikilangu') || lower.includes('aloo'))
      crop = 'Potato';
    else if (lower.includes('tomato') || lower.includes('thakkali')) crop = 'Tomato';

    // 2. Quantity Detection (converting quintals/tons to KG strictly)
    let quantity_kg = 2000;
    const qtyMatch = lower.match(/(\d+[\d,]*)\s*(kg|kilos|kilogram|quintal|quintals|ton|tons|tonne|tonnes)?/i);
    if (qtyMatch) {
      const rawNum = parseInt(qtyMatch[1].replace(/,/g, ''), 10);
      const unit = (qtyMatch[2] || '').toLowerCase();

      if (unit.startsWith('quintal')) {
        quantity_kg = rawNum * 100;
      } else if (unit.startsWith('ton')) {
        quantity_kg = rawNum * 1000;
      } else {
        quantity_kg = rawNum;
      }
    }

    // 3. Quality Detection
    let quality = 'Grade A';
    if (lower.includes('grade b') || lower.includes('second quality') || lower.includes('b grade')) {
      quality = 'Grade B';
    } else if (lower.includes('grade c') || lower.includes('third quality')) {
      quality = 'Grade C';
    }

    // 4. Ready Date Detection
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let ready_date = tomorrow.toISOString().split('T')[0];

    if (lower.includes('today') || lower.includes('inniku')) {
      ready_date = new Date().toISOString().split('T')[0];
    } else if (lower.includes('day after') || lower.includes('2 days') || lower.includes('nalaiku marunal')) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      ready_date = d.toISOString().split('T')[0];
    }

    // 5. Expected Price
    let expected_price_per_kg = 24.0;
    const priceMatch = lower.match(/(?:price|rate|rupees|rs|₹)\s*(\d+(?:\.\d+)?)/i) ||
      lower.match(/(\d+(?:\.\d+)?)\s*(?:rs|rupees|\/kg|per kg)/i);
    if (priceMatch) {
      expected_price_per_kg = parseFloat(priceMatch[1]);
    }

    return {
      crop,
      quantity_kg,
      quality,
      ready_date,
      expected_price_per_kg,
    };
  };

  const startListening = () => {
    setErrorMsg('');
    setTranscript('');
    setParsedData(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access denied. Please allow microphone or select a sample voice prompt.');
        } else {
          setErrorMsg(`Voice input noticed: ${event.error}. You can use sample prompt or manual form.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setErrorMsg('Failed to initialize speech recognition.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if (transcript.trim()) {
      handleParse(transcript);
    }
  };

  const handleParse = (text: string) => {
    setIsParsing(true);
    setTimeout(() => {
      const parsed = parseSpeechToProduce(text);
      setParsedData(parsed);
      setIsParsing(false);
    }, 400);
  };

  const handleSelectSamplePrompt = (sampleText: string) => {
    setTranscript(sampleText);
    handleParse(sampleText);
  };

  const handleConfirmListing = () => {
    if (!parsedData) return;
    store.addFarmerListing(parsedData);
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Voice Produce Listing
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Speak in English or Tamil — auto-normalized to kg
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Language Selector */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-600" /> Recognition Language:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setLanguage('en-IN')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  language === 'en-IN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                English (India)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ta-IN')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  language === 'ta-IN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          {/* Microphone Main Controller */}
          <div className="flex flex-col items-center justify-center py-6 bg-slate-50/70 rounded-2xl border border-dashed border-slate-300">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 hover:scale-105'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              )}
            </button>

            <p className="mt-3 text-sm font-semibold text-slate-700">
              {isListening
                ? 'Listening... Click again when finished speaking'
                : 'Tap microphone to speak'}
            </p>
            <p className="text-xs text-slate-400">
              Example: &quot;I have 2000 kg Grade A tomato ready tomorrow&quot;
            </p>
          </div>

          {/* Live Transcript Box */}
          {transcript && (
            <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                You said:
              </span>
              <p className="text-sm font-medium text-slate-800 italic mt-0.5">
                &quot;{transcript}&quot;
              </p>
            </div>
          )}

          {/* Structured Confirmation Screen */}
          {parsedData && !isParsing && (
            <div className="bg-white border-2 border-emerald-500 rounded-xl p-4 shadow-sm animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Extracted Listing Summary
                </span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  100% Normalized in KG
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-xs text-slate-500 block">Crop</span>
                  <span className="font-bold text-slate-900">{parsedData.crop}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-xs text-slate-500 block">Quantity</span>
                  <span className="font-bold text-emerald-700">
                    {parsedData.quantity_kg.toLocaleString()} kg
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-xs text-slate-500 block">Quality</span>
                  <span className="font-bold text-slate-900">{parsedData.quality}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-xs text-slate-500 block">Ready Date</span>
                  <span className="font-bold text-slate-900">{parsedData.ready_date}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSwitchToManual(parsedData)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Manually
                </button>
                <button
                  type="button"
                  onClick={handleConfirmListing}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-md shadow-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm Listing
                </button>
              </div>
            </div>
          )}

          {/* Quick Demo Test Prompts */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> One-Click Spoken Demo Prompts:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSamplePrompt(p.text)}
                  className="text-left px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs transition-colors"
                >
                  <span className="font-semibold text-slate-800">{p.label}:</span>{' '}
                  <span className="text-slate-500">&quot;{p.text.slice(0, 32)}...&quot;</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fallback button */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => onSwitchToManual()}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
            >
              Voice recognition unavailable? Enter Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
