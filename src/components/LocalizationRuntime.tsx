'use client';

import { useEffect } from 'react';
import { t, INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';

const KEY = 'agriconnect_language';
type LangShort = 'hi'|'bn'|'te'|'mr'|'ta'|'gu'|'kn'|'ml'|'pa'|'or'|'as'|'ur';
const COMMON: Record<string, Partial<Record<LangShort, string>>> = {
  Dashboard:{hi:'डैशबोर्ड',bn:'ড্যাশবোর্ড',te:'డాష్‌బోర్డ్',mr:'डॅशबोर्ड',ta:'முகப்பு',gu:'ડેશબોર્ડ',kn:'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',ml:'ഡാഷ്ബോർഡ്',pa:'ਡੈਸ਼ਬੋਰਡ',or:'ଡ୍ୟାସବୋର୍ଡ',as:'ড্যাশবোর্ড',ur:'ڈیش بورڈ'},
  Farmer:{hi:'किसान',bn:'কৃষক',te:'రైతు',mr:'शेतकरी',ta:'விவசாயி',gu:'ખેડૂત',kn:'ರೈತ',ml:'കർഷകൻ',pa:'ਕਿਸਾਨ',or:'ଚାଷୀ',as:'কৃষক',ur:'کسان'},
  FPO:{hi:'एफपीओ',bn:'এফপিও',te:'ఎఫ్‌పీఓ',mr:'एफपीओ',ta:'எஃப்பிஓ',gu:'એફપીઓ',kn:'ಎಫ್‌ಪಿಒ',ml:'എഫ്‌പിഒ',pa:'ਐਫਪੀਓ',or:'ଏଫପିଓ',as:'এফপিও',ur:'ایف پی او'},
  Buyer:{hi:'खरीदार',bn:'ক্রেতা',te:'కొనుగోలుదారు',mr:'खरेदीदार',ta:'வாங்குபவர்',gu:'ખરીદદાર',kn:'ಖರೀದಿದಾರ',ml:'വാങ്ങുന്നയാൾ',pa:'ਖਰੀਦਦਾਰ',or:'କ୍ରେତା',as:'ক্ৰেতা',ur:'خریدار'},
  Logistics:{hi:'लॉजिस्टिक्स',bn:'লজিস্টিকস',te:'రవాణా',mr:'लॉजिस्टिक्स',ta:'போக்குவரத்து',gu:'લોજિસ્ટિક્સ',kn:'ಲಾಜಿಸ್ಟಿಕ್ಸ್',ml:'ലോജിസ്റ്റിക്സ്',pa:'ਲੌਜਿਸਟਿਕਸ',or:'ପରିବହନ',as:'লজিষ্টিক্স',ur:'لاجسٹکس'},
  'Smart Matching':{hi:'स्मार्ट मिलान',bn:'স্মার্ট ম্যাচিং',te:'స్మార్ట్ మ్యాచింగ్',mr:'स्मार्ट जुळणी',ta:'ஸ்மார்ட் மேட்சிங்',gu:'સ્માર્ટ મેચિંગ',kn:'ಸ್ಮಾರ್ಟ್ ಮ್ಯಾಚಿಂಗ್',ml:'സ്മാർട്ട് മാച്ചിംഗ്',pa:'ਸਮਾਰਟ ਮੈਚਿੰਗ',or:'ସ୍ମାର୍ଟ ମ୍ୟାଚିଂ',as:'স্মাৰ্ট মেচিং',ur:'اسمارٹ میچنگ'},
  'Price AI':{hi:'कीमत AI',bn:'মূল্য AI',te:'ధర AI',mr:'किंमत AI',ta:'விலை AI',gu:'કિંમત AI',kn:'ಬೆಲೆ AI',ml:'വില AI',pa:'ਕੀਮਤ AI',or:'ମୂଲ୍ୟ AI',as:'মূল্য AI',ur:'قیمت AI'},
  Marketplace:{hi:'बाज़ार',bn:'বাজার',te:'మార్కెట్',mr:'बाजार',ta:'சந்தை',gu:'બજાર',kn:'ಮಾರುಕಟ್ಟೆ',ml:'വിപണി',pa:'ਬਾਜ਼ਾਰ',or:'ବଜାର',as:'বজাৰ',ur:'بازار'},
  Demand:{hi:'मांग',bn:'চাহিদা',te:'డిమాండ్',mr:'मागणी',ta:'தேவை',gu:'માંગ',kn:'ಬೇಡಿಕೆ',ml:'ആവശ്യം',pa:'ਮੰਗ',or:'ଚାହିଦା',as:'চাহিদা',ur:'طلب'},
  Wallet:{hi:'वॉलेट',bn:'ওয়ালেট',te:'వాలెట్',mr:'वॉलेट',ta:'வாலெட்',gu:'વૉલેટ',kn:'ವಾಲೆಟ್',ml:'വാലറ്റ്',pa:'ਵਾਲਿਟ',or:'ୱାଲେଟ',as:'ৱালেট',ur:'والیٹ'},
  'My Produce':{hi:'मेरी उपज',bn:'আমার উৎপাদন',te:'నా పంట',mr:'माझी उपज',ta:'எனது விளைபொருள்',gu:'મારી ઉપજ',kn:'ನನ್ನ ಉತ್ಪನ್ನ',ml:'എന്റെ വിള',pa:'ਮੇਰੀ ਉਪਜ',or:'ମୋ ଉତ୍ପାଦ',as:'মোৰ উৎপাদন',ur:'میری پیداوار'},
  'My Earnings':{hi:'मेरी कमाई',bn:'আমার আয়',te:'నా ఆదాయం',mr:'माझी कमाई',ta:'எனது வருமானம்',gu:'મારી કમાણી',kn:'ನನ್ನ ಆದಾಯ',ml:'എന്റെ വരുമാനം',pa:'ਮੇਰੀ ਕਮਾਈ',or:'ମୋ ଆୟ',as:'মোৰ উপাৰ্জন',ur:'میری آمدني'},
  'Market Intelligence':{hi:'बाज़ार जानकारी',bn:'বাজার তথ্য',te:'మార్కెట్ సమాచారం',mr:'बाजार माहिती',ta:'சந்தை தகவல்',gu:'બજાર માહિતી',kn:'ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ',ml:'വിപണി വിവരങ്ങൾ',pa:'ਮਾਰਕੀਟ ਜਾਣਕਾਰੀ',or:'ବଜାର ସୂଚନା',as:'বজাৰ তথ্য',ur:'مارکیٹ معلومات'},
  'Add New Lot':{hi:'नई लॉट जोड़ें',bn:'নতুন লট যোগ করুন',te:'కొత్త లాట్ జోడించండి',mr:'नवीन लॉट जोडा',ta:'புதிய லாட் சேர்க்கவும்',gu:'નવી લોટ ઉમેરો',kn:'ಹೊಸ ಲಾಟ್ ಸೇರಿಸಿ',ml:'പുതിയ ലോട്ട് ചേർക്കുക',pa:'ਨਵਾਂ ਲਾਟ ਸ਼ਾਮਲ ਕਰੋ',or:'ନୂଆ ଲଟ୍ ଯୋଡନ୍ତୁ',as:'নতুন লট যোগ কৰক',ur:'نیا لاٹ شامل کریں'},
  'Speak to list':{hi:'बोलकर सूची बनाएं',bn:'কথা বলে তালিকাভুক্ত করুন',te:'మాట్లాడి జాబితా చేయండి',mr:'बोलून नोंदवा',ta:'பேசி பதிவு செய்யுங்கள்',gu:'બોલીને લિસ્ટ કરો',kn:'ಮಾತನಾಡಿ ಪಟ್ಟಿ ಮಾಡಿ',ml:'സംസാരിച്ച് ലിസ്റ്റ് ചെയ്യുക',pa:'ਬੋਲ ਕੇ ਸੂਚੀ ਬਣਾਓ',or:'କଥା କହି ତାଲିକା କରନ୍ତୁ',as:'কথা কৈ তালিকাভুক্ত কৰক',ur:'بول کر فہرست بنائیں'},
  'Transparent settlement':{hi:'पारदर्शी भुगतान',bn:'স্বচ্ছ নিষ্পত্তি',te:'పారదర్శక చెల్లింపు',mr:'पारदर्शक सेटलमेंट',ta:'வெளிப்படையான பணப்பரிவர்த்தனை',gu:'પારદર્શક ચુકવણી',kn:'ಪಾರದರ್ಶಕ ಪಾವತಿ',ml:'സുതാര്യമായ തീർപ്പാക്കൽ',pa:'ਪਾਰਦਰਸ਼ੀ ਭੁਗਤਾਨ',or:'ସ୍ୱଚ୍ଛ ଦେୟ',as:'স্বচ্ছ পৰিশোধ',ur:'شفاف ادائیگی'},
  'Quality Check':{hi:'गुणवत्ता जांच',bn:'মান যাচাই',te:'నాణ్యత తనిఖీ',mr:'गुणवत्ता तपासणी',ta:'தரச் சோதனை',gu:'ગુણવત્તા ચકાસણી',kn:'ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ',ml:'ഗുണനിലവാര പരിശോധന',pa:'ਗੁਣਵੱਤਾ ਜਾਂਚ',or:'ଗୁଣବତ୍ତା ଯାଞ୍ଚ',as:'গুণমান পৰীক্ষা',ur:'معیار کی جانچ'},
  Aggregation:{hi:'एकत्रीकरण',bn:'একত্রিকরণ',te:'సమీకరణ',mr:'एकत्रीकरण',ta:'திரட்டல்',gu:'એકત્રીકરણ',kn:'ಒಗ್ಗೂಡಿಸುವಿಕೆ',ml:'ശേഖരണം',pa:'ਇਕੱਠ',or:'ଏକତ୍ରୀକରଣ',as:'একত্ৰীকৰণ',ur:'مجموعہ'},
  Payments:{hi:'भुगतान',bn:'পেমেন্ট',te:'చెల్లింపులు',mr:'देयके',ta:'பணம் செலுத்துதல்',gu:'ચુકવણીઓ',kn:'ಪಾವತಿಗಳು',ml:'പേയ്മെന്റുകൾ',pa:'ਭੁਗਤਾਨ',or:'ଦେୟ',as:'পেমেন্ট',ur:'ادائیاں'},
  Reports:{hi:'रिपोर्ट',bn:'রিপোর্ট',te:'నివేదికలు',mr:'अहवाल',ta:'அறிக்கைகள்',gu:'રિપોર્ટ્સ',kn:'ವರದಿಗಳು',ml:'റിപ്പോർട്ടുകൾ',pa:'ਰਿਪੋਰਟਾਂ',or:'ରିପୋର୍ଟ',as:'ৰিপৰ্ট',ur:'رپورٹس'},
  Settings:{hi:'सेटिंग्स',bn:'সেটিংস',te:'సెట్టింగ్‌లు',mr:'सेटिंग्ज',ta:'அமைப்புகள்',gu:'સેટિંગ્સ',kn:'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',ml:'ക്രമീകരണങ്ങൾ',pa:'ਸੈਟਿੰਗਾਂ',or:'ସେଟିଂସ୍',as:'ছেটিংছ',ur:'ترتيبات'},
  Orders:{hi:'ऑर्डर',bn:'অর্ডার',te:'ఆర్డర్లు',mr:'ऑर्डर्स',ta:'ஆர்டர்கள்',gu:'ઓર્ડર્સ',kn:'ಆರ್ಡರ್‌ಗಳು',ml:'ഓർഡറുകൾ',pa:'ਆਰਡਰ',or:'ଅର୍ଡର',as:'অৰ্ডাৰ',ur:'آرڈرز'},
  'Create Demand':{hi:'मांग बनाएं',bn:'চাহিদা তৈরি করুন',te:'డిమాండ్ సృష్టించండి',mr:'मागणी तयार करा',ta:'தேவை உருவாக்கவும்',gu:'માંગ બનાવો',kn:'ಬೇಡಿಕೆ ರಚಿಸಿ',ml:'ഡിമാൻഡ് സൃഷ്ടിക്കുക',pa:'ਮੰਗ ਬਣਾਓ',or:'ଚାହିଦା ସୃଷ୍ଟି କରନ୍ତୁ',as:'চাহিদা সৃষ্টি কৰক',ur:'طلب بنائیں'},
  'View All':{hi:'सभी देखें',bn:'সব দেখুন',te:'అన్నీ చూడండి',mr:'सर्व पहा',ta:'அனைத்தையும் பார்க்கவும்',gu:'બધું જુઓ',kn:'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',ml:'എല്ലാം കാണുക',pa:'ਸਭ ਵੇਖੋ',or:'ସବୁ ଦେଖନ୍ତୁ',as:'সকলো চাওক',ur:'سب دیکھیں'},
  'View Details':{hi:'विवरण देखें',bn:'বিস্তারিত দেখুন',te:'వివరాలు చూడండి',mr:'तपशील पहा',ta:'விவரங்களைப் பார்க்கவும்',gu:'વિગતો જુઓ',kn:'ವಿವರಗಳನ್ನು ನೋಡಿ',ml:'വിശദാംശങ്ങൾ കാണുക',pa:'ਵੇਰਵੇ ਵੇਖੋ',or:'ବିବରଣୀ ଦେଖନ୍ତୁ',as:'বিৱৰণ চাওক',ur:'تفصیلات دیکھیں'},
  'Confirm listing':{hi:'लिस्टिंग की पुष्टि करें',bn:'তালিকা নিশ্চিত করুন',te:'జాబితాను నిర్ధారించండి',mr:'नोंदणीची पुष्टी करा',ta:'பதிவை உறுதிப்படுத்துங்கள்',gu:'લિસ્ટિંગની પુષ્ટિ કરો',kn:'ಪಟ್ಟಿಯನ್ನು ದೃಢೀಕರಿಸಿ',ml:'ലിസ്റ്റിംഗ് സ്ഥിരീകരിക്കുക',pa:'ਸੂਚੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',or:'ତାଲିକା ନିଶ୍ଚିତ କରନ୍ତୁ',as:'তালিকা নিশ্চিত কৰক',ur:'فہرست کی تصدیق کریں'},
  Edit:{hi:'संपादित करें',bn:'সম্পাদনা করুন',te:'సవరించండి',mr:'संपादित करा',ta:'திருத்தவும்',gu:'ફેરફાર કરો',kn:'ತಿದ್ದುಪಡಿ ಮಾಡಿ',ml:'തിരുത്തുക',pa:'ਸੋਧੋ',or:'ସମ୍ପାଦନା କରନ୍ତୁ',as:'সম্পাদনা কৰক',ur:'ترمیم کریں'},
  'Good Morning':{hi:'सुप्रभात',bn:'সুপ্রভাত',te:'శుభోదయం',mr:'शुभ सकाळ',ta:'காலை வணக்கம்',gu:'સુપ્રભાત',kn:'ಶುಭೋದಯ',ml:'സുപ്രഭാതം',pa:'ਸ਼ੁਭ ਸਵੇਰ',or:'ସୁପ୍ରଭାତ',as:'সুপ্ৰভাত',ur:'صبح بخیر'},
  Home:{hi:'होम',bn:'হোম',te:'హోమ్',mr:'होम',ta:'முகப்பு',gu:'હોમ',kn:'ಮುಖಪುಟ',ml:'ഹോം',pa:'ਹੋਮ',or:'ହୋମ',as:'হোম',ur:'ہوم'},
  'TAP TO SPEAK':{hi:'बोलने के लिए दबाएं',bn:'কথা বলতে চাপুন',te:'మాట్లాడటానికి నొక్కండి',mr:'बोलण्यासाठी दाबा',ta:'பேச அழுத்தவும்',gu:'બોલવા માટે દબાવો',kn:'ಮಾತನಾಡಲು ಒತ್ತಿರಿ',ml:'സംസാരിക്കാൻ അമർത്തുക',pa:'ਬੋਲਣ ਲਈ ਦਬਾਓ',or:'କହିବାକୁ ଦବାନ୍ତୁ',as:'ক’বলৈ টিপক',ur:'بولنے کے لیے دبائیں'},
  'ENTER MANUALLY':{hi:'मैन्युअल दर्ज करें',bn:'ম্যানুয়ালি লিখুন',te:'మాన్యువల్‌గా నమోదు చేయండి',mr:'हाताने नोंदवा',ta:'கைமுறையாக உள்ளிடவும்',gu:'મેન્યુઅલી દાખલ કરો',kn:'ಹಸ್ತಚಾಲಿತವಾಗಿ ನಮೂದಿಸಿ',ml:'മാനുവലായി നൽകുക',pa:'ਹੱਥੀਂ ਦਰਜ ਕਰੋ',or:'ହାତରେ ଦିଅନ୍ତୁ',as:'হাতে লিখক',ur:'دستی درج کریں'},
  Today:{hi:'आज',bn:'আজ',te:'ఈరోజు',mr:'आज',ta:'இன்று',gu:'આજે',kn:'ಇಂದು',ml:'ഇന്ന്',pa:'ਅੱਜ',or:'ଆଜି',as:'আজি',ur:'آج'},
  Tomorrow:{hi:'कल',bn:'আগামীকাল',te:'రేపు',mr:'उद्या',ta:'நாளை',gu:'આવતીકાલે',kn:'ನಾಳೆ',ml:'നാളെ',pa:'ਕੱਲ੍ਹ',or:'ଆସନ୍ତାକାଲି',as:'কাইলৈ',ur:'کل'},
  Pending:{hi:'लंबित',bn:'অপেক্ষমাণ',te:'పెండింగ్',mr:'प्रलंबित',ta:'நிலுவை',gu:'બાકી',kn:'ಬಾಕಿ',ml:'തീർപ്പാക്കാത്തത്',pa:'ਬਕਾਇਆ',or:'ବକେୟା',as:'বাকী',ur:'زیر التوا'},
  Matched:{hi:'मिलान हुआ',bn:'ম্যাচ হয়েছে',te:'మ్యాచ్ అయింది',mr:'जुळले',ta:'பொருத்தம்',gu:'મેચ થયું',kn:'ಹೊಂದಿಕೆಯಾಗಿದೆ',ml:'പൊരുത്തപ്പെട്ടു',pa:'ਮੈਚ ਹੋਇਆ',or:'ମେଳ ହୋଇଛି',as:'মিল হৈছে',ur:'میچ ہوا'},
  Verified:{hi:'सत्यापित',bn:'যাচাইকৃত',te:'ధృవీకరించబడింది',mr:'सत्यापित',ta:'சரிபார்க்கப்பட்டது',gu:'ચકાસાયેલ',kn:'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',ml:'പരിശോധിച്ചു',pa:'ਪੜਤਾਲ ਕੀਤੀ',or:'ଯାଞ୍ଚିତ',as:'যাচাইকৃত',ur:'تصدیق شدہ'}
};

function shortCode(code: LanguageCode): LangShort | null { const value = code.split('-')[0] as LangShort; return (['hi','bn','te','mr','ta','gu','kn','ml','pa','or','as','ur'] as string[]).includes(value) ? value : null; }

function translateNode(node: Text, language: LanguageCode) {
  const original = node.nodeValue || ''; if (!original.trim()) return;
  let next = original; const short = shortCode(language);
  for (const [english, map] of Object.entries(COMMON)) { const translated = short ? map[short] : undefined; if (translated && next.includes(english)) next = next.split(english).join(translated); }
  if (next === original) {
    const keys = ['dashboard','farmer','fpo','buyer','logistics','matching','priceAI','marketplace','demand','wallet','transparent','speak'];
    for (const key of keys) { const english = t('en-IN', key); const translated = t(language, key); if (translated && translated !== english && next.includes(english)) next = next.split(english).join(translated); }
  }
  if (next !== original) node.nodeValue = next;
}

function translatePage(language: LanguageCode) {
  if (language === 'en-IN') return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const nodes: Text[] = []; let current: Node | null = walker.nextNode();
  while (current) { const parent = current.parentElement; if (parent && !['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName) && !parent.closest('[data-no-translate="true"]')) nodes.push(current as Text); current = walker.nextNode(); }
  nodes.forEach((node) => translateNode(node, language));
}

function hydrateCropArtwork() {
  const categoryByCrop: Record<string, string> = {
    Tomato:'vegetables',Onion:'vegetables',Potato:'vegetables',Brinjal:'vegetables',Okra:'vegetables',Cabbage:'vegetables',Cauliflower:'vegetables',Carrot:'vegetables',Beans:'vegetables','Green Chilli':'vegetables',
    'Rice / Paddy':'rice',Rice:'rice',Wheat:'wheat',Maize:'grains',Ragi:'grains','Pearl Millet':'grains','Tur / Pigeon Pea':'grains',Chickpea:'grains',
    'Black Pepper':'spices',Turmeric:'spices',Cumin:'spices','Coriander Seed':'spices',Cardamom:'spices',Clove:'spices','Dry Chilli':'spices'
  };
  document.querySelectorAll<HTMLElement>('div.grid.h-12.w-12').forEach((art) => {
    if (art.dataset.cropArtwork === 'true') return;
    const card = art.parentElement; const name = card?.querySelector('.text-sm.font-black')?.textContent?.trim();
    if (!name) return;
    const category = categoryByCrop[name]; if (!category) return;
    art.dataset.cropArtwork = 'true'; art.textContent = ''; art.classList.remove('text-2xl');
    const img = document.createElement('img'); img.src = `/crops/${category}.svg`; img.alt = name; img.className = 'h-full w-full rounded-2xl object-cover'; art.appendChild(img);
  });
}

export default function LocalizationRuntime() {
  useEffect(() => {
    const apply = () => { const value = (localStorage.getItem(KEY) as LanguageCode | null) || 'en-IN'; if (!INDIAN_LANGUAGES.some((x) => x.code === value)) return; document.documentElement.lang = value; window.setTimeout(() => { translatePage(value); hydrateCropArtwork(); }, 0); };
    apply(); const onChange = () => apply(); window.addEventListener('agriconnect-language-change', onChange);
    let scheduled = false;
    const observer = new MutationObserver(() => { if (scheduled) return; scheduled = true; window.requestAnimationFrame(() => { scheduled = false; const value = (localStorage.getItem(KEY) as LanguageCode | null) || 'en-IN'; if (value !== 'en-IN') translatePage(value); hydrateCropArtwork(); }); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { window.removeEventListener('agriconnect-language-change', onChange); observer.disconnect(); };
  }, []);
  return null;
}
