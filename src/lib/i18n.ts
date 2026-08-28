export type LanguageCode =
  | 'en-IN' | 'hi-IN' | 'bn-IN' | 'te-IN' | 'mr-IN' | 'ta-IN' | 'gu-IN'
  | 'kn-IN' | 'ml-IN' | 'pa-IN' | 'or-IN' | 'as-IN' | 'ur-IN' | 'mai-IN'
  | 'sat-IN' | 'ks-IN' | 'ne-IN' | 'kok-IN' | 'sd-IN' | 'doi-IN' | 'mni-IN' | 'br-IN';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  speechCode: string;
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  { code: 'en-IN', name: 'English', nativeName: 'English', speechCode: 'en-IN' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
  { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', speechCode: 'or-IN' },
  { code: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া', speechCode: 'as-IN' },
  { code: 'ur-IN', name: 'Urdu', nativeName: 'اردو', speechCode: 'ur-IN' },
  { code: 'mai-IN', name: 'Maithili', nativeName: 'मैथिली', speechCode: 'hi-IN' },
  { code: 'sat-IN', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', speechCode: 'hi-IN' },
  { code: 'ks-IN', name: 'Kashmiri', nativeName: 'कॉशुर', speechCode: 'hi-IN' },
  { code: 'ne-IN', name: 'Nepali', nativeName: 'नेपाली', speechCode: 'ne-NP' },
  { code: 'kok-IN', name: 'Konkani', nativeName: 'कोंकणी', speechCode: 'kok-IN' },
  { code: 'sd-IN', name: 'Sindhi', nativeName: 'सिन्धी', speechCode: 'hi-IN' },
  { code: 'doi-IN', name: 'Dogri', nativeName: 'डोगरी', speechCode: 'hi-IN' },
  { code: 'mni-IN', name: 'Meitei', nativeName: 'মৈতৈলোন্', speechCode: 'hi-IN' },
  { code: 'br-IN', name: 'Bodo', nativeName: 'बड़ो', speechCode: 'hi-IN' },
];

export const translations: Record<string, Record<string, string>> = {
  'en-IN': {
    dashboard: 'Dashboard', farmer: 'Farmer', fpo: 'FPO', buyer: 'Buyer', logistics: 'Logistics',
    matching: 'Smart Matching', priceAI: 'Price AI', listProduce: 'List Your Produce',
    addLot: 'Add New Lot', marketplace: 'Marketplace', demand: 'Post Demand',
    wallet: 'Wallet', transparent: 'Transparent settlement', speak: 'Speak to list',
  },
  'hi-IN': { dashboard: 'डैशबोर्ड', farmer: 'किसान', fpo: 'एफपीओ', buyer: 'खरीदार', logistics: 'लॉजिस्टिक्स', matching: 'स्मार्ट मिलान', priceAI: 'मूल्य AI', listProduce: 'अपनी उपज सूचीबद्ध करें', addLot: 'नई खेप जोड़ें', marketplace: 'बाज़ार', demand: 'मांग पोस्ट करें', wallet: 'वॉलेट', transparent: 'पारदर्शी भुगतान', speak: 'बोलकर सूची बनाएं' },
  'ta-IN': { dashboard: 'முகப்பு', farmer: 'விவசாயி', fpo: 'FPO', buyer: 'வாங்குபவர்', logistics: 'போக்குவரத்து', matching: 'ஸ்மார்ட் பொருத்தம்', priceAI: 'விலை AI', listProduce: 'உங்கள் விளைபொருளை பதிவு செய்யுங்கள்', addLot: 'புதிய தொகுதி', marketplace: 'சந்தை', demand: 'தேவையை பதிவு செய்', wallet: 'பணப்பை', transparent: 'வெளிப்படையான settlement', speak: 'பேசி பதிவு செய்யுங்கள்' },
  'te-IN': { dashboard: 'డాష్‌బోర్డ్', farmer: 'రైతు', fpo: 'FPO', buyer: 'కొనుగోలుదారు', logistics: 'లాజిస్టిక్స్', matching: 'స్మార్ట్ మ్యాచ్', priceAI: 'ధర AI', listProduce: 'మీ పంటను జాబితా చేయండి', addLot: 'కొత్త లాట్', marketplace: 'మార్కెట్', demand: 'డిమాండ్ పోస్ట్ చేయండి', wallet: 'వాలెట్', transparent: 'పారదర్శక చెల్లింపు', speak: 'మాట్లాడి జాబితా చేయండి' },
  'kn-IN': { dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', farmer: 'ರೈತ', fpo: 'FPO', buyer: 'ಖರೀದಿದಾರ', logistics: 'ಲಾಜಿಸ್ಟಿಕ್ಸ್', matching: 'ಸ್ಮಾರ್ಟ್ ಹೊಂದಾಣಿಕೆ', priceAI: 'ಬೆಲೆ AI', listProduce: 'ನಿಮ್ಮ ಉತ್ಪನ್ನ ಪಟ್ಟಿ ಮಾಡಿ', addLot: 'ಹೊಸ ಲಾಟ್', marketplace: 'ಮಾರುಕಟ್ಟೆ', demand: 'ಬೇಡಿಕೆ ಪೋಸ್ಟ್ ಮಾಡಿ', wallet: 'ವಾಲೆಟ್', transparent: 'ಪಾರದರ್ಶಕ ಪಾವತಿ', speak: 'ಮಾತನಾಡಿ ಪಟ್ಟಿ ಮಾಡಿ' },
  'ml-IN': { dashboard: 'ഡാഷ്ബോർഡ്', farmer: 'കർഷകൻ', fpo: 'FPO', buyer: 'വാങ്ങുന്നയാൾ', logistics: 'ലോജിസ്റ്റിക്സ്', matching: 'സ്മാർട്ട് പൊരുത്തം', priceAI: 'വില AI', listProduce: 'നിങ്ങളുടെ ഉൽപ്പന്നം ലിസ്റ്റ് ചെയ്യുക', addLot: 'പുതിയ ലോട്ട്', marketplace: 'വിപണി', demand: 'ആവശ്യം പോസ്റ്റ് ചെയ്യുക', wallet: 'വാലറ്റ്', transparent: 'സുതാര്യമായ പേയ്മെന്റ്', speak: 'സംസാരിച്ച് ലിസ്റ്റ് ചെയ്യുക' },
  'mr-IN': { dashboard: 'डॅशबोर्ड', farmer: 'शेतकरी', fpo: 'FPO', buyer: 'खरेदीदार', logistics: 'लॉजिस्टिक्स', matching: 'स्मार्ट जुळणी', priceAI: 'किंमत AI', listProduce: 'तुमचे उत्पादन नोंदवा', addLot: 'नवीन लॉट', marketplace: 'बाजार', demand: 'मागणी पोस्ट करा', wallet: 'वॉलेट', transparent: 'पारदर्शक पेमेंट', speak: 'बोलून नोंदवा' },
  'bn-IN': { dashboard: 'ড্যাশবোর্ড', farmer: 'কৃষক', fpo: 'FPO', buyer: 'ক্রেতা', logistics: 'লজিস্টিক্স', matching: 'স্মার্ট ম্যাচিং', priceAI: 'মূল্য AI', listProduce: 'আপনার ফসল তালিকাভুক্ত করুন', addLot: 'নতুন লট', marketplace: 'বাজার', demand: 'চাহিদা পোস্ট করুন', wallet: 'ওয়ালেট', transparent: 'স্বচ্ছ পেমেন্ট', speak: 'কথা বলে তালিকাভুক্ত করুন' },
  'gu-IN': { dashboard: 'ડેશબોર્ડ', farmer: 'ખેડૂત', fpo: 'FPO', buyer: 'ખરીદદાર', logistics: 'લોજિસ્ટિક્સ', matching: 'સ્માર્ટ મેચિંગ', priceAI: 'કિંમત AI', listProduce: 'તમારી ઉપજ લિસ્ટ કરો', addLot: 'નવો લોટ', marketplace: 'બજાર', demand: 'માંગ પોસ્ટ કરો', wallet: 'વૉલેટ', transparent: 'પારદર્શક ચુકવણી', speak: 'બોલીને લિસ્ટ કરો' },
  'pa-IN': { dashboard: 'ਡੈਸ਼ਬੋਰਡ', farmer: 'ਕਿਸਾਨ', fpo: 'FPO', buyer: 'ਖਰੀਦਦਾਰ', logistics: 'ਲੌਜਿਸਟਿਕਸ', matching: 'ਸਮਾਰਟ ਮੈਚਿੰਗ', priceAI: 'ਕੀਮਤ AI', listProduce: 'ਆਪਣੀ ਉਪਜ ਸੂਚੀਬੱਧ ਕਰੋ', addLot: 'ਨਵਾਂ ਲਾਟ', marketplace: 'ਬਾਜ਼ਾਰ', demand: 'ਮੰਗ ਪੋਸਟ ਕਰੋ', wallet: 'ਵਾਲਿਟ', transparent: 'ਪਾਰਦਰਸ਼ੀ ਭੁਗਤਾਨ', speak: 'ਬੋਲ ਕੇ ਸੂਚੀ ਬਣਾਓ' },
};

export function getLanguage(code: string): LanguageOption {
  return INDIAN_LANGUAGES.find((l) => l.code === code) ?? INDIAN_LANGUAGES[0];
}

export function t(code: string, key: string): string {
  return translations[code]?.[key] ?? translations['en-IN'][key] ?? key;
}
