'use client';

let cachedPipelines: Record<string, any> = {};
let loadingPromises: Record<string, Promise<any> | null> = {};

/**
 * Browser-only multilingual Whisper fallback.
 * Safari can expose SpeechRecognition but return service-not-allowed, so the
 * recorder path must remain a first-class transcription path.
 */
const WHISPER_LANGUAGE: Record<string, string> = {
  'en-IN': 'english',
  'hi-IN': 'hindi',
  'te-IN': 'telugu',
  'ta-IN': 'tamil',
};

async function loadPipeline(language: string) {
  if (cachedPipelines[language]) return cachedPipelines[language];
  if (loadingPromises[language]) return loadingPromises[language];

  loadingPromises[language] = (async () => {
    const importer = new Function('url', 'return import(url)') as (url: string) => Promise<any>;
    const { pipeline } = await importer('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0');

    // WASM is deliberately preferred for Safari/iOS reliability. WebGPU can be
    // enabled by callers later, but it is not required for this demo flow.
    const options: Record<string, unknown> = {
      device: 'wasm',
      dtype: 'q8',
    };

    cachedPipelines[language] = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny',
      options,
    );
    return cachedPipelines[language];
  })();

  try {
    return await loadingPromises[language];
  } finally {
    loadingPromises[language] = null;
  }
}

export async function transcribeWithWhisper(audio: Blob, language = 'en-IN'): Promise<string> {
  const whisperLanguage = WHISPER_LANGUAGE[language] || language.split('-')[0] || 'english';
  const pipe = await loadPipeline(whisperLanguage);
  const url = URL.createObjectURL(audio);
  try {
    const result = await pipe(url, {
      task: 'transcribe',
      language: whisperLanguage,
      chunk_length_s: 15,
      stride_length_s: 3,
      return_timestamps: false,
    });
    return String(result?.text || '').trim();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function whisperSupported(): boolean {
  return typeof window !== 'undefined'
    && typeof window.MediaRecorder !== 'undefined'
    && typeof window.AudioContext !== 'undefined';
}
