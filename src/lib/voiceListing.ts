import { CROP_CATALOG } from '@/lib/cropCatalog';

export interface ParsedVoiceListing {
  crop: string;
  quantity_kg: number;
  quality: string;
  ready_date: string;
  expected_price_per_kg: number;
}

// Multilingual aliases for the daily marketplace catalogue. The catalogue aliases
// are also included automatically, so newly added crops remain voice-addressable.
const aliases: Record<string, string[]> = {
  Tomato: ['tomato','thakkali','tamatar','टमाटर','టమాటా','ಟೊಮೇಟೊ','தக்காளி','തക്കാളി','ટમેટા','টমেটো','ਟਮਾਟਰ'],
  Onion: ['onion','vengayam','pyaz','प्याज','ఉల్లిపాయ','ಈರುಳ್ಳಿ','வெங்காயம்','സവാള','ડુંગળી','পেঁয়াজ','ਪਿਆਜ਼'],
  Potato: ['potato','urulaikilangu','aloo','आलू','బంగాళాదుంప','ಆಲೂಗಡ್ಡೆ','உருளைக்கிழங்கு','ഉരുളക്കിഴങ്ങ്','બટાકા','আলু','ਆਲੂ'],
  Brinjal: ['brinjal','kathirikkai','baingan','बैंगन','వంకాయ','ಬದನೆಕಾಯಿ','கத்திரிக்காய்','വഴുതന','રીંગણ','বেগুন','ਬੈਂਗਣ'],
  Okra: ['okra','vendakkai','bhindi','भिंडी','బెండకాయ','ಬೆಂಡೆಕಾಯಿ','வெண்டைக்காய்','വെണ്ടയ്ക്ക','ભીંડા','ঢেঁড়স','ਭਿੰਡੀ'],
  Cabbage: ['cabbage','muttai kosu','patta gobhi','पत्तागोभी','క్యాబేజీ','ಎಲೆಕೋಸು','முட்டைக்கோஸ்','കാബേജ്','કોબી','বাঁধাকপি','ਗੋਭੀ'],
  Cauliflower: ['cauliflower','phool gobhi','फूलगोभी','కాలీఫ్లవర్','ಹೂಕೋಸು','காலிஃபிளவர்','കോളിഫ്ലവർ','ફૂલકોબી','ফুলকপি','ਫੁੱਲ ਗੋਭੀ'],
  Carrot: ['carrot','gajar','गाजर','క్యారెట్','ಕ್ಯಾರೆಟ್','கேரட்','കാരറ്റ്','ગાજર','গাজর','ਗਾਜਰ'],
  Beans: ['beans','sem','सेम','బీన్స్','ಬೀನ್ಸ್','பீன்ஸ்','ബീൻസ്','ફણસી','শিম','ਫਲੀਆਂ'],
  'Green Chilli': ['green chilli','pachai milagai','hari mirch','हरी मिर्च','పచ్చిమిర్చి','ಹಸಿಮೆಣಸಿನಕಾಯಿ','பச்சை மிளகாய்','പച്ചമുളക്','લીલા મરચાં','কাঁচা লঙ্কা','ਹਰੀ ਮਿਰਚ'],
  'Rice / Paddy': ['rice','paddy','nel','arisi','chawal','dhan','धान','चावल','బియ్యం','వరి','ಅಕ್ಕಿ','ಭತ್ತ','அரிசி','നെല്ല്','ચોખા','ধান','ਚੌਲ'],
  Wheat: ['wheat','godhumai','gehun','गेहूं','గోధుమ','ಗೋಧಿ','கோதுமை','ഗോതമ്പ്','ઘઉં','গম','ਕਣਕ'],
  Maize: ['maize','cholam','makka','corn','मक्का','ज्वार','మొక్కజొన్న','ಮೆಕ್ಕೆಜೋಳ','சோளம்','ചോളം','મકાઈ','ভুট্টা','ਮੱਕੀ'],
  Ragi: ['ragi','kezhvaragu','nachni','रागी','नाचणी','రాగి','ರಾಗಿ','கேழ்வரகு','റാഗി','નાચણી','রাগি','ਰਾਗੀ'],
  'Pearl Millet': ['pearl millet','millet','kambu','bajra','बाजरा','बाजरी','సజ్జలు','ಸಜ್ಜೆ','கம்பு','കമ്പ്','બાજરી','বাজরা','ਬਾਜਰਾ'],
  'Tur / Pigeon Pea': ['tur dal','tur','pigeon pea','thuvaram paruppu','arhar','तूर','अरहर','కందిపప్పు','ತೊಗರಿಬೇಳೆ','துவரம் பருப்பு','തുവരപ്പരിപ്പ്','તુવેર દાળ','তুর ডাল','ਤੂਰ ਦਾਲ'],
  Chickpea: ['chickpea','kondakadalai','chana','चना','சுண்டல்','సెనగ','ಕಡಲೆ','കടല','ચણા','ছোলা','ਛੋਲੇ'],
  'Black Pepper': ['black pepper','milagu','kali mirch','काली मिर्च','మిరియాలు','ಕರಿಮೆಣಸು','மிளகு','കുരുമുളക്','કાળા મરી','গোলমরিচ','ਕਾਲੀ ਮਿਰਚ'],
  Turmeric: ['turmeric','manjal','haldi','மஞ்சள்','हल्दी','పసుపు','ಅರಿಶಿನ','മഞ്ഞൾ','હળદર','হলুদ','ਹਲਦੀ'],
  Cumin: ['cumin','seeragam','jeera','जीरा','జీలకర్ర','ಜೀರಿಗೆ','சீரகம்','ജീരകം','જીરું','জিরা','ਜੀਰਾ'],
  'Coriander Seed': ['coriander','coriander seed','malli','dhania','धनिया','ధనియాలు','ಕೊತ್ತಂಬರಿ','கொத்தமல்லி','മല്ലി','ધાણા','ধনে','ਧਨੀਆ'],
  Cardamom: ['cardamom','elakkai','elaichi','इलायची','ఏలకులు','ಏಲಕ್ಕಿ','ஏலக்காய்','ഏലക്ക','એલચી','এলাচ','ਇਲਾਇਚੀ'],
  Clove: ['clove','lavangam','laung','लौंग','లవంగం','ಲವಂಗ','கிராம்பு','ഗ്രാമ്പൂ','લવિંગ','লবঙ্গ','ਲੌਂਗ'],
  'Dry Chilli': ['dry chilli','milagai','sukhi mirch','सूखी मिर्च','ఎండు మిరప','ಒಣ ಮೆಣಸಿನಕಾಯಿ','காய்ந்த மிளகாய்','ഉണക്കമുളക്','સૂકા મરચાં','শুকনো লঙ্কা','ਸੁੱਕੀ ਮਿਰਚ'],
};

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function parseVoiceListing(text: string): ParsedVoiceListing {
  const lower = text.toLocaleLowerCase();
  let crop = CROP_CATALOG[0]?.name || 'Tomato';

  // First use explicit multilingual aliases, then the canonical catalogue names and aliases.
  for (const [canonical, words] of Object.entries(aliases)) {
    if (words.some((word) => lower.includes(word.toLocaleLowerCase()))) {
      crop = canonical;
      break;
    }
  }
  if (crop === CROP_CATALOG[0]?.name) {
    for (const item of CROP_CATALOG) {
      if ([item.name, ...item.aliases].some((word) => lower.includes(word.toLocaleLowerCase()))) {
        crop = item.name;
        break;
      }
    }
  }

  const quantityPatterns = [
    /(\d[\d,]*(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|quintal|quintals|qtl|ton|tons|tonne|tonnes)/i,
    /(\d[\d,]*(?:\.\d+)?)\s*(கிலோ|கிலோகிராம்|குவிண்டால்|டன்|కిలో|క్వింటాల్|టన్ను|किलो|क्विंटल|टन|કિલો|ક્વિન્ટલ|ટન|କିଲୋ|କ୍ୱିଣ୍ଟାଲ|ଟନ|কিলো|কুইন্টাল|টন)/i,
  ];
  let quantity_kg = 1000;
  const q = quantityPatterns.map((p) => lower.match(p)).find(Boolean);
  if (q) {
    const n = Number(q[1].replace(/,/g, ''));
    const unit = q[2].toLocaleLowerCase();
    if (unit.includes('quintal') || unit.includes('qtl') || /குவிண்டால்|క్వింటాల్|क्विंटल|ક્વિન્ટલ|କ୍ୱିଣ୍ଟାଲ|কুইন্টাল/.test(unit)) quantity_kg = n * 100;
    else if (unit.includes('ton') || /டன்|టన్ను|टन|ટન|ଟନ|টন/.test(unit)) quantity_kg = n * 1000;
    else quantity_kg = n;
  } else {
    const bare = lower.match(/\b(\d[\d,]*(?:\.\d+)?)\b/);
    if (bare) quantity_kg = Number(bare[1].replace(/,/g, ''));
  }

  let quality = 'Grade A';
  if (/grade\s*b|b\s*grade|second|தரம்\s*b|ग्रेड\s*b|ग्रेड बी|గ్రేడ్\s*b|தரம்\s*பி/i.test(lower)) quality = 'Grade B';
  if (/grade\s*c|c\s*grade|third|தரம்\s*c|ग्रेड\s*c|గ్రేడ్\s*c|தரம்\s*சி/i.test(lower)) quality = 'Grade C';

  let ready_date = today(1);
  if (/today|இன்று|இன்னிக்கு|आज|आज ही|ఈరోజు|ಇಂದು|ഇന്ന്|આજે|আজ|ਅੱਜ|ଆଜି/i.test(lower)) ready_date = today(0);
  else if (/day after tomorrow|2 days|நாளை மறுநாள்|परसों|ఎల్లుండి|ನಾಡಿದ್ದು|മറ്റന്നാൾ|પરમદિવસ|পরশু|ਪਰਸੋਂ|ପରଦିନ/.test(lower)) ready_date = today(2);

  let expected_price_per_kg = 24;
  const price = lower.match(/(?:price|rate|rupees|rs|₹|விலை|कीमत|ధర|ಬೆಲೆ|വില|કિંમત|দাম|ਕੀਮਤ|ମୂଲ୍ୟ|দর)\s*[:=]?\s*₹?\s*(\d+(?:\.\d+)?)/i)
    || lower.match(/₹?\s*(\d+(?:\.\d+)?)\s*(?:per\s*kg|\/kg|rs|rupees|ரூபாய்|रुपये|రూపాయలు|ರೂಪಾಯಿ|രൂപ|રૂપિયા|টাকা|ਰੁਪਏ|ରୁପିଆ)/i);
  if (price) expected_price_per_kg = Number(price[1]);

  return { crop, quantity_kg, quality, ready_date, expected_price_per_kg };
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}
