'use client';

let cachedPipeline: any = null;
let loadingPromise: Promise<any> | null = null;

/**
 * Browser-only multilingual Whisper fallback.
 * It is loaded from the official Transformers.js CDN so Safari/iOS does not
 * depend on the Web Speech service. The model is cached by the browser after
 * the first use.
 */
async function loadPipeline() {
  if (cachedPipeline) return cachedPipeline;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const importer = new Function('url', 'return import(url)') as (url: string) => Promise<any>;
    const { pipeline } = await importer('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0');
    const device = typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm';
    cachedPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      device,
      dtype: 'q8',
    });
    return cachedPipeline;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export async function transcribeWithWhisper(audio: Blob, language?: string): Promise<string> {
  const pipe = await loadPipeline();
  const url = URL.createObjectURL(audio);
  try {
    const options: Record<string, unknown> = {
      task: 'transcribe',
      chunk_length_s: 20,
      stride_length_s: 4,
    };
    if (language) options.language = language;
    const result = await pipe(url, options);
    return String(result?.text || '').trim();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function whisperSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && typeof window.AudioContext !== 'undefined';
}
