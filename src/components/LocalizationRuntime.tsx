'use client';

import { useEffect } from 'react';
import { INDIAN_LANGUAGES, LanguageCode } from '@/lib/i18n';

const KEY = 'agriconnect_language';

// Core product vocabulary is translated locally so the dashboard changes immediately,
// including on Vercel/offline demos. Dynamic numbers and crop names are preserved.
const CORE: Record<string, Partial<Record<LanguageCode, string>>> = {
  'Good Morning': {
    'hi-IN':'सुप्रभात','bn-IN':'সুপ্রভাত','te-IN':'శుభోదయం','mr-IN':'शुभ सकाळ','ta-IN':'காலை வணக்கம்','gu-IN':'સુપ્રભાત','kn-IN':'ಶುಭೋದಯ','ml-IN':'സുപ്രഭാതം','pa-IN':'ਸ਼ੁਭ ਸਵੇਰ','or-IN':'ସୁପ୍ରଭାତ','as-IN':'সুপ্ৰভাত','ur-IN':'صبح بخیر','mai-IN':'सुप्रभात','sat-IN':'ᱥᱩᱯᱨᱵᱷᱟᱛ','ks-IN':'صبح بخیر','ne-IN':'शुभ प्रभात','kok-IN':'शुभ सकाळ','sd-IN':'صبح بخير','doi-IN':'सुप्रभात','mni-IN':'ꯁꯨꯄ꯭ꯔꯚꯥꯠ','br-IN':'सुप्रभात'
  },
  'Home': {'hi-IN':'होम','bn-IN':'হোম','te-IN':'హోమ్','mr-IN':'होम','ta-IN':'முகப்பு','gu-IN':'હોમ','kn-IN':'ಮುಖಪುಟ','ml-IN':'ഹോം','pa-IN':'ਹੋਮ','or-IN':'ହୋମ','as-IN':'হোম','ur-IN':'ہوم','mai-IN':'होम','sat-IN':'ᱦᱚᱢ','ks-IN':'ہوم','ne-IN':'होम','kok-IN':'होम','sd-IN':'هوم','doi-IN':'होम','mni-IN':'ꯍꯣꯝ','br-IN':'होम'},
  'My Produce': {'hi-IN':'मेरी उपज','bn-IN':'আমার উৎপাদন','te-IN':'నా పంట','mr-IN':'माझी उपज','ta-IN':'எனது விளைபொருள்','gu-IN':'મારી ઉપજ','kn-IN':'ನನ್ನ ಉತ್ಪನ್ನ','ml-IN':'എന്റെ വിള','pa-IN':'ਮੇਰੀ ਉਪਜ','or-IN':'ମୋ ଉତ୍ପାଦ','as-IN':'মোৰ উৎপাদন','ur-IN':'میری پیداوار','mai-IN':'हमर उपज','sat-IN':'ᱤᱧᱟᱹᱜ ᱩᱛᱯᱟᱫ','ks-IN':'میری پیداوار','ne-IN':'मेरो उत्पादन','kok-IN':'म्हजी उपज','sd-IN':'منهنجي پيداوار','doi-IN':'मेरी उपज','mni-IN':'ꯑꯩꯒꯤ ꯄꯥꯟ','br-IN':'मोर उत्पादन'},
  'Market Intelligence': {'hi-IN':'बाज़ार जानकारी','bn-IN':'বাজার তথ্য','te-IN':'మార్కెట్ సమాచారం','mr-IN':'बाजार माहिती','ta-IN':'சந்தை தகவல்','gu-IN':'બજાર માહિતી','kn-IN':'ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ','ml-IN':'വിപണി വിവരങ്ങൾ','pa-IN':'ਮਾਰਕੀਟ ਜਾਣਕਾਰੀ','or-IN':'ବଜାର ସୂଚନା','as-IN':'বজাৰ তথ্য','ur-IN':'مارکیٹ معلومات','mai-IN':'बजार जानकारी','sat-IN':'ᱵᱟᱡᱟᱨ ᱵᱤᱵᱨᱚᱬ','ks-IN':'بازار معلومات','ne-IN':'बजार जानकारी','kok-IN':'बाजार माहिती','sd-IN':'مارڪيٽ ڄاڻ','doi-IN':'बजार जानकारी','mni-IN':'ꯃꯥꯔꯀꯦꯠ ꯋꯥꯐꯝ','br-IN':'बजार जानकारी'},
  'My Earnings': {'hi-IN':'मेरी कमाई','bn-IN':'আমার আয়','te-IN':'నా ఆదాయం','mr-IN':'माझी कमाई','ta-IN':'எனது வருமானம்','gu-IN':'મારી કમાણી','kn-IN':'ನನ್ನ ಆದಾಯ','ml-IN':'എന്റെ വരുമാനം','pa-IN':'ਮੇਰੀ ਕਮਾਈ','or-IN':'ମୋ ଆୟ','as-IN':'মোৰ উপাৰ্জন','ur-IN':'میری آمدنی','mai-IN':'हमर कमाइ','sat-IN':'ᱤᱧᱟᱹᱜ ᱠᱟᱢᱟᱭ','ks-IN':'میری کمائی','ne-IN':'मेरो आम्दानी','kok-IN':'म्हजी कमाई','sd-IN':'منهنجي آمدني','doi-IN':'मेरी कमाई','mni-IN':'ꯑꯩꯒꯤ ꯀꯝꯥꯏ','br-IN':'मोर कमाइ'},
  'TAP TO SPEAK': {'hi-IN':'बोलने के लिए दबाएं','bn-IN':'কথা বলতে চাপুন','te-IN':'మాట్లాడటానికి నొక్కండి','mr-IN':'बोलण्यासाठी दाबा','ta-IN':'பேச அழுத்தவும்','gu-IN':'બોલવા માટે દબાવો','kn-IN':'ಮಾತನಾಡಲು ಒತ್ತಿರಿ','ml-IN':'സംസാരിക്കാൻ അമർത്തുക','pa-IN':'ਬੋਲਣ ਲਈ ਦਬਾਓ','or-IN':'କହିବାକୁ ଦବାନ୍ତୁ','as-IN':'ক’বলৈ টিপক','ur-IN':'بولنے کے لیے دبائیں','mai-IN':'बोलय लेल दबाउ','sat-IN':'ᱨᱚᱲ ᱛᱮ ᱫᱟᱵᱟᱣ','ks-IN':'بولنے کے لیے دبائیں','ne-IN':'बोल्न थिच्नुहोस्','kok-IN':'उलोवपाक दामात','sd-IN':'ڳالهائڻ لاءِ دٻايو','doi-IN':'बोलने लेई दबाओ','mni-IN':'ꯈꯣꯡꯒꯤ ꯇꯧꯅ ꯅꯝꯕꯥ','br-IN':'बोलय लेल दबाउ'},
  'ENTER MANUALLY': {'hi-IN':'मैन्युअल दर्ज करें','bn-IN':'ম্যানুয়ালি লিখুন','te-IN':'మాన్యువల్‌గా నమోదు చేయండి','mr-IN':'हाताने नोंदवा','ta-IN':'கைமுறையாக உள்ளிடவும்','gu-IN':'મેન્યુઅલી દાખલ કરો','kn-IN':'ಹಸ್ತಚಾಲಿತವಾಗಿ ನಮೂದಿಸಿ','ml-IN':'മാനുവലായി നൽകുക','pa-IN':'ਹੱਥੀਂ ਦਰਜ ਕਰੋ','or-IN':'ହାତରେ ଦିଅନ୍ତୁ','as-IN':'হাতে লিখক','ur-IN':'دستی درج کریں','mai-IN':'हाथसँ दर्ज करू','sat-IN':'ᱦᱟᱛᱮ ᱵᱷᱟᱨᱛᱤ','ks-IN':'دستی درج کریں','ne-IN':'म्यानुअल प्रविष्टि','kok-IN':'हातान नोंद करात','sd-IN':'دستي داخل ڪريو','doi-IN':'हाथें दर्ज करो','mni-IN':'ꯑꯃꯥꯅ ꯁꯣꯛꯅ ꯊꯣꯛꯄꯥ','br-IN':'हाथसँ दर्ज करू'},
  'VIEW PRICE & DEMAND ADVICE': {'hi-IN':'कीमत और मांग सलाह देखें','bn-IN':'মূল্য ও চাহিদার পরামর্শ দেখুন','te-IN':'ధర మరియు డిమాండ్ సలహా చూడండి','mr-IN':'किंमत व मागणी सल्ला पहा','ta-IN':'விலை மற்றும் தேவை ஆலோசனையைப் பார்க்கவும்','gu-IN':'કિંમત અને માંગ સલાહ જુઓ','kn-IN':'ಬೆಲೆ ಮತ್ತು ಬೇಡಿಕೆ ಸಲಹೆ ನೋಡಿ','ml-IN':'വിലയും ആവശ്യവും സംബന്ധിച്ച ഉപദേശം കാണുക','pa-IN':'ਕੀਮਤ ਅਤੇ ਮੰਗ ਸਲਾਹ ਵੇਖੋ','or-IN':'ମୂଲ୍ୟ ଓ ଚାହିଦା ପରାମର୍ଶ ଦେଖନ୍ତୁ','as-IN':'মূল্য আৰু চাহিদাৰ পৰামৰ্শ চাওক','ur-IN':'قیمت اور طلب کا مشورہ دیکھیں','mai-IN':'दाम आ मांग सलाह देखू','sat-IN':'ᱫᱟᱢ ᱟᱨ ᱫᱟᱹᱵᱤ ᱥᱚᱦᱟᱭ ᱧᱮᱞ','ks-IN':'قیمت اور طلب کا مشورہ دیکھیں','ne-IN':'मूल्य र माग सल्लाह हेर्नुहोस्','kok-IN':'किंमत आ माग सल्लो पळोवात','sd-IN':'قيمت ۽ طلب جو مشورو ڏسو','doi-IN':'कीमत ते मांग सलाह दिखाओ','mni-IN':'ꯃꯃꯜ ꯑꯃꯁꯨꯡ ꯊꯥꯒꯤ ꯑꯣꯏꯕ ꯁꯣꯛ ꯎ','br-IN':'दाम आ मांग सलाह देखू'},
  'Today’s Price & Demand Advisory': {'hi-IN':'आज की कीमत और मांग सलाह','bn-IN':'আজকের মূল্য ও চাহিদার পরামর্শ','te-IN':'నేటి ధర మరియు డిమాండ్ సలహా','mr-IN':'आजची किंमत व मागणी सल्ला','ta-IN':'இன்றைய விலை மற்றும் தேவை ஆலோசனை','gu-IN':'આજની કિંમત અને માંગ સલાહ','kn-IN':'ಇಂದಿನ ಬೆಲೆ ಮತ್ತು ಬೇಡಿಕೆ ಸಲಹೆ','ml-IN':'ഇന്നത്തെ വിലയും ആവശ്യവും സംബന്ധിച്ച ഉപദേശം','pa-IN':'ਅੱਜ ਦੀ ਕੀਮਤ ਅਤੇ ਮੰਗ ਸਲਾਹ','or-IN':'ଆଜିର ମୂଲ୍ୟ ଓ ଚାହିଦା ପରାମର୍ଶ','as-IN':'আজিৰ মূল্য আৰু চাহিদাৰ পৰামৰ্শ','ur-IN':'آج کی قیمت اور طلب کا مشورہ','mai-IN':'आजुक दाम आ मांग सलाह','sat-IN':'ᱱᱤᱛ ᱫᱟᱢ ᱟᱨ ᱫᱟᱹᱵᱤ ᱥᱚᱦᱟᱭ','ks-IN':'آج کی قیمت اور طلب کا مشورہ','ne-IN':'आजको मूल्य र माग सल्लाह','kok-IN':'आजची किंमत आ मागणी सल्लो','sd-IN':'اڄ جي قيمت ۽ طلب جو مشورو','doi-IN':'अज्ज दी कीमत ते मांग सलाह','mni-IN':'ꯅꯤꯡꯊꯤꯕꯥ ꯃꯃꯜ ꯑꯃꯁꯨꯡ ꯊꯥꯒꯤ ꯁꯣꯛ','br-IN':'आजुक दाम आ मांग सलाह'},
  'Expected Price': {'hi-IN':'अपेक्षित कीमत','bn-IN':'প্রত্যাশিত মূল্য','te-IN':'అంచనా ధర','mr-IN':'अपेक्षित किंमत','ta-IN':'எதிர்பார்க்கப்படும் விலை','gu-IN':'અપેક્ષિત કિંમત','kn-IN':'ನಿರೀಕ್ಷಿತ ಬೆಲೆ','ml-IN':'പ്രതീക്ഷിക്കുന്ന വില','pa-IN':'ਉਮੀਦ ਕੀਤੀ ਕੀਮਤ','or-IN':'ଆଶାକରା ମୂଲ୍ୟ','as-IN':'আশা কৰা মূল্য','ur-IN':'متوقع قیمت','mai-IN':'अपेक्षित दाम','sat-IN':'ᱟᱥᱟ ᱫᱟᱢ','ks-IN':'متوقع قیمت','ne-IN':'अपेक्षित मूल्य','kok-IN':'अपेक्षित किंमत','sd-IN':'متوقع قيمت','doi-IN':'उम्मीद कीमत','mni-IN':'ꯃꯃꯜ ꯑꯣꯏꯕꯥ','br-IN':'अपेक्षित दाम'},
  'Price Trend': {'hi-IN':'कीमत रुझान','bn-IN':'মূল্যের প্রবণতা','te-IN':'ధర ధోరణి','mr-IN':'किंमत कल','ta-IN':'விலை போக்கு','gu-IN':'કિંમત વલણ','kn-IN':'ಬೆಲೆ ಪ್ರವೃತ್ತಿ','ml-IN':'വില പ്രവണത','pa-IN':'ਕੀਮਤ ਰੁਝਾਨ','or-IN':'ମୂଲ୍ୟ ପ୍ରବଣତା','as-IN':'মূল্য ধাৰা','ur-IN':'قیمت کا رجحان','mai-IN':'दामक रुझान','sat-IN':'ᱫᱟᱢ ᱨᱩᱡᱷᱟᱱ','ks-IN':'قیمت کا رجحان','ne-IN':'मूल्य प्रवृत्ति','kok-IN':'किंमत कल','sd-IN':'قيمت جو رجحان','doi-IN':'कीमत रुझान','mni-IN':'ꯃꯃꯜ ꯄꯥꯔꯣꯏ','br-IN':'दामक रुझान'},
  'Demand Velocity': {'hi-IN':'मांग गति','bn-IN':'চাহিদার গতি','te-IN':'డిమాండ్ వేగం','mr-IN':'मागणीचा वेग','ta-IN':'தேவை வேகம்','gu-IN':'માંગની ગતિ','kn-IN':'ಬೇಡಿಕೆಯ ವೇಗ','ml-IN':'ആവശ്യകതയുടെ വേഗം','pa-IN':'ਮੰਗ ਦੀ ਗਤੀ','or-IN':'ଚାହିଦା ଗତି','as-IN':'চাহিদাৰ গতি','ur-IN':'طلب کی رفتار','mai-IN':'मांग गति','sat-IN':'ᱫᱟᱹᱵᱤ ᱵᱮᱜᱚᱨ','ks-IN':'طلب کی رفتار','ne-IN':'मागको गति','kok-IN':'मागणीचो वेग','sd-IN':'طلب جي رفتار','doi-IN':'मांग दी गति','mni-IN':'ꯊꯥꯒꯤ ꯋꯦꯠ','br-IN':'मांग गति'},
  'Transparent settlement': {'hi-IN':'पारदर्शी भुगतान','bn-IN':'স্বচ্ছ নিষ্পত্তি','te-IN':'పారదర్శక చెల్లింపు','mr-IN':'पारदर्शक सेटलमेंट','ta-IN':'வெளிப்படையான பணப்பரிவர்த்தனை','gu-IN':'પારદર્શક ચુકવણી','kn-IN':'ಪಾರದರ್ಶಕ ಪಾವತಿ','ml-IN':'സുതാര്യമായ തീർപ്പാക്കൽ','pa-IN':'ਪਾਰਦਰਸ਼ੀ ਭੁਗਤਾਨ','or-IN':'ସ୍ୱଚ୍ଛ ଦେୟ','as-IN':'স্বচ্ছ পৰিশোধ','ur-IN':'شفاف ادائیگی','mai-IN':'पारदर्शी भुगतान','sat-IN':'ᱥᱟᱯᱷᱟ ᱯᱟᱭᱢᱮᱱᱴ','ks-IN':'شفاف ادائیگی','ne-IN':'पारदर्शी भुक्तानी','kok-IN':'पारदर्शक पेमेंट','sd-IN':'شفاف ادائيگي','doi-IN':'पारदर्शी भुगतान','mni-IN':'ꯇ꯭ꯔꯥꯟꯁꯄꯔꯦꯟꯇ ꯄꯦꯃꯦꯟꯇ','br-IN':'पारदर्शी भुगतान'}
};

