import { CROP_CATALOG } from '@/lib/cropCatalog';

export interface ParsedVoiceListing {
  crop: string;
  quantity_kg: number;
  quality: string;
  ready_date: string;
  expected_price_per_kg: number;
}

const aliases: Record<string, string[]> = {
  Tomato: ['tomato', 'thakkali', 'tamatar', 'टमाटर', 'టమాటా', 'ಟೊಮೇಟೊ', 'தக்காளி', 'തക്കാളി', 'ટમેટા', 'টমেটো', 'ਪੱਕਾ ਟਮਾਟਰ'],
  Onion: ['onion', 'vengayam', 'pyaz', 'प्याज', 'ఉల్లిపాయ', 'ಈರುಳ್ಳಿ', 'வெங்காயம்', 'സവാള', 'ડુંગળી', 'পেঁয়াজ', 'ਪਿਆਜ਼'],
  Potato: ['potato', 'aloo', 'urulaikilangu', 'आलू', 'బంగాళాదుంప', 'ಆಲೂಗಡ್ಡೆ', 'உருளைக்கிழங்கு', 'ഉരുളക്കിഴങ്ങ്', 'બટાકા', 'আলু', 'ਆਲੂ'],
  Rice: ['rice', 'paddy', 'nel', 'arisi', 'chawal', 'धान', 'चावल', 'బియ్యం', 'వరి', 'ಅಕ್ಕಿ', 'ಭತ್ತ', 'அரிசி', 'നെല്ല്', 'ચોખા', 'ধান', 'ਚੌਲ'],
  Wheat: ['wheat', 'gehu', 'गेहूं', 'గోధుమ', 'ಗೋಧಿ', 'கோதுமை', 'ഗോതമ്പ്', 'ઘઉં', 'গম', 'ਕਣਕ'],
  Chilli: ['chilli', 'chili', 'mirchi', 'மிளகாய்', 'మిరప', 'ಮೆಣಸಿನಕಾಯಿ', 'മുളക്', 'મરચાં', 'লঙ্কা', 'ਮਿਰਚ'],
  Turmeric: ['turmeric', 'haldi', 'மஞ்சள்', 'పసుపు', 'ಅರಿಶಿನ', 'മഞ്ഞൾ', 'હળદર', 'হলুদ', 'ਹਲਦੀ'],
  Coriander: ['coriander', 'dhania', 'kothamalli', 'கொத்தமல்லி', 'ధనియాలు', 'ಕೊತ್ತಂಬರಿ', 'മല്ലി', 'ધાણા', 'ধনে', 'ਧਨੀਆ'],
};

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function parseVoiceListing(text: string): ParsedVoiceListing {
  const lower = text.toLocaleLowerCase();
  const catalogNames = CROP_CATALOG.map((c) => c.name);
  let crop = catalogNames.find((name) => lower.includes(name.toLocaleLowerCase())) || 'Tomato';
  for (const [canonical, words] of Object.entries(aliases)) {
    if (words.some((word) => lower.includes(word.toLocaleLowerCase()))) {
      crop = canonical;
      break;
    }
  }

  const quantityPatterns = [
    /(\d[\d,]*(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|quintal|quintals|qtl|ton|tons|tonne|tonnes)/i,
    /(\d[\d,]*(?:\.\d+)?)\s*(கிலோ|கிலோகிராம்|குவிண்டால்|டன்|కిలో|క్వింటాల్|టన్ను|किलो|क्विंटल|टन|કિલો|ક્વિન્ટલ|ટન)/i,
  ];
  let quantity_kg = 1000;
  const q = quantityPatterns.map((p) => lower.match(p)).find(Boolean);
  if (q) {
    const n = Number(q[1].replace(/,/g, ''));
    const unit = q[2].toLocaleLowerCase();
    if (unit.includes('quintal') || unit.includes('qtl') || unit.includes('குவிண்டால்') || unit.includes('క్వింటాల్') || unit.includes('क्विंटल') || unit.includes('ક્વિન્ટલ')) quantity_kg = n * 100;
    else if (unit.includes('ton') || unit.includes('டன்') || unit.includes('టన్ను') || unit.includes('टन') || unit.includes('ટન')) quantity_kg = n * 1000;
    else quantity_kg = n;
  } else {
    const bare = lower.match(/\b(\d[\d,]*(?:\.\d+)?)\b/);
    if (bare) quantity_kg = Number(bare[1].replace(/,/g, ''));
  }

  let quality = 'Grade A';
  if (/grade\s*b|b\s*grade|second|தரம்\s*b|ग्रेड\s*b|ग्रेड बी|గ్రేడ్\s*b/i.test(lower)) quality = 'Grade B';
  if (/grade\s*c|c\s*grade|third|தரம்\s*c|ग्रेड\s*c|గ్రేడ్\s*c/i.test(lower)) quality = 'Grade C';

  let ready_date = today(1);
  if (/today|இன்று|இன்னிக்கு|आज|आज ही|ఈరోజు|ಇಂದು|ഇന്ന്|આજે|আজ|ਅੱਜ/i.test(lower)) ready_date = today(0);
  else if (/day after tomorrow|2 days|நாளை மறுநாள்|परसों|ఎల్లుండి|ನಾಡಿದ್ದು|മറ്റന്നാൾ|પરમદિવસ|পরশু|ਪਰਸੋਂ/i.test(lower)) ready_date = today(2);

  let expected_price_per_kg = 24;
  const price = lower.match(/(?:price|rate|rupees|rs|₹|விலை|விலை\s*₹|कीमत|ధర|ಬೆಲೆ|വില|કિંમત|দাম|ਕੀਮਤ)\s*[:=]?\s*₹?\s*(\d+(?:\.\d+)?)/i)
    || lower.match(/₹?\s*(\d+(?:\.\d+)?)\s*(?:per\s*kg|\/kg|rs|rupees|ரூபாய்|रुपये|రూపాయలు|ರೂಪಾಯಿ|രൂപ|રૂપિયા|টাকা|ਰੁਪਏ)/i);
  if (price) expected_price_per_kg = Number(price[1]);

  return { crop, quantity_kg, quality, ready_date, expected_price_per_kg };
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}
