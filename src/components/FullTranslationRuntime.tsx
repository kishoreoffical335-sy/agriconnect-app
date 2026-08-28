'use client';

import { useEffect } from 'react';
import { INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';

const KEY = 'agriconnect_language';
const originals = new WeakMap<Text, string>();
let translating = false;

function collectTextNodes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null = walker.nextNode();
  while (node) {
    const text = node as Text;
    const parent = text.parentElement;
    if (parent && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
      if (!originals.has(text)) originals.set(text, text.nodeValue || '');
      if ((originals.get(text) || '').trim()) nodes.push(text);
    }
    node = walker.nextNode();
  }
  return nodes;
}

async function translateTexts(texts: string[], language: LanguageCode) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, texts }),
  });
  if (!response.ok) throw new Error(`translation ${response.status}`);
  const data = await response.json();
  return Array.isArray(data?.translations) ? data.translations as string[] : [];
}

async function applyLanguage(language: LanguageCode) {
  if (translating) return;
  document.documentElement.lang = language;
  const nodes = collectTextNodes();
  if (language === 'en-IN') {
    nodes.forEach((node) => { node.nodeValue = originals.get(node) || node.nodeValue || ''; });
    return;
  }

  translating = true;
  try {
    const unique = Array.from(new Set(nodes.map((node) => originals.get(node) || '').filter(Boolean)));
    const translated = new Map<string, string>();
    for (let i = 0; i < unique.length; i += 40) {
      const batch = unique.slice(i, i + 40);
      try {
        const result = await translateTexts(batch, language);
        batch.forEach((source, index) => translated.set(source, result[index] || source));
      } catch {
        batch.forEach((source) => translated.set(source, source));
      }
    }
    nodes.forEach((node) => {
      const source = originals.get(node) || '';
      if (source.trim()) node.nodeValue = translated.get(source) || source;
    });
  } finally {
    translating = false;
  }
}

export default function FullTranslationRuntime() {
  useEffect(() => {
    let timer: number | undefined;
    let observer: MutationObserver | null = null;

    const run = () => {
      const saved = (localStorage.getItem(KEY) as LanguageCode | null) || 'en-IN';
      if (!INDIAN_LANGUAGES.some((x) => x.code === saved)) return;
      observer?.disconnect();
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        await applyLanguage(saved);
        observer?.observe(document.body, { childList: true, subtree: true });
      }, 120);
    };

    run();
    const onChange = () => run();
    window.addEventListener('agriconnect-language-change', onChange);
    observer = new MutationObserver(() => run());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('agriconnect-language-change', onChange);
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);

  return null;
}