function translateNode(node: Text, language: LanguageCode) {
  const original = node.nodeValue || '';
  if (!original.trim()) return;
  let next = original;
  for (const [english, translations] of Object.entries(CORE)) {
    const translated = translations[language];
    if (translated && next.includes(english)) next = next.split(english).join(translated);
  }
  if (next !== original) node.nodeValue = next;
}

function translatePage(language: LanguageCode) {
  if (language === 'en-IN') return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current: Node | null = walker.nextNode();
  while (current) { nodes.push(current as Text); current = walker.nextNode(); }
  nodes.forEach((node) => translateNode(node, language));
}

export default function LocalizationRuntime() {
  useEffect(() => {
    const apply = () => {
      const value = (localStorage.getItem(KEY) as LanguageCode | null) || 'en-IN';
      if (INDIAN_LANGUAGES.some((x) => x.code === value)) {
        document.documentElement.lang = value;
        window.setTimeout(() => translatePage(value), 0);
      }
    };
    apply();
    window.addEventListener('agriconnect-language-change', apply);
    const observer = new MutationObserver(() => {
      const value = (localStorage.getItem(KEY) as LanguageCode | null) || 'en-IN';
      if (value !== 'en-IN') translatePage(value);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('agriconnect-language-change', apply);
      observer.disconnect();
    };
  }, []);
  return null;
}
