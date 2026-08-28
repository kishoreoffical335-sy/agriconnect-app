export type LanguageCode =
  | 'en-IN' | 'hi-IN' | 'bn-IN' | 'te-IN' | 'mr-IN' | 'ta-IN' | 'gu-IN'
  | 'kn-IN' | 'ml-IN' | 'pa-IN' | 'or-IN' | 'as-IN' | 'ur-IN' | 'mai-IN'
  | 'sat-IN' | 'ks-IN' | 'ne-IN' | 'kok-IN' | 'sd-IN' | 'doi-IN' | 'mni-IN' | 'br-IN';

export interface LanguageOption { code: LanguageCode; name: string; nativeName: string; speechCode: string; }

export const INDIAN_LANGUAGES: LanguageOption[] = [
  ['en-IN','English','English','en-IN'],['hi-IN','Hindi','हिन्दी','hi-IN'],['bn-IN','Bengali','বাংলা','bn-IN'],['te-IN','Telugu','తెలుగు','te-IN'],['mr-IN','Marathi','मराठी','mr-IN'],['ta-IN','Tamil','தமிழ்','ta-IN'],['gu-IN','Gujarati','ગુજરાતી','gu-IN'],['kn-IN','Kannada','ಕನ್ನಡ','kn-IN'],['ml-IN','Malayalam','മലയാളം','ml-IN'],['pa-IN','Punjabi','ਪੰਜਾਬੀ','pa-IN'],['or-IN','Odia','ଓଡ଼ିଆ','or-IN'],['as-IN','Assamese','অসমীয়া','as-IN'],['ur-IN','Urdu','اردو','ur-IN'],['mai-IN','Maithili','मैथिली','hi-IN'],['sat-IN','Santali','ᱥᱟᱱᱛᱟᱲᱤ','hi-IN'],['ks-IN','Kashmiri','कॉशुर','hi-IN'],['ne-IN','Nepali','नेपाली','ne-NP'],['kok-IN','Konkani','कोंकणी','kok-IN'],['sd-IN','Sindhi','सिन्धी','hi-IN'],['doi-IN','Dogri','डोगरी','hi-IN'],['mni-IN','Meitei','মৈতৈলোন্','hi-IN'],['br-IN','Bodo','बड़ो','hi-IN']
].map(([code,name,nativeName,speechCode]) => ({code: code as LanguageCode,name,nativeName,speechCode}));

