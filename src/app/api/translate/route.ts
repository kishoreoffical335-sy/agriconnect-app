import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TARGETS: Record<string, string> = {
  'hi-IN': 'hi', 'te-IN': 'te', 'ta-IN': 'ta', 'en-IN': 'en',
  'bn-IN': 'bn', 'mr-IN': 'mr', 'gu-IN': 'gu', 'kn-IN': 'kn', 'ml-IN': 'ml',
  'pa-IN': 'pa', 'or-IN': 'or', 'as-IN': 'as', 'ur-IN': 'ur', 'ne-IN': 'ne',
};

const cache = new Map<string, string>();

async function translateOne(text: string, target: string): Promise<string> {
  const value = text.trim();
  if (!value || target === 'en') return text;
  const key = `${target}:${value}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', target);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', value.slice(0, 4500));

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0 AgriConnect/1.0' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`translation upstream ${response.status}`);

  const data = await response.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map((part: any[]) => String(part?.[0] ?? '')).join('')
    : '';
  const result = translated || text;
  cache.set(key, result);
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const language = String(body?.language || 'en-IN');
    const target = TARGETS[language] || 'en';
    const texts = Array.isArray(body?.texts)
      ? body.texts.map((x: unknown) => String(x ?? '')).slice(0, 60)
      : [];

    if (target === 'en' || texts.length === 0) {
      return NextResponse.json({ translations: texts });
    }

    const results: string[] = new Array(texts.length);
    for (let i = 0; i < texts.length; i += 5) {
      const batch = texts.slice(i, i + 5);
      const translated = await Promise.all(batch.map(async (text: string) => {
        try { return await translateOne(text, target); } catch { return text; }
      }));
      translated.forEach((value, offset) => { results[i + offset] = value; });
    }

    return NextResponse.json({ translations: results });
  } catch (error) {
    console.error('Translation route error', error);
    return NextResponse.json({ translations: [] }, { status: 200 });
  }
}