type Copy = Record<string,string>;
const core = (dashboard:string, farmer:string, buyer:string, market:string, speak:string, transparent:string): Copy => ({ dashboard, farmer, fpo:'FPO', buyer, logistics:'Logistics', matching:'Smart Matching', priceAI:'Price AI', listProduce:speak, addLot:'Add New Lot', marketplace:market, demand:'Post Demand', wallet:'Wallet', transparent, speak });
export const translations: Record<string, Copy> = {
  'en-IN': core('Dashboard','Farmer','Buyer','Marketplace','Speak to list','Transparent settlement'),
  'hi-IN': core('डैशबोर्ड','किसान','खरीदार','बाज़ार','बोलकर सूची बनाएं','पारदर्शी भुगतान'),
  'ta-IN': core('முகப்பு','விவசாயி','வாங்குபவர்','சந்தை','பேசி பதிவு செய்யுங்கள்','வெளிப்படையான பணப்பரிவர்த்தனை'),
  'te-IN': core('డాష్‌బోర్డ్','రైతు','కొనుగోలుదారు','మార్కెట్','మాట్లాడి జాబితా చేయండి','పారదర్శక చెల్లింపు'),
  'kn-IN': core('ಡ್ಯಾಶ್‌ಬೋರ್ಡ್','ರೈತ','ಖರೀದಿದಾರ','ಮಾರುಕಟ್ಟೆ','ಮಾತನಾಡಿ ಪಟ್ಟಿ ಮಾಡಿ','ಪಾರದರ್ಶಕ ಪಾವತಿ'),
  'ml-IN': core('ഡാഷ്ബോർഡ്','കർഷകൻ','വാങ്ങുന്നയാൾ','വിപണി','സംസാരിച്ച് ലിസ്റ്റ് ചെയ്യുക','സുതാര്യമായ പേയ്മെന്റ്'),
  'mr-IN': core('डॅशबोर्ड','शेतकरी','खरेदीदार','बाजार','बोलून नोंदवा','पारदर्शक पेमेंट'),
  'bn-IN': core('ড্যাশবোর্ড','কৃষক','ক্রেতা','বাজার','কথা বলে তালিকাভুক্ত করুন','স্বচ্ছ পেমেন্ট'),
  'gu-IN': core('ડેશબોર્ડ','ખેડૂત','ખરીદદાર','બજાર','બોલીને લિસ્ટ કરો','પારદર્શક ચુકવણી'),
  'pa-IN': core('ਡੈਸ਼ਬੋਰਡ','ਕਿਸਾਨ','ਖਰੀਦਦਾਰ','ਬਾਜ਼ਾਰ','ਬੋਲ ਕੇ ਸੂਚੀ ਬਣਾਓ','ਪਾਰਦਰਸ਼ੀ ਭੁਗਤਾਨ'),
  'or-IN': core('ଡ୍ୟାସବୋର୍ଡ','ଚାଷୀ','କ୍ରେତା','ବଜାର','କଥା କହି ତାଲିକା କରନ୍ତୁ','ସ୍ୱଚ୍ଛ ଦେୟ'),
  'as-IN': core('ড্যাশবোর্ড','কৃষক','ক্ৰেতা','বজাৰ','কথা কৈ তালিকাভুক্ত কৰক','স্বচ্ছ পৰিশোধ'),
  'ur-IN': core('ڈیش بورڈ','کسان','خریدار','بازار','بول کر فہرست بنائیں','شفاف ادائیگی'),
  'mai-IN': core('डैशबोर्ड','किसान','खरीदार','बजार','बोलि कऽ सूची बनाउ','पारदर्शी भुगतान'),
  'sat-IN': core('ᱰᱟᱥᱵᱚᱨᱰ','ᱪᱟᱥᱤ','ᱠᱨᱮᱛᱟ','ᱵᱟᱡᱟᱨ','ᱨᱚᱲ ᱛᱮ ᱥᱩᱪᱤ ᱵᱟᱹᱭᱤᱭᱟ','ᱥᱟᱯᱷᱟ ᱯᱟᱭᱢᱮᱱᱴ'),
  'ks-IN': core('ڈیش بورڈ','کسان','خریدار','بازار','بول کر فہرست بنائیں','شفاف ادائیگی'),
  'ne-IN': core('ड्यासबोर्ड','किसान','खरिदार','बजार','बोलेर सूची बनाउनुहोस्','पारदर्शी भुक्तानी'),
  'kok-IN': core('डॅशबोर्ड','शेतकार','घेणदार','बाजार','उलोवपाक लागीं नोंद करात','पारदर्शक पेमेंट'),
  'sd-IN': core('ڊيش بورڊ','هاري','خريدار','بازار','ڳالهائي لسٽ ٺاهيو','شفاف ادائيگي'),
  'doi-IN': core('डैशबोर्ड','किसान','खरीदार','बजार','बोलियै सूची बनाओ','पारदर्शी भुगतान'),
  'mni-IN': core('ꯗꯦꯁꯕꯣꯔꯗ','ꯁꯤꯟꯅꯕ','ꯈꯔꯤꯗꯔ','ꯕꯥꯖꯥꯔ','ꯈꯣꯡꯒꯤ ꯅꯣꯡꯃꯤꯟꯅ ꯂꯤꯁ꯭ꯠ ꯇꯧꯕꯥ','ꯇ꯭ꯔꯥꯟꯁꯄꯔꯦꯟꯇ ꯄꯦꯃꯦꯟꯇ'),
  'br-IN': core('डैशबोर्ड','किसान','खरीदार','बाजार','बोलकर सूची बनाएं','पारदर्शी भुगतान'),
};

export function getLanguage(code: string): LanguageOption { return INDIAN_LANGUAGES.find((l) => l.code === code) ?? INDIAN_LANGUAGES[0]; }
export function t(code: string, key: string): string { return translations[code]?.[key] ?? translations['en-IN'][key] ?? key; }
