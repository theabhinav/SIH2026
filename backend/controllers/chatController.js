const { LOCATIONS } = require('../constants/locationsData');
const { CATEGORY_PROFILE, CATEGORY_SUPPLY, getProfile, getSupply } = require('../constants/businessData');
const { computeScheme, governmentSchemes } = require('../utils/calculator');

// Language localized strings and prompts
const BOT_STRINGS = {
  en: {
    welcome: "Namaste! I am your Grameen Udyog AI Voice Sahayak. If you wish to start any business, tell me what enterprise you have in mind. I can help you fill the business advisory form step-by-step or answer any business & website questions.",
    askState: "Which State is your enterprise located in? Please speak or select below:",
    askDistrict: "Great! Which District in {state}?",
    askBlockVillage: "Understood. Please tell or select your Block and Village/Gram Panchayat in {district}:",
    askBusiness: "Which business do you want to start or expand? Tell me your business idea or choose one below:",
    askCapital: "How much margin capital (your own money) can you invest for this enterprise? (For example: ₹14,000, ₹50,000, ₹1,00,000)",
    askRepayment: "How would you prefer to repay the concessional loan: Monthly or Quarterly?",
    summaryReady: "I have collected all your details! Here is your business plan summary:\n• Location: {village}, {block}, {district}, {state}\n• Business: {business}\n• Your Margin Capital: ₹{margin}\n• Estimated Total Project Cost: ₹{cost}\n• Estimated Concessional Loan: ₹{loan}\n\nClick below to apply this directly to the form and view your full advisory report!",
    generalFallback: "If you want to start any business, just tell me what enterprise you have in mind. I will gather your necessary details (such as your location/area and budget/capital) and instantly generate a complete business advisory report with concessional loan details for you.",
  },
  hi: {
    welcome: "नमस्ते! मैं आपका ग्रामीण उद्योग आवाज़ सहायक हूँ। यदि आप कोई भी नया व्यवसाय शुरू करना चाहते हैं, तो मुझे बताएं। मैं आपसे ज़रूरी जानकारियाँ लेकर आपकी रिपोर्ट तैयार करने में पूरी मदद करूँगा या व्यापार व सरकारी योजनाओं से जुड़े आपके सवालों के जवाब दूँगा।",
    askState: "आपका उद्यम किस राज्य (State) में स्थित है? कृपया बोलें या नीचे से चुनें:",
    askDistrict: "बहुत बढ़िया! {state} में आपका ज़िला (District) कौन सा है?",
    askBlockVillage: "समझ गया। {district} में आपका ब्लॉक और गाँव/ग्राम पंचायत का नाम क्या है?",
    askBusiness: "आप कौन सा व्यापार या उद्यम शुरू करना चाहते हैं? अपना विचार बोलकर बताएं या नीचे से चुनें:",
    askCapital: "आप इस व्यवसाय के लिए अपनी तरफ से कितनी मार्जिन पूँजी (रुपये) लगा सकते हैं? (जैसे: ₹14,000, ₹50,000, ₹1,00,000)",
    askRepayment: "आप लोन की किश्त कैसे चुकाना पसंद करेंगे: मासिक (Monthly) या त्रैमासिक (Quarterly)?",
    summaryReady: "बहुत खूब! मैंने आपकी सारी जानकारी दर्ज कर ली है:\n• स्थान: {village}, {block}, {district}, {state}\n• व्यवसाय: {business}\n• आपकी पूँजी: ₹{margin}\n• अनुमानित कुल प्रोजेक्ट लागत: ₹{cost}\n• अनुमानित सरकारी रियायती ऋण: ₹{loan}\n\nनीचे दिए गए बटन पर क्लिक करके इसे फ़ॉर्म में भरें और अपनी पूरी रिपोर्ट देखें!",
    generalFallback: "यदि आप कोई भी व्यवसाय शुरू करना चाहते हैं, तो बस मुझे बताएं कि आप कौन सा काम करना चाहते हैं। मैं आपसे आपके क्षेत्र (राज्य/ज़िला/गाँव) और बजट (पूँजी) जैसी ज़रूरी जानकारियाँ लेकर आपकी पूरी व्यावसायिक रिपोर्ट और सरकारी रियायती लोन की जानकारी तैयार करके दूँगा।",
  },
  mr: {
    welcome: "नमस्कार! मी तुमचा ग्रामीण उद्योग आवाज सहाय्यक आहे. तुम्हाला कोणताही व्यवसाय सुरू करायचा असल्यास, मला सांगा. मी आवश्यक माहिती घेऊन तुमचा अहवाल तयार करण्यास मदत करेन.",
    askState: "तुमचा व्यवसाय कोणत्या राज्यात (State) आहे? कृपया सांगा किंवा खाली निवडा:",
    askDistrict: "{state} मध्ये तुमचा जिल्हा (District) कोणता आहे?",
    askBlockVillage: "{district} मधील तुमचा तालुका/ब्लॉक आणि गावाचे नाव सांगा:",
    askBusiness: "तुम्हाला कोणता व्यवसाय सुरू करायचा आहे? तुमची कल्पना सांगा किंवा खाली निवडा:",
    askCapital: "तुम्ही या व्यवसायासाठी स्वतःचे किती पैसे (मार्जिन भांडवल) गुंतवू शकता? (उदा. ₹14,000, ₹50,000, ₹1,00,000)",
    askRepayment: "तुम्हाला कर्जाचा हप्ता कसा भरायला आवडेल: मासिक (Monthly) की त्रैमासिक (Quarterly)?",
    summaryReady: "छान! मी तुमची सर्व माहिती गोळा केली आहे:\n• ठिकाण: {village}, {block}, {district}, {state}\n• व्यवसाय: {business}\n• तुमचे भांडवल: ₹{margin}\n• एकूण प्रकल्प खर्च: ₹{cost}\n• अंदाजे शासकीय सवलतीचे कर्ज: ₹{loan}\n\nखालील बटणावर क्लिक करून हा फॉर्म भरा आणि संपूर्ण अहवाल पहा!",
    generalFallback: "तुम्हाला कोणताही व्यवसाय सुरू करायचा असल्यास, फक्त मला सांगा की तुम्हाला कोणता व्यवसाय करायचा आहे. मी तुमचे क्षेत्र (राज्य/जिल्हा/गाव) आणि बजेट (भांडवल) यांसारखी आवश्यक माहिती घेऊन तुमच्यासाठी संपूर्ण व्यवसाय अहवाल आणि शासकीय कर्ज माहिती तयार करून देईन.",
  },
  ta: {
    welcome: "வணக்கம்! நான் கிராமீன் உத்யோக் குரல் உதவியாளர். நீங்கள் ஏதேனும் தொழில் தொடங்க விரும்பினால் என்னிடம் கூறுங்கள். தேவையான விவரங்களைப் பெற்று உங்கள் அறிக்கையைத் தயாரிக்க உதவுவேன்.",
    askState: "உங்கள் தொழில் எந்த மாநிலத்தில் அமைந்துள்ளது? தயவுசெய்து கூறவும் அல்லது தேர்ந்தெடுக்கவும்:",
    askDistrict: "{state}-ல் உங்கள் மாவட்டம் எது?",
    askBlockVillage: "{district}-ல் உங்கள் வட்டம் மற்றும் கிராமத்தின் பெயர் என்ன?",
    askBusiness: "நீங்கள் எந்த தொழிலைத் தொடங்க விரும்புகிறீர்கள்? உங்கள் யோசனையைக் கூறவும்:",
    askCapital: "நீங்கள் உங்கள் பங்காக எவ்வளவு மூலதனம் முதலீடு செய்ய முடியும்? (எ.கா: ₹14,000, ₹50,000, ₹1,00,000)",
    askRepayment: "கடனை எவ்வாறு திருப்பிச் செலுத்த விரும்புகிறீர்கள்: மாதந்தோறும் அல்லது 3 மாதங்களுக்கு ஒருமுறை?",
    summaryReady: "சிறப்பு! உங்கள் விவரங்கள் அனைத்தும் பதிவு செய்யப்பட்டுள்ளன:\n• இடம்: {village}, {block}, {district}, {state}\n• தொழில்: {business}\n• உங்கள் மூலதனம்: ₹{margin}\n• மொத்த திட்ட செலவு: ₹{cost}\n• உத்தேச சலுகைக் கடன்: ₹{loan}\n\nகீழே உள்ள பொத்தானைக் கிளிக் செய்து படிவத்தை நிரப்பி உங்கள் அறிக்கையைக் காண்க!",
    generalFallback: "நீங்கள் ஏதேனும் தொழில் தொடங்க விரும்பினால், எந்த தொழில் செய்ய விரும்புகிறீர்கள் என்று என்னிடம் கூறுங்கள். உங்கள் பகுதி மற்றும் பட்ஜெட் விவரங்களைப் பெற்று முழு வணிக அறிக்கையை உருவாக்கித் தருகிறேன்.",
  },
  te: {
    welcome: "నమస్తే! నేను మీ గ్రామీణ్ ఉద్యోగ్ వాయిస్ అసిస్టెంట్‌ని. మీరు ఏదైనా వ్యాపారాన్ని ప్రారంభించాలనుకుంటే నాకు చెప్పండి. మీ వివరాలను తీసుకొని నివేదిక రూపొందించడంలో సహాయపడతాను.",
    askState: "మీ వ్యాపారం ఏ రాష్ట్రంలో ఉంది? దయచేసి మాట్లాడండి లేదా ఎంచుకోండి:",
    askDistrict: "{state} లో మీ జిల్లా ఏది?",
    askBlockVillage: "{district} లో మీ మండలం మరియు గ్రామం పేరు ఏమిటి?",
    askBusiness: "మీరు ఏ వ్యాపారాన్ని ప్రారంభించాలనుకుంటున్నారు? మీ ఆలోచనను చెప్పండి:",
    askCapital: "మీరు మీ స్వంత డబ్బు ఎంత పెట్టుబడి పెట్టగలరు? (ఉదా: ₹14,000, ₹50,000, ₹1,00,000)",
    askRepayment: "రుణాన్ని ఎలా తిరిగి చెల్లించాలనుకుంటున్నారు: నెలవారీ లేదా త్రైమాసికం?",
    summaryReady: "అద్భుతం! మీ వివరాలు సేకరించబడ్డాయి:\n• ప్రాంతం: {village}, {block}, {district}, {state}\n• వ్యాపారం: {business}\n• మీ పెట్టుబడి: ₹{margin}\n• మొత్తం ప్రాజెక్ట్ ఖర్చు: ₹{cost}\n• రాయితీ రుణం: ₹{loan}\n\nఫారమ్ పూరించడానికి మరియు నివేదిక చూడటానికి క్రింది బటన్‌పై క్లిక్ చేయండి!",
    generalFallback: "మీరు ఏదైనా వ్యాపారాన్ని ప్రారంభించాలనుకుంటే, మీరు ఏ పని చేయాలనుకుంటున్నారో నాకు చెప్పండి. మీ ప్రాంతం మరియు బడ్జెట్ వివరాలను తీసుకొని మీ కోసం పూర్తి వ్యాపార నివేదికను రూపొందిస్తాను.",
  },
  bn: {
    welcome: "নমস্কার! আমি গ্রামীণ উদ্যোগ ভয়েস সহকারী। আপনি কোনো ব্যবসা শুরু করতে চাইলে আমাকে জানান। প্রয়োজনীয় তথ্য নিয়ে আপনার প্রতিবেদন তৈরিতে সাহায্য করব।",
    askState: "আপনার উদ্যোগটি কোন রাজ্যে অবস্থিত? অনুগ্রহ করে বলুন বা নিচে বেছে নিন:",
    askDistrict: "{state}-এ আপনার জেলা কোনটি?",
    askBlockVillage: "{district}-এ আপনার ব্লক এবং গ্রাম/পঞ্চায়েতের নাম বলুন:",
    askBusiness: "আপনি কোন ব্যবসা শুরু করতে চান? আপনার পরিকল্পনা জানান:",
    askCapital: "আপনার কাছে কত মার্জিন মূলধন রয়েছে? (যেমন: ₹১৪,০০০, ₹৫০,০০০, ₹১,০০,০০০)",
    askRepayment: "আপনি ঋণের কিস্তি কীভাবে পরিশোধ করতে চান: মাসিক নাকি ত্রৈমাসিক?",
    summaryReady: "চমৎকার! আমি আপনার সব বিবরণ রেকর্ড করেছি:\n• অবস্থান: {village}, {block}, {district}, {state}\n• ব্যবসা: {business}\n• আপনার মূলধন: ₹{margin}\n• আনুমানিক প্রকল্প ব্যয়: ₹{cost}\n• সম্ভাব্য সরকারি ঋণ: ₹{loan}\n\nফর্মটি পূরণ করতে ও रिपोर्ट দেখতে নিচে ক্লিক করুন!",
    generalFallback: "আপনি যদি কোনো ব্যবসা শুরু করতে চান, তবে আমাকে জানান আপনি কোন কাজ করতে চান। আমি আপনার এলাকা এবং বাজেট সম্পর্কিত তথ্য নিয়ে আপনার জন্য সম্পূর্ণ ব্যবসায়িক প্রতিবেদন তৈরি করে দেব।",
  }
};

// Multilingual State aliases
const STATE_ALIASES = {
  'Maharashtra': ['maharashtra', 'महाराष्ट्र', 'महा राष्ट्र', 'महा.', 'mh'],
  'Uttar Pradesh': ['uttar pradesh', 'उत्तर प्रदेश', 'उत्तरप्रदेश', 'यूपी', 'up', 'up.'],
  'Gujarat': ['gujarat', 'गुजरात', 'गुजारत', 'gj'],
  'Bihar': ['bihar', 'बिहार', 'br'],
  'Karnataka': ['karnataka', 'कर्नाटक', 'कर्नाटका', 'ka'],
  'Tamil Nadu': ['tamil nadu', 'तमिलनाडु', 'तमिल नाडु', 'தமிழ்நாடு', 'tn'],
  'West Bengal': ['west bengal', 'पश्चिम बंगाल', 'बंगाल', 'পশ্চিমবঙ্গ', 'wb'],
  'Telangana': ['telangana', 'तेलंगाना', 'తెలంగాణ', 'ts'],
};

// Multilingual District aliases
const DISTRICT_ALIASES = {
  'Nashik': ['nashik', 'nasik', 'नासिक', 'नाशिक'],
  'Pune': ['pune', 'पुणे', 'पूना'],
  'Varanasi': ['varanasi', 'banaras', 'वाराणसी', 'बनारस', 'काशी'],
  'Lucknow': ['lucknow', 'लखनऊ'],
  'Coimbatore': ['coimbatore', 'कोयंबटूर', 'கோயம்புத்தூர்'],
  'Madurai': ['madurai', 'मदुरै', 'மதுரை'],
  'Bardhaman': ['bardhaman', 'burdwan', 'बर्धमान', 'বর্ধমান'],
  'Hooghly': ['hooghly', 'हुगली', 'হুগলি'],
  'Mysuru': ['mysuru', 'mysore', 'मैसूर', 'मैसुरु', 'ಮೈಸೂರು'],
  'Belagavi': ['belagavi', 'belgaum', 'बेलगावी', 'बेलगाम'],
  'Warangal': ['warangal', 'वारंगल', 'వరంగల్'],
  'Karimnagar': ['karimnagar', 'करीमनगर', 'కరీంనగర్'],
  'Anand': ['anand', 'आनंद', 'आणंद'],
  'Kutch': ['kutch', 'कच्छ'],
  'Patna': ['patna', 'पटना'],
  'Muzaffarpur': ['muzaffarpur', 'मुजफ्फरपुर'],
};

// Pre-computed lookup tables for rapid district/block deduction
const DISTRICT_TO_STATE = {};
for (const [s, districts] of Object.entries(LOCATIONS)) {
  for (const d of Object.keys(districts)) {
    DISTRICT_TO_STATE[d.toLowerCase()] = s;
    const aliases = DISTRICT_ALIASES[d] || [];
    for (const a of aliases) {
      DISTRICT_TO_STATE[a.toLowerCase()] = s;
    }
  }
}

// Multilingual keywords mapping to categories in CATEGORY_PROFILE
const CATEGORY_SYNONYMS = {
  'Dairy & Milk Products': ['dairy', 'milk', 'doodh', 'dudh', 'डेयरी', 'दूध', 'दुग्ध', 'गाय', 'भैंस', 'पशुपालन', 'डेअरी', 'பால்', 'పాలు', 'দুধ'],
  'Poultry Farming': ['poultry', 'chicken', 'murgi', 'murghi', 'egg', 'पोल्ट्री', 'मुर्गी', 'मुर्गीपालन', 'कड़कनाथ', 'अंडा', 'कुक्कुटपालन', 'கோழி', 'కోళ్లు', 'হাঁস-মুরগি'],
  'Retail Kirana Store': ['kirana', 'grocery', 'kirana store', 'kirana dukan', 'किराना', 'किराना स्टोर', 'किराना दुकान', 'जनरल स्टोर', 'राशन', 'राशन दुकान', 'किराणा', 'मளிகை', 'కిరాణా', 'মুদি'],
  'Flour Mill': ['flour', 'mill', 'chakki', 'atta', 'आटा', 'चक्की', 'आटा चक्की', 'पिसाई', 'पिठाची गिरणी', 'மாவுக் கோதுமை', 'పిండి గిర్నీ', 'আটা কল'],
  'Tailoring & Boutique': ['tailor', 'tailoring', 'silai', 'boutique', 'सिलाई', 'टेलरिंग', 'दर्जी', 'बुटीक', 'கையகம்', 'టైలరింగ్', 'দর্জি'],
  'Textiles & Handloom': ['textile', 'handloom', 'kapda', 'kapde', 'kapdo', 'clothes', 'cloth', 'garment', 'garments', 'धागा', 'कपड़ा', 'कपड़े', 'कपड़ों', 'कपड़े की दुकान', 'कपड़ा दुकान', 'वस्त्र', 'गारमेंट्स', 'रेडीमेड', 'साड़ी', 'हथकरघा', 'हातमाग', 'கைத்தறி', 'చేనేత', 'তাঁত'],
  'Goat & Sheep Farming': ['goat', 'sheep', 'bakri', 'bhed', 'बकरी', 'भेड़', 'बकरी पालन', 'शेळीपालन', 'ஆடு', 'మేకలు', 'ছাগল'],
  'Beauty Parlour': ['beauty', 'parlour', 'parlor', 'ब्यूटी', 'पार्लर', 'मेकअप', 'அழகு நிலையம்', 'బ్యూటీ పార్లర్', 'বিউটি পার্লার'],
  'Mobile Repair & Recharge Shop': ['mobile', 'recharge', 'repair', 'phone', 'मोबाइल', 'रिपेयर', 'रिचार्ज', 'मोबाइल की दुकान', 'மொபைல்', 'మొబైల్', 'মোবাইল'],
  'Auto/E-Rickshaw Service': ['rickshaw', 'auto', 'erickshaw', 'रिक्शा', 'ऑटो', 'ई-रिक्शा', 'ஆட்டோ', 'ఆటో', 'রিকশা'],
  'Bakery & Confectionery': ['bakery', 'cake', 'biscuit', 'बेकरी', 'केक', 'बिस्कुट', 'రొట్టెలు', 'বেকারি'],
  'Tea Stall / Snacks': ['tea', 'chai', 'snack', 'stall', 'चाय', 'नाश्ता', 'टी स्टॉल', 'चाय की दुकान', 'தேநீர்', 'టీ స్టాల్', 'চা'],
  'Vegetable & Fruit Vending': ['vegetable', 'fruit', 'sabzi', 'fal', 'सब्जी', 'सब्ज़ी', 'फल', 'सब्जी की दुकान', 'फल की दुकान', 'भाजीपाला', 'காய்கறி', 'కూరగాయలు', 'সবজি'],
  'Agri-Inputs (Seeds, Fertilizer)': ['agri', 'seed', 'fertilizer', 'kheti', 'बीज', 'खाद', 'उर्वरक', 'शेती', 'விதை', 'ఎరువులు', 'বীজ'],
  'Fisheries': ['fish', 'fisheries', 'machli', 'मछली', 'मत्स्य पालन', 'माछ', 'மீன்', 'చేపలు'],
  'Handicrafts': ['handicraft', 'craft', 'हस्तशिल्प', 'दस्तकारी', 'कलाकुसर', 'கைவினை', 'చేతిపనులు', 'হস্তশিল্প'],
  'Beekeeping': ['bee', 'honey', 'मधुमक्खी', 'शहद', 'मौना पालन', 'मधमाशी', 'தேன்', 'తేనెటీగలు', 'মৌমাছি'],
  'Papad / Pickle Making': ['papad', 'pickle', 'achar', 'पापड़', 'अचार', 'लोणचे', 'ஊறுகாய்', 'ఊరగాయలు', 'আচার'],
  'Photocopy & CSC Centre': ['photocopy', 'csc', 'xerox', 'फोटोकॉपी', 'ग्राहक सेवा केंद्र', 'जन सेवा केंद्र', 'झेरॉक्स', 'জেরক্স'],
  'Two-Wheeler Repair': ['bike', 'two-wheeler', 'motorcycle', 'mechanic', 'बाइक', 'मोटरसाइकिल', 'गैराज', 'टू-व्हीलर', 'பைக்', 'బైక్', 'বাইক'],
};

// Hindi spoken number words mapping
const HINDI_NUMBER_WORDS = {
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
  'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अट्ठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'पच्चीस': 25, 'पचीस': 25, 'तीस': 30, 'पैंतीस': 35, 'चालीस': 40,
  'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90,
  'डेढ़': 1.5, 'ढाई': 2.5
};

// Helper to test if a keyword in text is preceded or followed by negation (e.g. 'किराना स्टोर नहीं', 'नहीं किराना')
function isKeywordNegated(text, kw) {
  const t = text.toLowerCase();
  const idx = t.indexOf(kw);
  if (idx === -1) return false;

  // After keyword (e.g. 'किराना स्टोर नहीं', 'किराना नहीं खोलना')
  const after = t.slice(idx + kw.length, idx + kw.length + 30);
  if (/^\s*(?:स्टोर|दुकान|का|की|वाला|फार्मिंग|काम|बिजनेस|व्यवसाय|store|shop)?\s*(?:नहीं|नही|मत|not|no|nahi|nahin)(?:[\s,।!?]|$)/i.test(after)) {
    return true;
  }

  // Before keyword (e.g. 'नहीं किराना', 'no kirana')
  const before = t.slice(Math.max(0, idx - 30), idx);
  if (/(?:^|[\s,।!?])(?:नहीं|नही|मत|not|no|nahi|nahin)\s*(?:स्टोर|दुकान|का|की|वाला|फार्मिंग|काम|बिजनेस|व्यवसाय|store|shop)?\s*$/i.test(before)) {
    return true;
  }

  return false;
}

// Dynamic business matcher with negation awareness: returns { matched: Category, negated: Category }
function findBusinessMatchWithNegation(text) {
  if (!text) return { matched: null, negated: null };
  const t = text.toLowerCase();
  const allCategories = Object.keys(CATEGORY_PROFILE);
  const matches = [];

  for (const [cat, keywords] of Object.entries(CATEGORY_SYNONYMS)) {
    if (allCategories.includes(cat)) {
      // Sort keywords longest first to match most specific term
      const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
      for (const kw of sortedKeywords) {
        const kwLower = kw.toLowerCase();
        let matchedIndex = -1;

        if (/^[a-z0-9]+$/i.test(kwLower)) {
          const regex = new RegExp('\\b' + kwLower + '\\b', 'i');
          const m = regex.exec(text);
          if (m) matchedIndex = m.index;
        } else {
          matchedIndex = t.indexOf(kwLower);
        }

        if (matchedIndex !== -1) {
          const isNeg = isKeywordNegated(text, kwLower);
          matches.push({ cat, isNegated: isNeg, index: matchedIndex });
          break;
        }
      }
    }
  }

  for (const cat of allCategories) {
    const catLower = cat.toLowerCase();
    const idx = t.indexOf(catLower);
    if (idx !== -1) {
      const isNeg = isKeywordNegated(text, catLower);
      matches.push({ cat, isNegated: isNeg, index: idx });
    }
  }

  const affirmativeMatches = matches.filter(m => !m.isNegated);
  const negatedMatches = matches.filter(m => m.isNegated);

  if (affirmativeMatches.length > 0) {
    // Pick the last affirmative match (e.g. "किराना नहीं ... कपड़े की दुकान")
    const bestAffirmative = affirmativeMatches[affirmativeMatches.length - 1];
    const negatedCat = negatedMatches.length > 0 ? negatedMatches[0].cat : null;
    return { matched: bestAffirmative.cat, negated: negatedCat };
  }

  if (negatedMatches.length > 0) {
    return { matched: null, negated: negatedMatches[0].cat };
  }

  return { matched: null, negated: null };
}

// Standard helper returning matched category (for backward compatibility)
function findBusinessMatch(text) {
  return findBusinessMatchWithNegation(text).matched;
}

// Known unsupported business types mapped to clean names
const UNSUPPORTED_BUSINESSES = [
  { name: 'पेट्रोल पंप (Petrol Pump)', keywords: ['petrol pump', 'पेट्रोल पंप', 'petrol', 'पेट्रोल', 'diesel', 'डीजल', 'cng pump', 'सीएनजी'] },
  { name: 'होटल / रेस्टोरेंट (Hotel & Restaurant)', keywords: ['hotel', 'होटल', 'restaurant', 'रेस्टोरेंट', 'dhaba', 'ढाबा', 'cafe', 'कैफे', 'lodge', 'लॉज'] },
  { name: 'मेडिकल स्टोर / फार्मेसी (Pharmacy)', keywords: ['medical store', 'मेडिकल स्टोर', 'pharmacy', 'फार्मेसी', 'दवा की दुकान', 'chemist', 'हॉस्पिटल', 'hospital', 'clinic', 'क्लीनिक'] },
  { name: 'कार शोरूम / ट्रांसपोर्ट (Automobile & Transport)', keywords: ['car showroom', 'शोरूम', 'कार का', 'truck', 'ट्रक', 'transport', 'ट्रांसपोर्ट', 'लॉजिस्टिक्स', 'logistics', 'टैक्सी सेवा'] },
  { name: 'जिम / फिटनेस सेंटर (Gym & Fitness)', keywords: ['gym', 'जिम', 'fitness', 'फिटनेस सेंटर'] },
  { name: 'सिनेमा हॉल / थिएटर (Cinema Hall)', keywords: ['cinema', 'सिनेमा', 'theatre', 'थिएटर', 'फिल्म हॉल'] },
  { name: 'हार्डवेयर व बिल्डिंग मटीरियल (Hardware Store)', keywords: ['hardware', 'हार्डवेयर', 'cement', 'सीमेंट', 'ईंट भट्ठा', 'brick kiln', 'सरिया', 'लोहा'] },
  { name: 'कोचिंग संस्थान / स्कूल (Coaching & School)', keywords: ['school', 'स्कूल', 'college', 'कॉलेज', 'coaching', 'कोचिंग', 'tuition', 'ट्यूशन'] },
  { name: 'शराब की दुकान (Liquor Store)', keywords: ['शराब', 'wine shop', 'ठेका', 'दारू', 'beer shop'] },
  { name: 'ज्वेलरी / सोने की दुकान (Jewellery Store)', keywords: ['jewellery', 'jewelry', 'ज्वेलरी', 'सोने की दुकान', 'गहने', 'सर्राफा'] },
  { name: 'सुरक्षा एजेंसी (Security Agency)', keywords: ['security agency', 'सिक्योरिटी एजेंसी', 'गार्ड सर्विस'] },
  { name: 'रियल एस्टेट / प्रॉपर्टी डीलर (Real Estate)', keywords: ['real estate', 'रियल एस्टेट', 'property dealer', 'प्रॉपर्टी डीलर'] },
];

function findUnsupportedBusiness(text) {
  if (!text) return null;
  const t = text.toLowerCase();

  // 1. Check known unsupported businesses
  for (const item of UNSUPPORTED_BUSINESSES) {
    for (const kw of item.keywords) {
      if (t.includes(kw)) {
        return item.name;
      }
    }
  }

  // 2. Generic pattern: '[X] खोलना है / शुरू करना है / का बिजनेस / की दुकान'
  const cleanT = t.replace(/^(?:भाई|नमस्ते|कृपया|hello|hi|sir|ji)\s*/i, '').trim();

  const patterns = [
    /(?:(?:मुझे|हमे|हमको|i want to open|i want to start)\s+(?:एक\s+)?)(.+?)\s+(?:खोलना|खोलनी|शुरू\s+करना|चालू\s+करना|का\s+बिजनेस|का\s+बिज़नेस|का\s+व्यापार|का\s+काम)/i,
    /(?:एक\s+)?(.+?)\s+(?:की\s+दुकान|का\s+स्टोर|का\s+काम|का\s+बिजनेस|का\s+बिज़नेस|का\s+व्यापार|का\s+उद्योग)\s*(?:खोलना|खोलनी|शुरू\s+करना|चालू\s+करना|करना)?/i,
  ];

  for (const p of patterns) {
    const m = cleanT.match(p);
    if (m && m[1]) {
      let candidate = m[1].replace(/^(?:मुझे|हमे|हमको|एक|नया|नए|नई|दूसरा|दूसरे|दूसरी|apna|अपना)\s+/i, '').trim();
      candidate = candidate.replace(/(?:\s+(?:की|का|के|store|shop|दुकान|स्टोर))+$/i, '').trim();
      if (/(?:नहीं|नही|मत|not|no|nahi|nahin)/i.test(candidate)) {
        continue;
      }
      const ignoreWords = ['नया', 'नए', 'नई', 'दूसरा', 'दूसरे', 'दूसरी', 'एक', 'काम', 'दुकान', 'बिजनेस', 'व्यापार', 'रिटेल', 'फॉर्म', 'रिपोर्ट'];
      if (candidate.length >= 2 && !ignoreWords.includes(candidate)) {
        if (!findBusinessMatch(candidate)) {
          return candidate;
        }
      }
    }
  }

  return null;
}

// Generate response for unsupported / unavailable businesses
function getUnsupportedBusinessResponse(businessName, lang = 'en') {
  if (lang === 'hi') {
    return `माफ़ कीजिए, '${businessName}' की विस्तृत प्रोजेक्ट रिपोर्ट और डेटा वर्तमान में हमारे डेटाबेस में उपलब्ध नहीं है।\n\n` +
      `हमारी वेबसाइट पर 20+ प्रमुख ग्रामीण सूक्ष्म-उद्योग (Micro-Enterprises) उपलब्ध हैं, जैसे:\n` +
      `• डेयरी व दुग्ध उत्पाद (Dairy)\n` +
      `• पोल्ट्री फार्मिंग (Poultry)\n` +
      `• रिटेल किराना स्टोर (Kirana Store)\n` +
      `• आटा चक्की (Flour Mill)\n` +
      `• वस्त्र व हथकरघा (Textiles/Clothes)\n` +
      `• सिलाई व बुटीक (Tailoring & Boutique)\n` +
      `• बकरी व भेड़ पालन (Goat Farming)\n` +
      `• ब्यूटी पार्लर (Beauty Parlour)\n` +
      `• मोबाइल रिपेयर शॉप (Mobile Repair)\n` +
      `• ऑटो व ई-रिक्शा सर्विस आदि।\n\n` +
      `आप इनमें से किसी भी उपलब्ध व्यवसाय को चुन सकते हैं। आप किस व्यवसाय की रिपोर्ट बनवाना चाहते हैं?`;
  }

  if (lang === 'mr') {
    return `माफ करा, '${businessName}' चा सविस्तर प्रकल्प अहवाल सध्या आमच्या डेटाबेसमध्ये उपलब्ध नाही.\n\n` +
      `आमच्या वेबसाइटवर 20+ प्रमुख ग्रामीण व्यवसाय उपलब्ध आहेत (उदा. डेअरी, कुक्कुटपालन, किराणा, आटा चक्की, कापड/हातमाग, शेळीपालन इ.).\n\n` +
      `तुम्ही यापैकी कोणताही व्यवसाय निवडू शकता!`;
  }

  if (lang === 'ta') {
    return `மன்னிக்கவும், '${businessName}' பற்றிய திட்ட அறிக்கை தற்போது எங்கள் தளத்தில் இல்லை.\n\n` +
      `எங்கள் தளத்தில் பால் பண்ணை, கோழி வளர்ப்பு, மளிகைக் கடை, மாவு மில், ஜவுளி உள்ளிட்ட 20+ கிராமப்புற தொழில்கள் கிடைக்கின்றன. அவற்றில் ஒன்றைத் தேர்ந்தெடுக்கவும்!`;
  }

  if (lang === 'te') {
    return `క్షమించండి, '${businessName}' గురించిన ప్రాజెక్ట్ నివేదిక ప్రస్తుతం మా డేటాబేస్‌లో అందుబాటులో లేదు.\n\n` +
      `మా వద్ద పాడి పరిశ్రమ, పౌల్ట్రీ, కిరాణా స్టోర్, పిండి గిర్నీ, వస్త్ర వ్యాపారం వంటి 20+ గ్రామీణ వ్యాపారాలు ఉన్నాయి. మీరు వీటిలో దేనినైనా ఎంచుకోవచ్చు!`;
  }

  if (lang === 'bn') {
    return `দুঃখিত, '${businessName}'-এর বিশদ প্রকল্প প্রতিবেদন বর্তমানে আমাদের ডেটাবেসে উপলব্ধ নেই।\n\n` +
      `আমাদের ওয়েবসাইটে ডেইরি, পোল্ট্রি, মুদি দোকান, আটা কল, বস্ত্র ও তাঁত সহ ২০+ গ্রামীণ ব্যবসা উপলব্ধ রয়েছে। আপনি এগুলির মধ্যে যেকোনো একটি বেছে নিতে পারেন!`;
  }

  return `I apologize, but project reports and feasibility data for '${businessName}' are currently not available in our database.\n\n` +
    `Our platform supports 20+ verified rural micro-enterprises, including Dairy & Milk Products, Poultry Farming, Retail Kirana Store, Flour Mill, Textiles & Handloom, Tailoring, Goat Farming, Beauty Parlour, etc.\n\n` +
    `You can select any of these available businesses. Which enterprise would you like to explore?`;
}

// Extract numbers from text (supports '50k', '1 lakh', '1.5 lakh', '50,000', 'पचास हजार', etc.)
function extractNumber(text) {
  if (!text) return null;
  const clean = text.toLowerCase().replace(/,/g, '');

  // 1. Spoken Lakh / Lac match
  const lakhMatch = clean.match(/([\d.]+|[^\s]+)\s*(?:lakh|lac|लाख|লাখ)/);
  if (lakhMatch) {
    const valStr = lakhMatch[1];
    const num = parseFloat(valStr);
    if (!isNaN(num)) {
      return Math.round(num * 100000);
    }
    if (HINDI_NUMBER_WORDS[valStr]) {
      return Math.round(HINDI_NUMBER_WORDS[valStr] * 100000);
    }
  }

  // 2. Spoken Hazar / Thousand match
  const hazarMatch = clean.match(/([\d.]+|[^\s]+)\s*(?:hazar|hazaar|k|हज़ार|हजार|হাজার|వేల)/);
  if (hazarMatch) {
    const valStr = hazarMatch[1];
    const num = parseFloat(valStr);
    if (!isNaN(num)) {
      return Math.round(num * 1000);
    }
    if (HINDI_NUMBER_WORDS[valStr]) {
      return Math.round(HINDI_NUMBER_WORDS[valStr] * 1000);
    }
  }

  // 3. Direct numeric digits (e.g. 50000, 14000)
  const numMatch = clean.match(/\b\d{4,7}\b/);
  if (numMatch) {
    return parseInt(numMatch[0], 10);
  }

  // 4. Standalone spoken Hindi number in the context of capital
  for (const [word, val] of Object.entries(HINDI_NUMBER_WORDS)) {
    if (clean.includes(word) && val >= 10) {
      return val * 1000;
    }
  }

  return null;
}

// Extract all entities simultaneously from any sentence or fragment
function extractAllEntities(text, currentForm = {}) {
  if (!text) return {};
  const t = text.toLowerCase();
  const entities = {};

  // 1. Business match
  const bBiz = findBusinessMatch(text);
  if (bBiz) {
    entities.business_category = bBiz;
  }

  // 2. State match
  for (const [stateName, aliases] of Object.entries(STATE_ALIASES)) {
    for (const alias of aliases) {
      if (t.includes(alias.toLowerCase())) {
        entities.state = stateName;
        break;
      }
    }
    if (entities.state) break;
  }

  // 3. District match (and auto-deduce state if not set!)
  for (const [s, districts] of Object.entries(LOCATIONS)) {
    for (const d of Object.keys(districts)) {
      const aliases = DISTRICT_ALIASES[d] || [d.toLowerCase()];
      for (const alias of aliases) {
        if (t.includes(alias.toLowerCase())) {
          entities.district = d;
          if (!entities.state) {
            entities.state = s;
          }
          break;
        }
      }
      if (entities.district) break;
    }
    if (entities.district) break;
  }

  // 4. Block and Village match
  const searchState = entities.state || currentForm.state;
  const searchDist = entities.district || currentForm.district;
  const statesToSearch = searchState && LOCATIONS[searchState] ? [searchState] : Object.keys(LOCATIONS);

  for (const s of statesToSearch) {
    const districts = searchDist && LOCATIONS[s]?.[searchDist] ? [searchDist] : Object.keys(LOCATIONS[s] || {});
    for (const d of districts) {
      const blocks = Object.keys(LOCATIONS[s][d] || {});
      for (const b of blocks) {
        if (t.includes(b.toLowerCase())) {
          entities.block = b;
          if (!entities.district) entities.district = d;
          if (!entities.state) entities.state = s;
          break;
        }
        const villages = LOCATIONS[s][d][b] || [];
        for (const v of villages) {
          if (t.includes(v.toLowerCase())) {
            entities.village = v;
            entities.block = b;
            if (!entities.district) entities.district = d;
            if (!entities.state) entities.state = s;
            break;
          }
        }
        if (entities.block || entities.village) break;
      }
      if (entities.block || entities.village) break;
    }
    if (entities.block || entities.village) break;
  }

  // 5. Margin Capital match
  const cap = extractNumber(text);
  if (cap && cap >= 5000) {
    entities.margin_capital = cap;
  }

  // 6. Repayment match
  if (t.includes('month') || t.includes('मासिक') || t.includes('mahina') || t.includes('महीना') || t.includes('हर महीने') || t.includes('प्रतिमाह')) {
    entities.repayment_frequency = 'monthly';
  } else if (t.includes('quarter') || t.includes('त्रैमासिक') || t.includes('तीन महीने') || t.includes('3 महीने') || t.includes('teen mahine')) {
    entities.repayment_frequency = 'quarterly';
  }

  return entities;
}

// Find next missing step in the form intake sequence
function getNextMissingStep(formState) {
  if (!formState.state) return 'state';
  if (!formState.district) return 'district';
  if (!formState.block && !formState.village) return 'block_village';
  if (!formState.business_category) return 'business';
  if (!formState.margin_capital) return 'capital';
  return 'ready';
}

// Helper: State display options
function getStateOptions(lang = 'en') {
  if (lang === 'hi') {
    return ['महाराष्ट्र (Maharashtra)', 'उत्तर प्रदेश (UP)', 'गुजरात (Gujarat)', 'बिहार (Bihar)', 'कर्नाटक (Karnataka)', 'तमिलनाडु (TN)', 'पश्चिम बंगाल', 'तेलंगाना'];
  }
  if (lang === 'mr') {
    return ['महाराष्ट्र (Maharashtra)', 'गुजरात (Gujarat)', 'कर्नाटक (Karnataka)', 'उत्तर प्रदेश', 'बिहार', 'तेलंगाना'];
  }
  return ['Maharashtra', 'Uttar Pradesh', 'Gujarat', 'Bihar', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana'];
}

// Helper: District display options
function getDistrictOptions(stateName, lang = 'en') {
  if (!stateName || !LOCATIONS[stateName]) return [];
  const list = Object.keys(LOCATIONS[stateName]);
  if (lang === 'hi') {
    return list.map(d => {
      const hiAlias = (DISTRICT_ALIASES[d] && DISTRICT_ALIASES[d].find(a => /[^\u0000-\u007F]/.test(a))) || d;
      return `${hiAlias} (${d})`;
    });
  }
  return list;
}

// Helper: Block display options
function getBlockOptions(stateName, districtName) {
  if (!stateName || !districtName || !LOCATIONS[stateName]?.[districtName]) return ['Main Block'];
  const list = Object.keys(LOCATIONS[stateName][districtName]);
  return list.length > 0 ? list : ['Main Block'];
}

// Dynamically generate business advice based on database CATEGORY_PROFILE & calculator
function generateDynamicBusinessAdvice(category, lang = 'en') {
  const profile = getProfile(category);
  const supply = getSupply(category);

  const netMarginPct = Math.round((1 - profile.raw - profile.labor - profile.opex - (profile.other || 0.04)) * 100);
  const rawList = supply.raw && supply.raw.length > 0 ? supply.raw.map(r => r.item).slice(0, 3).join(', ') : 'आवश्यक कच्चा माल';
  const machineryList = supply.machinery && supply.machinery.length > 0 ? supply.machinery.map(m => m.item).slice(0, 2).join(', ') : 'आवश्यक मशीनरी';
  const demandRating = `${profile.demand}/5`;

  if (lang === 'hi') {
    return `हमारे डेटाबेस और सरकारी नियमों के अनुसार '${category}' का विवरण:\n\n` +
      `• लाभ मार्जिन (Net Margin): लगभग ${netMarginPct}%\n` +
      `• बाज़ार मांग (Demand Rating): ${demandRating} (स्थानीय मांग बहुत अच्छी है)\n` +
      `• मुख्य कच्चा माल: ${rawList}\n` +
      `• आवश्यक उपकरण/मशीनरी: ${machineryList}\n` +
      `• सरकारी ऋण सहायता: केवल 10% अपनी पूँजी पर 90% रियायती ऋण (NSFDC / Mudra / PMEGP के तहत 6.5% से 8% ब्याज दर पर)\n\n` +
      `क्या आप इसके लिए अपना क्षेत्र (राज्य/ज़िला/गाँव) और बजट बताकर पूरी रिपोर्ट बनवाना चाहते हैं?`;
  }

  if (lang === 'mr') {
    return `आमच्या डेटाबेसनुसार '${category}' व्यवसायाची माहिती:\n\n` +
      `• निव्वळ नफा मार्जिन (Net Margin): साधारणपणे ${netMarginPct}%\n` +
      `• बाजार मागणी (Demand Rating): ${demandRating}\n` +
      `• मुख्य कच्चा माल: ${rawList}\n` +
      `• आवश्यक उपकरणे/यंत्रसामग्री: ${machineryList}\n` +
      `• शासकीय कर्ज सहाय्य: 10% स्वतःचे भांडवल गुंतवून 90% सवलतीचे कर्ज (6.5% ते 8% व्याज दर)\n\n` +
      `या व्यवसायासाठी तुम्ही तुमचा परिसर व बजेट सांगून संपूर्ण अहवाल तयार करू इच्छिता का?`;
  }

  return `Here are the verified advisory details for '${category}' from our database:\n\n` +
    `• Net Profit Margin: ~${netMarginPct}%\n` +
    `• Market Demand: ${demandRating} (Strong rural potential)\n` +
    `• Key Raw Materials: ${rawList}\n` +
    `• Key Machinery: ${machineryList}\n` +
    `• Government Concessional Loan: 90% loan on 10% your margin capital (6.5% to 8.0% interest p.a.)\n\n` +
    `Would you like to generate a complete feasibility report? Tell me your location (State/District/Village) and budget!`;
}

// Dynamically list all available businesses from the database
function listAllBusinesses(lang = 'en') {
  const allCategories = Object.keys(CATEGORY_PROFILE);
  const list = allCategories.map((c, i) => `${i + 1}. ${c}`).join('\n');

  if (lang === 'hi') {
    return `हमारी वेबसाइट पर उपलब्ध सभी व्यवसाय श्रेणियां:\n\n${list}\n\nआप इनमें से किसी भी व्यवसाय का नाम बोलकर उसकी जानकारी ले सकते हैं या अपनी रिपोर्ट बनवा सकते हैं!`;
  }
  return `All business categories currently available on our platform:\n\n${list}\n\nTell me which one you want to start, and I will gather your details to generate your advisory report!`;
}

// Dynamic Government Schemes advice from calculator.js
function getGovernmentSchemesAdvice(lang = 'en') {
  const sampleFin = { project_cost: 500000, margin_capital: 50000, approved_loan: 450000 };
  const schemes = governmentSchemes(sampleFin, { state: 'Maharashtra' });

  if (lang === 'hi') {
    let txt = "हमारी वेबसाइट पर समर्थित प्रमुख सरकारी रियायती ऋण योजनाएं:\n\n";
    schemes.forEach((s) => {
      txt += `• ${s.name} (${s.agency})\n  ब्याज: ${s.interest_range} | अधिकतम ऋण: ${s.max_loan}\n  सब्सिडी / सुविधा: ${s.subsidy}\n  पात्रता: ${s.eligibility}\n\n`;
    });
    txt += "ग्रामीण उद्योग इन सभी योजनाओं के लिए बैंक-स्वीकृत प्रोजेक्ट रिपोर्ट तैयार करता है। क्या आप अपनी रिपोर्ट बनवाना चाहते हैं?";
    return txt;
  }

  let txt = "Key government concessional loan schemes available in our system:\n\n";
  schemes.forEach((s) => {
    txt += `• ${s.name} (${s.agency})\n  Interest: ${s.interest_range} | Max Loan: ${s.max_loan}\n  Benefit: ${s.subsidy}\n  Eligibility: ${s.eligibility}\n\n`;
  });
  txt += "Grameen Udyog generates institutional project reports compliant with these schemes. Would you like to generate your report?";
  return txt;
}

// Required documents advice
function getRequiredDocumentsAdvice(lang = 'en') {
  if (lang === 'hi') {
    return "सरकारी रियायती लोन के लिए आवश्यक दस्तावेज़:\n\n" +
      "1. आधार कार्ड और पैन कार्ड (पहचान व पते का प्रमाण)\n" +
      "2. बैंक पासबुक (पिछले 6 महीने का लेनदेन स्टेटमेंट)\n" +
      "3. निवास प्रमाण पत्र / ग्राम पंचायत का प्रमाणपत्र\n" +
      "4. जाति प्रमाण पत्र (NSFDC / NBCFDC / NSKFDC योजनाओं में विशेष ब्याज छूट के लिए)\n" +
      "5. ग्रामीण उद्योग फीजिबिलिटी प्रोजेक्ट रिपोर्ट (जो आप यहाँ 1 मिनट में तैयार करके PDF में डाउनलोड कर सकते हैं)\n\n" +
      "क्या आप अपनी प्रोजेक्ट रिपोर्ट तैयार करवाना चाहते हैं?";
  }
  return "Required documents for concessional micro-loans:\n\n" +
    "1. Aadhaar Card & PAN Card\n" +
    "2. Bank Passbook (last 6 months statement)\n" +
    "3. Residence Proof / Gram Panchayat Certificate\n" +
    "4. Caste Certificate (for concessional subsidies under NSFDC / NBCFDC)\n" +
    "5. Grameen Udyog Feasibility Project Report (downloadable here)\n\n" +
    "Would you like me to guide you to create your project report?";
}

// Viability score advice
function getViabilityScoreAdvice(lang = 'en') {
  if (lang === 'hi') {
    return "वायेबिलिटी स्कोर (Viability Score) क्या होता है?\n\n" +
      "• यह 0 से 100 तक का एक वैज्ञानिक AI स्कोर है जो यह दर्शाता है कि आपके गाँव या ब्लॉक में वह व्यवसाय कितना सफल और लाभदायक होगा।\n" +
      "• इसका आकलन 4 मुख्य पैमानों पर होता है: स्थानीय बाज़ार मांग (Demand), कच्चा माल मिलने की दूरी, स्थानीय प्रतिस्पर्धा (Competition), और लाभ मार्जिन।\n" +
      "• 70 से अधिक स्कोर वाले व्यवसायों को बैंक प्राथमिकता से लोन स्वीकृत करते हैं।\n\n" +
      "क्या आप अपने गाँव और बजट के अनुसार अपने व्यवसाय का वायेबिलिटी स्कोर देखना चाहते हैं?";
  }
  if (lang === 'mr') {
    return "व्हायॅबिलिटी स्कोर (Viability Score) म्हणजे काय?\n\n" +
      "• हा 0 ते 100 दरम्यानचा एक AI स्कोअर आहे जो दर्शवतो की तुमच्या गावात किंवा तालुक्यात तो व्यवसाय किती यशस्वी होईल.\n" +
      "• स्थानिक बाजार मागणी, कच्चा माल उपलब्धता, स्पर्धा आणि नफा मार्जिन यांच्या विश्लेषणावरून हा ठरवला जातो.\n" +
      "• 70 पेक्षा जास्त स्कोअर असलेल्या व्यवसायांना बँका प्राधान्याने कर्ज मंजूर करतात.";
  }
  return "What is Viability Score?\n\n" +
    "• It is an AI-driven index (0 to 100) assessing how commercially viable your enterprise will be in your specific Gram Panchayat.\n" +
    "• Evaluates: Local customer demand, raw material accessibility, competitor density, and operating profit margins.\n" +
    "• Scores above 70 are institutional bank-grade, ensuring significantly higher loan approval rates.";
}

// Community map advice
function getCommunityMapAdvice(lang = 'en') {
  if (lang === 'hi') {
    return "ग्रामीण उद्योग Community Map क्या है?\n\n" +
      "• यह आपके ब्लॉक और ज़िले के स्थानीय सप्लायरों, मशीनरी विक्रेताओं और थोक बाज़ारों को दिखाता है।\n" +
      "• इससे ग्रामीण उद्यमियों को बिचौलियों (middlemen) के बिना सीधे उचित मूल्य पर कच्चा माल और उपकरण मिलते हैं।\n" +
      "• आप भी अपने क्षेत्र के किसी दुकानदार या सप्लायर को मैप पर जोड़कर +10 कंट्रीब्यूशन पॉइंट्स कमा सकते हैं!";
  }
  if (lang === 'mr') {
    return "ग्रामीण उद्योग Community Map काय आहे?\n\n" +
      "• हे तुमच्या तालुक्यातील स्थानिक पुरवठादार, यंत्रसामग्री विक्रेते आणि घाऊक बाजारपेठा दाखवते.\n" +
      "• यामुळे ग्रामीण उद्योजकांना थेट वाजवी दरात कच्चा माल मिळतो.\n" +
      "• तुम्ही नवीन सप्लायर जोडून +10 गुण मिळवू शकता!";
  }
  return "Grameen Udyog Community Map:\n\n" +
    "• Discovers verified hyper-local suppliers, raw material dealers, and machinery vendors within your block.\n" +
    "• Helps rural micro-enterprises procure supplies at wholesale rates without middlemen.\n" +
    "• You can also add local suppliers to the map and earn +10 contribution points!";
}

// Platform capabilities & database guide (addresses user prompt: 'तुम क्या कर सकते हो / वेबसाइट व डेटाबेस की जानकारी')
function getPlatformCapabilitiesAdvice(lang = 'en') {
  if (lang === 'hi') {
    return "मैं आपका ग्रामीण उद्योग AI आवाज़ सहायक हूँ! मैं आपकी इन सभी चीज़ों में पूरी मदद कर सकता हूँ:\n\n" +
      "1. व्यावसायिक सलाह (Business Advice): हमारी वेबसाइट के डेटाबेस में मौजूद 20+ ग्रामीण व्यवसायों (डेयरी, किराना, पोल्ट्री, आटा चक्की, सिलाई, आदि) की लागत, आवश्यक कच्चा माल, उपकरण और 20% से 35% तक के लाभ मार्जिन की जानकारी।\n\n" +
      "2. व्यावसायिक प्रोजेक्ट रिपोर्ट: आपके गाँव, ब्लॉक और बजट के आधार पर 1 मिनट में बैंक-मान्य फीजिबिलिटी रिपोर्ट तैयार करना।\n\n" +
      "3. सरकारी रियायती ऋण योजनाएं: PMEGP, Mudra, NSFDC, NBCFDC आदि में 90% तक रियायती लोन (6.5% - 8% ब्याज) और आवश्यक दस्तावेज़ों की जानकारी।\n\n" +
      "4. वेबसाइट फ़ीचर्स: Community Map (स्थानीय सप्लायर ढूंढना), वायेबिलिटी स्कोर (0-100), और बैंक मैनेजर को देने के लिए PDF रिपोर्ट डाउनलोड।\n\n" +
      "आप इनमें से किस विषय में जानकारी चाहते हैं या अपनी रिपोर्ट बनवाना चाहते हैं?";
  }
  if (lang === 'mr') {
    return "मी तुमचा ग्रामीण उद्योग AI आवाज सहाय्यक आहे! मी तुम्हाला खालील गोष्टींमध्ये मदत करू शकतो:\n\n" +
      "1. व्यवसाय सल्ला (Business Advice): 20+ ग्रामीण व्यवसायांची माहिती, कच्चा माल, उपकरणे आणि नफा.\n" +
      "2. प्रकल्प अहवाल: तुमच्या गाव आणि बजेटनुसार बँकेसाठी व्यवहार्यता अहवाल.\n" +
      "3. शासकीय कर्ज योजना: PMEGP, Mudra, NSFDC योजनांमध्ये 90% पर्यंत सवलतीचे कर्ज.\n" +
      "4. वेबसाइट वैशिष्ट्ये: कम्युनिटी सप्लायर मॅप, व्हायॅबिलिटी स्कोअर आणि PDF डाउनलोड.\n\n" +
      "तुम्हाला यापैकी कशाबद्दल माहिती हवी आहे?";
  }
  return "I am your Grameen Udyog AI Voice Sahayak! Here is everything I can help you with:\n\n" +
    "1. Business Advice: Financial metrics, required machinery, raw materials, and profit margins for 20+ rural enterprises in our database.\n\n" +
    "2. Feasibility Report: Generate bank-ready institutional project reports tailored to your Gram Panchayat and budget.\n\n" +
    "3. Concessional Loans: Information on PMEGP, Mudra, NSFDC schemes with up to 90% loan coverage and 6.5%-8% low interest rates.\n\n" +
    "4. Platform Features: Community Supplier Map, Viability Score analytics (0-100), and instant PDF report downloads.\n\n" +
    "Which of these would you like to explore or get started with?";
}

// Content Moderation: Check for prohibited, illegal, or inappropriate content
function checkContentModeration(text, lang = 'en') {
  if (!text) return null;
  const t = text.toLowerCase();

  const prohibitedKeywords = [
    // Sex work / adult entertainment / brothels
    'रंडी', 'रांड', 'वेश्या', 'वेश्यावृत्ति', 'जिस्मफरोशी', 'कोठा', 'randi', 'randikhana', 'randi khana',
    'veshya', 'prostitut', 'brothel', 'call girl', 'escort service', 'kotha', 'red light',
    'सेक्स', 'पोर्न', 'porn', 'erotic',
    // Illicit drugs & contraband
    'गांजा', 'चरस', 'अफीम', 'ड्रग्स', 'हेरोइन', 'स्मैक', 'ganja', 'charas', 'afeem', 'drugs',
    'heroin', 'smack', 'शराब तस्करी', 'smuggling', 'तस्करी', 'हवाला', 'hawala', 'सुपारी', 'supari',
    // Gambling & illegal betting
    'सट्टा', 'जुआ', 'सट्टेबाजी', 'matka', 'satta', 'gambling', 'betting',
    // Weapons & violent crime
    'कट्टा', 'तमंचा', 'हथियार', 'बम', 'बंदूक बेचना', 'katta', 'tamancha', 'illegal weapon',
    'अपहरण', 'फिरौती', 'लूट', 'kidnap', 'extortion',
    // Severe profanity / slurs
    'मादरचोद', 'बहनचोद', 'भोसड़ी', 'चूतिया', 'chutiya', 'bhenchod', 'madarchod', 'bhosd'
  ];

  const matched = prohibitedKeywords.some(kw => t.includes(kw));
  if (!matched) return null;

  if (lang === 'hi') {
    return "माफ़ कीजिए, मैं इस प्रकार की अनुचित, अवैध या वर्जित गतिविधियों के संबंध में कोई जानकारी या सहायता नहीं दे सकता।\n\n" +
      "मैं आपका ग्रामीण उद्योग AI सहायक हूँ। यदि आपको किसी वैध व्यवसाय (जैसे डेयरी, किराना, पोल्ट्री, आटा चक्की, सिलाई आदि), सरकारी रियायती ऋण योजनाओं (PMEGP, Mudra) या प्रोजेक्ट रिपोर्ट से संबंधित कोई जानकारी या सहायता चाहिए, तो आप बेझिझक मुझसे पूछ सकते हैं!";
  }

  if (lang === 'mr') {
    return "माफ करा, मी अशा प्रकारच्या अयोग्य, बेकायदेशीर किंवा प्रतिबंधित विषयांबद्दल माहिती देऊ शकत नाही.\n\n" +
      "मी तुमचा ग्रामीण उद्योग AI सहाय्यक आहे. तुम्हाला कोणत्याही कायदेशीर व्यवसायाबद्दल (उदा. डेअरी, किराणा, शेती, कुक्कुटपालन), शासकीय कर्ज योजना किंवा व्यवसाय अहवालाबद्दल माहिती हवी असल्यास मी नक्की मदत करू शकतो!";
  }

  if (lang === 'ta') {
    return "மன்னிக்கவும், இத்தகைய முறையற்ற அல்லது சட்டவிரோதமான நடவடிக்கைகள் குறித்து என்னால் தகவல் வழங்க முடியாது.\n\n" +
      "நான் உங்கள் கிராமீன் உத்யோக் AI உதவியாளர். பால் பண்ணை, மளிகை, கோழி வளர்ப்பு போன்ற முறையான தொழில்கள் அல்லது அரசு கடன் திட்டங்கள் குறித்து உங்களுக்கு ஏதேனும் சந்தேகம் இருந்தால், நான் உங்களுக்கு உதவ முடியும்!";
  }

  if (lang === 'te') {
    return "క్షమించండి, అటువంటి అనుచితమైన లేదా చట్టవిరుద్ధమైన కార్యకలాపాలపై నేను సమాచారం అందించలేను.\n\n" +
      "నేను మీ గ్రామీణ్ ఉద్యోగ్ AI సహాయకుడిని. పాడి పరిశ్రమ, కిరాణా, కోళ్ల పెంపకం వంటి చట్టబద్ధమైన వ్యాపారాలు లేదా ప్రభుత్వ రుణ పథకాల గురించి మీకు ఏవైనా సందేహాలు ఉంటే నేను ఖచ్చితంగా సహాయం చేయగలను!";
  }

  if (lang === 'bn') {
    return "দুঃখিত, আমি এই ধরনের অনুচিত বা নিষিদ্ধ কার্যক্রম সম্পর্কিত কোনো তথ্য প্রদান করতে পারি না।\n\n" +
      "আমি আপনার গ্রামীণ উদ্যোগ AI সহকারী। আপনি যদি কোনো বৈধ ব্যবসা (যেমন দুগ্ধ খামার, মুদি দোকান, পোল্ট্রি, আটা কল ইত্যাদি) বা সরকারি ঋণ প্রকল্প সম্পর্কে জানতে চান, তবে আমি আপনাকে সাহায্য করতে প্রস্তুত!";
  }

  return "I apologize, but I cannot provide information or assistance regarding inappropriate, illicit, or prohibited activities.\n\n" +
    "I am your Grameen Udyog AI Voice Sahayak. If you have questions regarding legitimate rural businesses (such as Dairy, Kirana Store, Poultry Farming, Flour Mill), government concessional loan schemes (PMEGP, Mudra), or feasibility reports, I would be pleased to assist you!";
}

// Check if the user's message is related to rural business, loans, schemes, reports, or platform features
function isMessageRelatedToPlatform(text, formState = {}, extracted = {}) {
  if (!text) return true;
  const t = text.toLowerCase().trim();

  // 1. If any valid entity was extracted
  if (extracted.state || extracted.district || extracted.block || extracted.village ||
      extracted.business_category || extracted.margin_capital || extracted.repayment_frequency) {
    return true;
  }

  // 2. If user is currently prompted for block/village name and speaks or types a name
  if (formState.step === 'block_village' && t.length >= 2) {
    return true;
  }

  // 3. Reset / Restart keywords
  if (t.includes('reset') || t.includes('restart') || t.includes('shuru se') || t.includes('फिर से') || t.includes('दोबारा') || t.includes('नया फॉर्म')) {
    return true;
  }

  // 4. Greetings and conversational pleasantries
  const greetings = [
    'hello', 'hi', 'hey', 'namaste', 'नमस्ते', 'प्रणाम', 'राम राम', 'राम-राम',
    'good morning', 'good evening', 'गुड मॉर्निंग', 'sat sri akal', 'सलाम', 'adaab'
  ];
  if (greetings.some(g => t === g || t.startsWith(g + ' ') || t.endsWith(' ' + g))) {
    return true;
  }

  // 5. In-Scope Domain Keywords (Business, Loan, Schemes, Reports, Forms, Platform)
  const inScopeKeywords = [
    // Business & Enterprises
    'business', 'बिजनेस', 'बिज़नेस', 'व्यापार', 'व्यवसाय', 'उद्यम', 'उद्योग', 'धंधा', 'rozgar', 'रोजगार',
    'काम', 'दुकान', 'store', 'shop', 'kholna', 'खोलना', 'shuru', 'शुरू', 'startup', 'स्टार्टअप', 'enterprise',
    // Specific business categories & supplies
    'dairy', 'डेयरी', 'दूध', 'milk', 'गाय', 'भैंस', 'पशुपालन', 'cow', 'buffalo',
    'poultry', 'पोल्ट्री', 'मुर्गी', 'chicken', 'अंडा', 'egg',
    'kirana', 'किराना', 'राशन', 'grocery', 'जनरल स्टोर',
    'chakki', 'चक्की', 'आटा', 'flour', 'mill',
    'tailor', 'टेलर', 'दर्जी', 'सिलाई', 'silai', 'boutique', 'बुटीक', 'kapda', 'कपड़ा', 'handloom', 'हथकरघा',
    'goat', 'बकरी', 'भेड़', 'sheep', 'bakri',
    'beauty', 'ब्यूटी', 'parlour', 'पार्लर',
    'mobile', 'मोबाइल', 'recharge', 'रिचार्ज', 'repair', 'रिपेयर',
    'rickshaw', 'रिक्शा', 'auto', 'ऑटो',
    'bakery', 'बेकरी', 'cake', 'केक',
    'tea', 'चाय', 'chai', 'नाश्ता', 'snack',
    'sabzi', 'सब्जी', 'फल', 'fruit', 'vegetable',
    'kheti', 'खेती', 'agri', 'seed', 'बीज', 'fertilizer', 'खाद', 'उर्वरक',
    'fish', 'मछली', 'fisheries', 'मत्स्य',
    'handicraft', 'हस्तशिल्प', 'craft',
    'honey', 'शहद', 'madhumakkhi', 'मधुमक्खी', 'bee',
    'papad', 'पापड़', 'pickle', 'अचार', 'achar',
    'photocopy', 'फोटोकॉपी', 'csc', 'xerox',
    'bike', 'बाइक', 'motorcycle', 'मोटरसाइकिल', 'garage', 'गैराज',
    // Loans, Schemes & Finance
    'loan', 'लोन', 'कर्ज', 'ऋण', 'scheme', 'योजना', 'subsidy', 'सब्सिडी', 'subsidi',
    'interest', 'ब्याज', 'dar', 'दर', 'rate', 'pmegp', 'mudra', 'मुद्रा', 'nsfdc', 'nbcfdc',
    'nskfdc', 'cgtmse', 'bank', 'बैंक', 'finance', 'फाइनेंस', 'kist', 'किश्त', 'किस्त', 'emi',
    'paisa', 'पैसा', 'money', 'capital', 'पूँजी', 'पूंजी', 'budget', 'बजट', 'invest', 'निवेश',
    'margin', 'लागत', 'cost', 'profit', 'मुनाफा', 'लाभ', 'margin', 'कमाई', 'kamai',
    'repay', 'repayment', 'chukan', 'चुकाना', 'monthly', 'मासिक', 'quarterly', 'त्रैमासिक',
    // Documents & Eligibility
    'document', 'कागज़', 'कागज', 'दस्तावेज़', 'दस्तावेज', 'eligibility', 'पात्रता',
    'aadhaar', 'आधार', 'pan', 'passbook', 'पासबुक', 'praman', 'प्रमाण', 'shart', 'शर्त',
    // Reports & Platform features
    'report', 'रिपोर्ट', 'form', 'फॉर्म', 'feasibility', 'फीजिबिलिटी', 'project report', 'प्रोजेक्ट',
    'summary', 'समरी', 'apply', 'viability', 'वायेबिलिटी', 'score', 'स्कोर',
    'community', 'कम्युनिटी', 'supplier', 'सप्लायर', 'vendor', 'वेंडर', 'map', 'मैप',
    'download', 'डाउनलोड', 'pdf', 'पीडीएफ',
    // Platform guidance
    'feature', 'features', 'फ़ीचर', 'फीचर', 'suvidha', 'सुविधाएं', 'सुविधा',
    'database', 'डेटाबेस', 'website', 'वेबसाइट', 'sahayak', 'सहायक', 'app', 'portal', 'पोर्टल',
    'help', 'मदद', 'सहायता', 'guide', 'kya kar sakte', 'kya karte ho', 'kya kaam'
  ];

  if (inScopeKeywords.some(kw => t.includes(kw))) {
    return true;
  }

  // 6. Generic conversational / affirmation alone
  const pureConversational = [
    'हाँ', 'हां', 'yes', 'ok', 'okay', 'sure', 'ठीक है', 'अच्छा', 'बिल्कुल',
    'आगे बताओ', 'आगे बढ़ो', 'जारी रखें', 'जारी रखो', 'जारी', 'continue',
    'धन्यवाद', 'शुक्रिया', 'thank you', 'thanks'
  ];
  if (pureConversational.some(w => t === w || t.startsWith(w + ' ') || t.endsWith(' ' + w))) {
    return true;
  }

  // 7. Check if business category match exists
  if (findBusinessMatch(text)) {
    return true;
  }

  // If none matched, the message is unrelated / outside platform scope
  return false;
}

// Generate out-of-scope guidance response
function getOutOfScopeResponse(lang = 'en', formState = {}) {
  const inActiveFlow = formState.step && formState.step !== 'idle' && formState.step !== 'ready';
  const isReady = formState.step === 'ready';

  let text = "";
  if (lang === 'hi') {
    text = "माफ़ कीजिए, यह जानकारी हमारी वेबसाइट के दायरे (विषय) से बाहर है, इसलिए मैं इसके बारे में नहीं बता सकता।\n\n" +
      "मैं आपका ग्रामीण उद्योग AI आवाज़ सहायक हूँ। यदि आपको ग्रामीण व्यवसाय (Business), सरकारी रियायती ऋण (Loan), सरकारी योजनाओं (Schemes), प्रोजेक्ट रिपोर्ट या हमारी वेबसाइट के फ़ीचर्स से जुड़ा कोई भी सवाल या संदेह है, तो आप बेझिझक मुझसे पूछ सकते हैं—मैं आपकी पूरी सहायता करूँगा!";
  } else if (lang === 'mr') {
    text = "माफ करा, ही माहिती आमच्या वेबसाइटच्या विषयाबाहेर आहे, त्यामुळे मी याबद्दल माहिती देऊ शकत नाही.\n\n" +
      "मी तुमचा ग्रामीण उद्योग AI आवाज सहाय्यक आहे. तुम्हाला ग्रामीण व्यवसाय (Business), शासकीय सवलतीचे कर्ज (Loan), सरकारी योजना (Schemes) किंवा प्रकल्प अहवालाबद्दल काहीही प्रश्न किंवा समस्या असल्यास मी तुम्हाला नक्की मदत करू शकतो!";
  } else if (lang === 'ta') {
    text = "மன்னிக்கவும், இந்த தகவல் எங்கள் தளத்தின் வரம்பிற்கு அப்பாற்பட்டது, எனவே இது குறித்து என்னால் தகவல் வழங்க முடியாது.\n\n" +
      "நான் உங்கள் கிராமீன் உத்யோக் AI குரல் உதவியாளர். கிராமப்புற தொழில்கள், அரசு மானியக் கடன்கள், திட்டங்கள் அல்லது திட்ட அறிக்கைகள் தொடர்பான ஏதேனும் சந்தேகங்கள் இருந்தால், நான் உங்களுக்கு உதவ முடியும்!";
  } else if (lang === 'te') {
    text = "క్షమించండి, ఈ సమాచారం మా వెబ్‌సైట్ పరిధికి వెలుపల ఉంది, కాబట్టి నేను దీనిపై సమాచారం అందించలేను.\n\n" +
      "నేను మీ గ్రామీణ్ ఉద్యోగ్ AI వాయిస్ అసిస్టెంట్‌ని. మీకు గ్రామీణ వ్యాపారాలు, ప్రభుత్వ రాయితీ రుణాలు, పథకాలు లేదా ప్రాజెక్ట్ నివేదికకు సంబంధించి ఏవైనా సందేహాలు లేదా సమస్యలు ఉంటే, నేను ఖచ్చితంగా సహాయం చేయగలను!";
  } else if (lang === 'bn') {
    text = "দুঃখিত, এই তথ্যটি আমাদের প্ল্যাটফর্মের পরিধির বাইরে, তাই আমি এ সম্পর্কে কোনো তথ্য দিতে পারছি না।\n\n" +
      "আমি আপনার গ্রামীণ উদ্যোগ AI ভয়েস সহকারী। গ্রামীণ ব্যবসা, সরকারি ঋণ প্রকল্প, স্কিম বা প্রকল্প প্রতিবেদন সম্পর্কিত যেকোনো প্রশ্ন বা সমস্যা থাকলে আমি আপনাকে সম্পূর্ণ সহায়তা করতে প্রস্তুত!";
  } else {
    text = "I apologize, but this information is outside the scope of our platform, so I cannot provide details on this topic.\n\n" +
      "I am your Grameen Udyog AI Voice Sahayak. If you have any questions, problems, or doubts regarding rural businesses, government concessional loans, schemes (PMEGP, Mudra), or project feasibility reports, I would be delighted to assist you!";
  }

  let options = [];
  if (inActiveFlow) {
    text += lang === 'hi'
      ? "\n\n💡 (आपकी रिपोर्ट की जानकारी सुरक्षित है। जब आप चाहें, 'अपनी रिपोर्ट जारी रखें' पर क्लिक करके इसे पूरा कर सकते हैं।)"
      : "\n\n💡 (Your report draft is saved. Whenever you wish, click 'Continue Report' to complete it.)";
    options = [
      lang === 'hi' ? '📝 अपनी रिपोर्ट जारी रखें' : '📝 Continue Report',
      lang === 'hi' ? '💼 सभी व्यवसाय देखें' : '💼 View All Businesses',
      lang === 'hi' ? '🏛️ सरकारी ऋण योजनाएं' : '🏛️ Government Loan Schemes',
      lang === 'hi' ? '📄 आवश्यक दस्तावेज़' : '📄 Required Documents',
    ];
  } else if (isReady) {
    text += lang === 'hi'
      ? "\n\n💡 (आपकी व्यावसायिक रिपोर्ट पहले से तैयार है। आप नीचे दिए गए बटन से इसे देख या फ़ॉर्म में भर सकते हैं।)"
      : "\n\n💡 (Your advisory report is ready. You can apply it to the form below.)";
    options = [
      lang === 'hi' ? '📄 तैयार रिपोर्ट देखें' : '📄 View Ready Report',
      lang === 'hi' ? '💼 दूसरा व्यवसाय चुनें' : '💼 Pick Another Business',
      lang === 'hi' ? '💰 पूँजी (बजट) बदलें' : '💰 Change Capital',
    ];
  } else {
    options = [
      lang === 'hi' ? '📝 बिज़नेस रिपोर्ट बनवाएं' : '📝 Create Business Report',
      lang === 'hi' ? '💼 उपलब्ध सभी व्यवसाय देखें' : '💼 View All Available Businesses',
      lang === 'hi' ? '🏛️ सरकारी ऋण योजनाएं' : '🏛️ Government Loan Schemes',
      lang === 'hi' ? '📄 आवश्यक दस्तावेज़' : '📄 Required Documents',
    ];
  }

  return { reply: text, options };
}

// Main message handler
async function handleChatMessage(req, res) {
  try {
    const { message = '', language = 'en', state = {}, history = [] } = req.body || {};
    const lang = BOT_STRINGS[language] ? language : 'en';
    const s = BOT_STRINGS[lang];

    let formState = {
      step: state.step || 'idle',
      state: state.state || '',
      district: state.district || '',
      block: state.block || '',
      village: state.village || '',
      business_category: state.business_category || '',
      margin_capital: state.margin_capital || null,
      repayment_frequency: state.repayment_frequency || '',
    };

    const text = (message || '').trim();
    const t = text.toLowerCase();

    // 1. Content Moderation Filter (handles inappropriate / illicit inputs smartly)
    const moderationReply = checkContentModeration(text, lang);
    if (moderationReply) {
      return res.json({
        reply: moderationReply,
        speechText: moderationReply.replace(/[•\n]/g, ' '),
        formState, // Keeps collected parameters intact
        options: [
          lang === 'hi' ? '📝 वैध बिज़नेस रिपोर्ट बनवाएं' : '📝 Create Business Report',
          lang === 'hi' ? '💼 उपलब्ध सभी व्यवसाय देखें' : '💼 View All Businesses',
          lang === 'hi' ? '🏛️ सरकारी ऋण योजनाएं' : '🏛️ Government Loan Schemes',
          lang === 'hi' ? '📄 आवश्यक दस्तावेज़' : '📄 Required Documents',
        ],
        action: null,
      });
    }

    // 2. Check for Reset / Restart intent
    if (t.includes('reset') || t.includes('restart') || t.includes('shuru se') || t.includes('फिर से') || t.includes('दोबारा') || t.includes('नया फॉर्म')) {
      formState = {
        step: 'state',
        state: '', district: '', block: '', village: '',
        business_category: '', margin_capital: null, repayment_frequency: '',
      };
      return res.json({
        reply: s.askState,
        speechText: s.askState,
        formState,
        options: getStateOptions(lang),
        action: null,
      });
    }

    // 3. Analyze business intent, negation, and unsupported business requests
    const bizAnalysis = findBusinessMatchWithNegation(text);
    const unsupportedBiz = findUnsupportedBusiness(text);

    // 3A. Handle unsupported / unavailable business requests (e.g. Petrol pump, Hotel, Gym, Medical store)
    if (unsupportedBiz && !bizAnalysis.matched) {
      const unsupportedReply = getUnsupportedBusinessResponse(unsupportedBiz, lang);
      const inActiveFlow = formState.step && formState.step !== 'idle' && formState.step !== 'business';
      const options = [
        lang === 'hi' ? '🥛 डेयरी व दुग्ध उत्पाद' : '🥛 Dairy & Milk Products',
        lang === 'hi' ? '🐔 पोल्ट्री फार्मिंग' : '🐔 Poultry Farming',
        lang === 'hi' ? '🏪 किराना स्टोर' : '🏪 Retail Kirana Store',
        lang === 'hi' ? '🧵 वस्त्र व हथकरघा (कपड़े)' : '🧵 Textiles & Handloom',
        lang === 'hi' ? '🌾 आटा चक्की' : '🌾 Flour Mill',
        lang === 'hi' ? '✂️ सिलाई व बुटीक' : '✂️ Tailoring & Boutique',
      ];
      if (inActiveFlow) {
        options.unshift(lang === 'hi' ? '📝 अपनी रिपोर्ट जारी रखें' : '📝 Continue Report');
      }
      return res.json({
        reply: unsupportedReply,
        speechText: unsupportedReply.replace(/[•\n]/g, ' '),
        formState, // Preserves already collected parameters without corruption
        options,
        action: null,
      });
    }

    // 3B. Handle pure business negation without new business (e.g. "मुझे किराना स्टोर नहीं खोलना")
    if (!bizAnalysis.matched && bizAnalysis.negated) {
      formState.business_category = '';
      formState.step = 'business';
      const prompt = lang === 'hi'
        ? `ठीक है, हमने '${bizAnalysis.negated}' हटा दिया है। आप कौन सा दूसरा व्यापार या उद्यम शुरू करना चाहते हैं? बोलकर बताएं या नीचे से चुनें:`
        : `Understood, we have removed '${bizAnalysis.negated}'. Which other business would you like to explore or start? Please speak or choose below:`;
      return res.json({
        reply: prompt,
        speechText: prompt,
        formState,
        options: Object.keys(CATEGORY_PROFILE).slice(0, 6),
        action: null,
      });
    }

    // 3C. Global intent to pick another / new business (e.g. clicking "💼 दूसरा व्यवसाय चुनें" at any stage)
    const isExplicitNewBizIntent =
      t.includes('दूसरा व्यवसाय') || t.includes('दूसरा बिजनेस') || t.includes('दूसरी बि') ||
      t.includes('नए बि') || t.includes('नया बि') || t.includes('नई बि') ||
      t.includes('दूसरे बि') || t.includes('दूसरा काम') || t.includes('नए काम') ||
      t.includes('नया काम') || t.includes('new business') || t.includes('another business') ||
      t.includes('different business') || t.includes('new report') || t.includes('another report') ||
      t.includes('नए व्यापार') || t.includes('नया व्यापार') ||
      (t.includes('नया') && (t.includes('बिजनेस') || t.includes('बिज़नेस') || t.includes('रिपोर्ट'))) ||
      (t.includes('नए') && (t.includes('बिजनेस') || t.includes('बिज़नेस') || t.includes('रिपोर्ट')));

    if (isExplicitNewBizIntent && !bizAnalysis.matched) {
      formState.business_category = '';
      formState.step = 'business';
      const newBizPrompt = lang === 'hi'
        ? "बहुत बढ़िया! आप कौन से नए व्यवसाय के बारे में जानना या शुरू करना चाहते हैं? आप अपना पसंदीदा व्यापार बोलकर बता सकते हैं (जैसे डेयरी, पोल्ट्री, आटा चक्की, सिलाई, वस्त्र/कपड़े आदि) या नीचे दी गई सूची में से चुन सकते हैं:"
        : "Great! Which new business would you like to explore or start? Tell me your business idea or choose one below:";
      return res.json({
        reply: newBizPrompt,
        speechText: newBizPrompt,
        formState,
        options: Object.keys(CATEGORY_PROFILE).slice(0, 6),
        action: null,
      });
    }

    // 3D. Handle business shifting / switching (e.g. "भाई मुझे किराना नहीं खोलना मुझे कपड़े की दुकान खोलनी है")
    const isBusinessShift = bizAnalysis.matched && ((formState.business_category && formState.business_category !== bizAnalysis.matched) || !!bizAnalysis.negated);

    if (isBusinessShift) {
      formState.business_category = bizAnalysis.matched;
      const extractedShift = extractAllEntities(text, formState);
      if (extractedShift.state) formState.state = extractedShift.state;
      if (extractedShift.district) formState.district = extractedShift.district;
      if (extractedShift.block) formState.block = extractedShift.block;
      if (extractedShift.village) formState.village = extractedShift.village;
      if (extractedShift.margin_capital) formState.margin_capital = extractedShift.margin_capital;
      if (extractedShift.repayment_frequency) formState.repayment_frequency = extractedShift.repayment_frequency;

      const nextStep = getNextMissingStep(formState);
      formState.step = nextStep;

      const shiftPrefix = lang === 'hi'
        ? `बहुत बढ़िया! हमने आपका व्यवसाय बदलकर '${formState.business_category}' कर दिया है। `
        : `Great! We have updated your business to '${formState.business_category}'. `;

      if (nextStep === 'state') {
        const prompt = shiftPrefix + (lang === 'hi'
          ? "सबसे पहले बताएं कि आपका उद्यम किस राज्य (State) में स्थित है? बोलें या नीचे से चुनें:"
          : "Which State is your enterprise located in? Please speak or select below:");
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: getStateOptions(lang),
          action: null,
        });
      }

      if (nextStep === 'district') {
        const prompt = shiftPrefix + (lang === 'hi'
          ? `${formState.state} में आपका ज़िला (District) कौन सा है? कृपया बोलें या नीचे से चुनें:`
          : `Which District in ${formState.state}?`);
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: getDistrictOptions(formState.state, lang),
          action: null,
        });
      }

      if (nextStep === 'block_village') {
        const prompt = shiftPrefix + (lang === 'hi'
          ? `समझ गया! ज़िला ${formState.district} में आपका ब्लॉक और गाँव/ग्राम पंचायत का नाम क्या है? बोलकर बताएं या ब्लॉक चुनें:`
          : `Please tell your Block and Village in ${formState.district}:`);
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: getBlockOptions(formState.state, formState.district),
          action: null,
        });
      }

      if (nextStep === 'capital') {
        const prompt = shiftPrefix + (lang === 'hi'
          ? `आप '${formState.business_category}' के लिए अपनी तरफ से कितनी मार्जिन पूँजी (रुपये) लगा सकते हैं? (जैसे: ₹14,000, ₹50,000, ₹1,00,000)`
          : `How much margin capital can you invest for '${formState.business_category}'?`);
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: ['₹14,000', '₹50,000', '₹1,00,000', '₹2,00,000'],
          action: null,
        });
      }

      if (nextStep === 'repayment') {
        return res.json({
          reply: shiftPrefix + s.askRepayment,
          speechText: shiftPrefix + s.askRepayment,
          formState,
          options: ['Monthly (मासिक)', 'Quarterly (त्रैमासिक)'],
          action: null,
        });
      }

      if (nextStep === 'ready') {
        let fin = null;
        try {
          fin = computeScheme(formState.margin_capital, { frequency: formState.repayment_frequency || 'monthly' });
        } catch (e) {
          fin = { project_cost: formState.margin_capital * 10, approved_loan: formState.margin_capital * 9 };
        }

        const readyMsg = lang === 'hi'
          ? `बहुत खूब! हमने आपके लिए '${formState.business_category}' की रिपोर्ट तैयार कर दी है:\n• स्थान: ${formState.village || 'Gram Panchayat'}, ${formState.block || 'Main Block'}, ${formState.district}, ${formState.state}\n• व्यवसाय: ${formState.business_category}\n• आपकी पूँजी: ₹${Number(formState.margin_capital).toLocaleString('en-IN')}\n• अनुमानित कुल लागत: ₹${Number(fin.project_cost).toLocaleString('en-IN')}\n• अनुमानित सरकारी ऋण: ₹${Number(fin.approved_loan).toLocaleString('en-IN')}\n\nनीचे दिए गए बटन पर क्लिक करके इसे फ़ॉर्म में भरें और पूरी रिपोर्ट देखें!`
          : s.summaryReady
              .replace('{village}', formState.village || 'Gram Panchayat')
              .replace('{block}', formState.block || 'Main Block')
              .replace('{district}', formState.district)
              .replace('{state}', formState.state)
              .replace('{business}', formState.business_category)
              .replace('{margin}', Number(formState.margin_capital).toLocaleString('en-IN'))
              .replace('{cost}', Number(fin.project_cost).toLocaleString('en-IN'))
              .replace('{loan}', Number(fin.approved_loan).toLocaleString('en-IN'));

        return res.json({
          reply: readyMsg,
          speechText: readyMsg.replace(/[•\n]/g, ' '),
          formState,
          options: [
            lang === 'hi' ? '💰 पूँजी (बजट) बदलें' : '💰 Change Capital',
            lang === 'hi' ? '📍 स्थान बदलें' : '📍 Change Location',
            lang === 'hi' ? '💼 दूसरा व्यवसाय चुनें' : '💼 Pick Another Business',
          ],
          action: 'ready_to_apply',
          extractedData: formState,
        });
      }
    }

    // 4. Pre-extract all entities from incoming user utterance
    const extracted = extractAllEntities(text, formState);

    // Merge extracted entities into formState immediately so business_category is never lost!
    if (extracted.state) formState.state = extracted.state;
    if (extracted.district) formState.district = extracted.district;
    if (extracted.block) formState.block = extracted.block;
    if (extracted.village) formState.village = extracted.village;
    if (extracted.business_category) formState.business_category = extracted.business_category;
    if (extracted.margin_capital) formState.margin_capital = extracted.margin_capital;
    if (extracted.repayment_frequency) formState.repayment_frequency = extracted.repayment_frequency;

    // Ensure block and village fallbacks so step advances cleanly
    if (formState.block && !formState.village) formState.village = formState.block;
    if (formState.village && !formState.block) formState.block = 'Main Block';

    // 4. Domain Scope Filter (handles unrelated / off-topic queries outside platform scope)
    const isRelated = isMessageRelatedToPlatform(text, formState, extracted);
    if (!isRelated) {
      const outOfScope = getOutOfScopeResponse(lang, formState);
      return res.json({
        reply: outOfScope.reply,
        speechText: outOfScope.reply.replace(/[•\n]/g, ' '),
        formState, // Keeps collected parameters intact
        options: outOfScope.options,
        action: null,
      });
    }

    // 3. Multi-keyword intent classification
    const isNewBusinessIntent =
      t.includes('नए बि') || t.includes('नया बि') || t.includes('नई बि') ||
      t.includes('दूसरे बि') || t.includes('दूसरा बि') || t.includes('दूसरी बि') ||
      t.includes('अन्य बि') || t.includes('और बि') || t.includes('नए काम') ||
      t.includes('नया काम') || t.includes('दूसरा काम') || t.includes('new business') ||
      t.includes('another business') || t.includes('different business') ||
      t.includes('new report') || t.includes('another report') ||
      t.includes('नए व्यापार') || t.includes('नया व्यापार') ||
      (t.includes('नया') && (t.includes('काम') || t.includes('बिजनेस') || t.includes('बिज़नेस') || t.includes('रिपोर्ट'))) ||
      (t.includes('नए') && (t.includes('काम') || t.includes('बिजनेस') || t.includes('बिज़नेस') || t.includes('रिपोर्ट'))) ||
      (t.includes('नई') && (t.includes('रिपोर्ट') || t.includes('दुकान') || t.includes('योजना')));

    const isAffirmationOrViewReport =
      t.includes('हाँ') || t.includes('हां') || t.includes('yes') || t.includes('ha') ||
      t.includes('haan') || t.includes('sure') || t.includes('ok') || t.includes('okay') ||
      t.includes('ठीक है') || t.includes('बिलकुल') || t.includes('बिल्कुल') ||
      t.includes('देखनी है') || t.includes('दिखाओ') || t.includes('दिखाइए') ||
      t.includes('बना दो') || t.includes('बनाओ') || t.includes('बनाएं') ||
      t.includes('तैयार करो') || t.includes('रिपोर्ट देख') || t.includes('रिपोर्ट बना') ||
      t.includes('view report') || t.includes('show report') || t.includes('make report') ||
      t.includes('generate report') || t.includes('create report') || t.includes('proceed') ||
      t.includes('इसकी पूरी रिपोर्ट') || t.includes('रिपोर्ट चाहिए') ||
      t.includes('रिपोर्ट निकाल') || t.includes('रिपोर्ट दे');

    const isListQuery =
      t.includes('list') || t.includes('available') || t.includes('kaun kaun se') ||
      t.includes('कौन-कौन') || t.includes('कौन कौन') || t.includes('सारे बि') ||
      t.includes('सारे काम') || t.includes('सभी व्यवसाय') || t.includes('सभी बि') ||
      t.includes('सभी काम') || t.includes('कितने बि') || t.includes('all business');

    const isSchemeQuery =
      t.includes('scheme') || t.includes('योजना') || t.includes('loan') ||
      t.includes('लोन') || t.includes('कर्ज') || t.includes('ऋण') ||
      t.includes('subsidy') || t.includes('सब्सिडी') || t.includes('ब्याज') ||
      t.includes('interest') || t.includes('pmegp') || t.includes('mudra') ||
      t.includes('nsfdc') || t.includes('nbcfdc') || t.includes('nskfdc') ||
      t.includes('emi');

    const isDocQuery =
      t.includes('document') || t.includes('kagaz') || t.includes('कागज़') ||
      t.includes('कागज') || t.includes('दस्तावेज़') || t.includes('दस्तावेज') ||
      t.includes('eligibility') || t.includes('पात्रता') || t.includes('आधार') ||
      t.includes('aadhaar') || t.includes('pan') || t.includes('passbook');

    const isViabilityQuery =
      t.includes('viability') || t.includes('वायेबिलिटी') || t.includes('score') || t.includes('स्कोर');

    const isCommunityQuery =
      t.includes('community') || t.includes('कम्युनिटी') || t.includes('supplier') ||
      t.includes('सप्लायर') || t.includes('vendor') || t.includes('वेंडर') ||
      t.includes('point') || t.includes('पॉइंट') || (t.includes('map') && !t.includes('roadmap'));

    const isCapabilitiesQuery =
      t.includes('तुम क्या') || t.includes('क्या कर सकते') || t.includes('क्या क्या कर') ||
      t.includes('क्या मदद') || t.includes('मदद कर सकते') || t.includes('फीचर') ||
      t.includes('फ़ीचर') || t.includes('features') || t.includes('सुविधाएं') ||
      t.includes('डेटाबेस') || t.includes('database') || t.includes('website') ||
      t.includes('वेबसाइट') || t.includes('हेल्प') || t.includes('capabilities') ||
      t.includes('what can you do') || t.includes('how can you help');

    const isContinueReportIntent =
      t.includes('जारी') || t.includes('आगे बताओ') || t.includes('continue') ||
      t.includes('रिपोर्ट पूरी') || t.includes('रिपोर्ट पर चलो') || t.includes('आगे बढ़ो');

    const isRepaymentChange = t.includes('month') || t.includes('मासिक') || t.includes('mahina') || t.includes('quarter') || t.includes('त्रैमासिक');
    const isCapitalChange = !!extractNumber(text);

    // 4. USER AT READY STATE: New business inquiry, affirmation, or adjustment
    if (formState.step === 'ready') {
      // If user confirms or wants to see/review their ready report:
      if (isAffirmationOrViewReport) {
        let fin = null;
        try {
          fin = computeScheme(formState.margin_capital, { frequency: formState.repayment_frequency || 'monthly' });
        } catch (e) {
          fin = { project_cost: formState.margin_capital * 10, approved_loan: formState.margin_capital * 9 };
        }

        const summary = s.summaryReady
          .replace('{village}', formState.village || 'Gram Panchayat')
          .replace('{block}', formState.block || 'Main Block')
          .replace('{district}', formState.district)
          .replace('{state}', formState.state)
          .replace('{business}', formState.business_category)
          .replace('{margin}', Number(formState.margin_capital).toLocaleString('en-IN'))
          .replace('{cost}', Number(fin.project_cost).toLocaleString('en-IN'))
          .replace('{loan}', Number(fin.approved_loan).toLocaleString('en-IN'));

        return res.json({
          reply: summary,
          speechText: summary.replace(/[•\n]/g, ' '),
          formState,
          options: [
            lang === 'hi' ? '💰 पूँजी (बजट) बदलें' : '💰 Change Capital',
            lang === 'hi' ? '📍 स्थान बदलें' : '📍 Change Location',
            lang === 'hi' ? '💼 दूसरा व्यवसाय चुनें' : '💼 Pick Another Business',
          ],
          action: 'ready_to_apply',
          extractedData: formState,
        });
      }

      // If user explicitly asked for a new business:
      if (isNewBusinessIntent) {
        formState.business_category = '';
        formState.step = 'business';
        const newBizPrompt = lang === 'hi'
          ? "बहुत बढ़िया! आप कौन से नए व्यवसाय के बारे में जानना या शुरू करना चाहते हैं? आप अपना पसंदीदा व्यापार बोलकर बता सकते हैं (जैसे डेयरी, पोल्ट्री, आटा चक्की, सिलाई, आदि) या नीचे दी गई सूची में से चुन सकते हैं:"
          : "Great! Which new business would you like to explore or start? Tell me your business idea or choose one below:";
        return res.json({
          reply: newBizPrompt,
          speechText: newBizPrompt,
          formState,
          options: Object.keys(CATEGORY_PROFILE).slice(0, 6),
          action: null,
        });
      }

      // If user adjusted capital or repayment while at ready state:
      if (isCapitalChange || isRepaymentChange) {
        let fin = null;
        try {
          fin = computeScheme(formState.margin_capital, { frequency: formState.repayment_frequency || 'monthly' });
        } catch (e) {
          fin = { project_cost: formState.margin_capital * 10, approved_loan: formState.margin_capital * 9 };
        }

        const updatedMsg = lang === 'hi'
          ? `आपकी जानकारी अपडेट हो गई है! यहाँ आपकी संशोधित रिपोर्ट है:\n• स्थान: ${formState.village || 'Gram Panchayat'}, ${formState.block || 'Main Block'}, ${formState.district}, ${formState.state}\n• व्यवसाय: ${formState.business_category}\n• आपकी पूँजी: ₹${Number(formState.margin_capital).toLocaleString('en-IN')}\n• अनुमानित कुल लागत: ₹${Number(fin.project_cost).toLocaleString('en-IN')}\n• अनुमानित सरकारी ऋण: ₹${Number(fin.approved_loan).toLocaleString('en-IN')}\n\nनीचे दिए गए बटन पर क्लिक करके इसे फ़ॉर्म में भरें और पूरी रिपोर्ट देखें!`
          : s.summaryReady
              .replace('{village}', formState.village || 'Gram Panchayat')
              .replace('{block}', formState.block || 'Main Block')
              .replace('{district}', formState.district)
              .replace('{state}', formState.state)
              .replace('{business}', formState.business_category)
              .replace('{margin}', Number(formState.margin_capital).toLocaleString('en-IN'))
              .replace('{cost}', Number(fin.project_cost).toLocaleString('en-IN'))
              .replace('{loan}', Number(fin.approved_loan).toLocaleString('en-IN'));

        return res.json({
          reply: updatedMsg,
          speechText: updatedMsg.replace(/[•\n]/g, ' '),
          formState,
          options: [
            lang === 'hi' ? '💰 पूँजी (बजट) बदलें' : '💰 Change Capital',
            lang === 'hi' ? '📍 स्थान बदलें' : '📍 Change Location',
            lang === 'hi' ? '💼 दूसरा व्यवसाय चुनें' : '💼 Pick Another Business',
          ],
          action: 'ready_to_apply',
          extractedData: formState,
        });
      }

      // If user directly selected or spoke another business:
      if (extracted.business_category && extracted.business_category !== formState.business_category) {
        formState.business_category = extracted.business_category;
        let fin = null;
        try {
          fin = computeScheme(formState.margin_capital, { frequency: formState.repayment_frequency || 'monthly' });
        } catch (e) {
          fin = { project_cost: formState.margin_capital * 10, approved_loan: formState.margin_capital * 9 };
        }

        const newReportMsg = lang === 'hi'
          ? `बहुत खूब! हमने आपके लिए '${formState.business_category}' की रिपोर्ट तैयार कर दी है:\n• स्थान: ${formState.village || 'Gram Panchayat'}, ${formState.block || 'Main Block'}, ${formState.district}, ${formState.state}\n• व्यवसाय: ${formState.business_category}\n• आपकी पूँजी: ₹${Number(formState.margin_capital).toLocaleString('en-IN')}\n• अनुमानित कुल लागत: ₹${Number(fin.project_cost).toLocaleString('en-IN')}\n• अनुमानित सरकारी ऋण: ₹${Number(fin.approved_loan).toLocaleString('en-IN')}\n\nनीचे दिए गए बटन पर क्लिक करके इसे फ़ॉर्म में भरें और पूरी रिपोर्ट देखें!`
          : s.summaryReady
              .replace('{village}', formState.village || 'Gram Panchayat')
              .replace('{block}', formState.block || 'Main Block')
              .replace('{district}', formState.district)
              .replace('{state}', formState.state)
              .replace('{business}', formState.business_category)
              .replace('{margin}', Number(formState.margin_capital).toLocaleString('en-IN'))
              .replace('{cost}', Number(fin.project_cost).toLocaleString('en-IN'))
              .replace('{loan}', Number(fin.approved_loan).toLocaleString('en-IN'));

        return res.json({
          reply: newReportMsg,
          speechText: newReportMsg.replace(/[•\n]/g, ' '),
          formState,
          options: [
            lang === 'hi' ? '💰 पूँजी (बजट) बदलें' : '💰 Change Capital',
            lang === 'hi' ? '📍 स्थान बदलें' : '📍 Change Location',
            lang === 'hi' ? '💼 दूसरा व्यवसाय चुनें' : '💼 Pick Another Business',
          ],
          action: 'ready_to_apply',
          extractedData: formState,
        });
      }
    }

    // 5. AFFIRMATION / "SEE MY REPORT" INTENT (Fix for user saying: "हां भाई मुझे अपनी रिपोर्ट देखनी है")
    if (isAffirmationOrViewReport) {
      if (formState.business_category) {
        const nextStep = getNextMissingStep(formState);
        formState.step = nextStep;

        // If all 6 fields are already present (location, capital, repayment, business), produce the ready report immediately!
        if (nextStep === 'ready') {
          let fin = null;
          try {
            fin = computeScheme(formState.margin_capital, { frequency: formState.repayment_frequency || 'monthly' });
          } catch (e) {
            fin = { project_cost: formState.margin_capital * 10, approved_loan: formState.margin_capital * 9 };
          }

          const summary = s.summaryReady
            .replace('{village}', formState.village || 'Gram Panchayat')
            .replace('{block}', formState.block || 'Main Block')
            .replace('{district}', formState.district)
            .replace('{state}', formState.state)
            .replace('{business}', formState.business_category)
            .replace('{margin}', Number(formState.margin_capital).toLocaleString('en-IN'))
            .replace('{cost}', Number(fin.project_cost).toLocaleString('en-IN'))
            .replace('{loan}', Number(fin.approved_loan).toLocaleString('en-IN'));

          return res.json({
            reply: summary,
            speechText: summary.replace(/[•\n]/g, ' '),
            formState,
            options: [
              lang === 'hi' ? '💰 पूँजी (बजट) बदलें' : '💰 Change Capital',
              lang === 'hi' ? '📍 स्थान बदलें' : '📍 Change Location',
              lang === 'hi' ? '💼 दूसरा व्यवसाय चुनें' : '💼 Pick Another Business',
            ],
            action: 'ready_to_apply',
            extractedData: formState,
          });
        }

        // If capital is missing, ask capital for this business
        if (nextStep === 'capital') {
          const prompt = lang === 'hi'
            ? `बहुत बढ़िया! '${formState.business_category}' के लिए आप अपनी तरफ से कितनी मार्जिन पूँजी (रुपये) लगा सकते हैं? (जैसे: ₹14,000, ₹50,000, ₹1,00,000)`
            : `Great! How much margin capital can you invest for '${formState.business_category}'?`;
          return res.json({
            reply: prompt,
            speechText: prompt,
            formState,
            options: ['₹14,000', '₹50,000', '₹1,00,000', '₹2,00,000'],
            action: null,
          });
        }

        // If location is missing, ask location
        if (nextStep === 'state') {
          const prompt = lang === 'hi'
            ? `बहुत बढ़िया! '${formState.business_category}' के लिए रिपोर्ट तैयार करते हैं। आपका उद्यम किस राज्य (State) में स्थित है?`
            : `Great! Which State is your '${formState.business_category}' located in?`;
          return res.json({
            reply: prompt,
            speechText: prompt,
            formState,
            options: getStateOptions(lang),
            action: null,
          });
        }
      } else {
        // Business category was not selected yet
        formState.step = 'business';
        const prompt = lang === 'hi'
          ? "आप किस व्यापार या उद्यम की रिपोर्ट देखना या बनाना चाहते हैं? कृपया नाम बोलकर बताएं या नीचे से चुनें:"
          : "Which business report would you like to view or generate? Please speak or choose below:";
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: Object.keys(CATEGORY_PROFILE).slice(0, 6),
          action: null,
        });
      }
    }

    // 6. BUSINESS SELECTION OR THEORETICAL ADVICE
    const matchedCategory = extracted.business_category || findBusinessMatch(text);
    if (matchedCategory) {
      formState.business_category = matchedCategory;

      // Check if user specifically asked a theoretical question about the business (e.g. "डेयरी में कितना मुनाफा है?", "पोल्ट्री के बारे में बताओ")
      const isTheoreticalQuestion =
        t.includes('मुनाफा') || t.includes('लाभ') || t.includes('मार्जिन') ||
        t.includes('मशीन') || t.includes('कच्चा माल') || t.includes('लागत') ||
        t.includes('के बारे में') || t.includes('क्या होता') || t.includes('कैसा रहेगा') ||
        t.includes('profit') || t.includes('margin') || t.includes('machinery') ||
        t.includes('about') || t.includes('raw material');

      // If user is just asking theoretical question about business metrics:
      if (isTheoreticalQuestion) {
        const advice = generateDynamicBusinessAdvice(matchedCategory, lang);
        return res.json({
          reply: advice,
          speechText: advice.replace(/[•\n]/g, ' '),
          formState,
          options: [
            lang === 'hi' ? '📝 हां, इसकी पूरी रिपोर्ट बनाएं' : '📝 Yes, create full report',
            lang === 'hi' ? '🏛️ सरकारी ऋण योजनाएं' : '🏛️ Government Loan Schemes',
            lang === 'hi' ? '📄 आवश्यक दस्तावेज़' : '📄 Required Documents',
          ],
          action: null,
        });
      }

      // Otherwise, the user selected / spoke this business to proceed with report!
      const nextStep = getNextMissingStep(formState);
      formState.step = nextStep;

      // If all other fields (location and capital) already exist in formState, produce the ready report!
      if (nextStep === 'ready') {
        let fin = null;
        try {
          fin = computeScheme(formState.margin_capital, { frequency: formState.repayment_frequency || 'monthly' });
        } catch (e) {
          fin = { project_cost: formState.margin_capital * 10, approved_loan: formState.margin_capital * 9 };
        }

        const summary = s.summaryReady
          .replace('{village}', formState.village || 'Gram Panchayat')
          .replace('{block}', formState.block || 'Main Block')
          .replace('{district}', formState.district)
          .replace('{state}', formState.state)
          .replace('{business}', formState.business_category)
          .replace('{margin}', Number(formState.margin_capital).toLocaleString('en-IN'))
          .replace('{cost}', Number(fin.project_cost).toLocaleString('en-IN'))
          .replace('{loan}', Number(fin.approved_loan).toLocaleString('en-IN'));

        return res.json({
          reply: summary,
          speechText: summary.replace(/[•\n]/g, ' '),
          formState,
          options: [
            lang === 'hi' ? '💰 पूँजी (बजट) बदलें' : '💰 Change Capital',
            lang === 'hi' ? '📍 स्थान बदलें' : '📍 Change Location',
            lang === 'hi' ? '💼 दूसरा व्यवसाय चुनें' : '💼 Pick Another Business',
          ],
          action: 'ready_to_apply',
          extractedData: formState,
        });
      }

      // If capital is missing, ask capital
      if (nextStep === 'capital') {
        const prompt = lang === 'hi'
          ? `बहुत बढ़िया! '${formState.business_category}' के लिए आप अपनी तरफ से कितनी मार्जिन पूँजी (रुपये) लगा सकते हैं? (जैसे: ₹14,000, ₹50,000, ₹1,00,000)`
          : `Great! How much margin capital can you invest for '${formState.business_category}'?`;
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: ['₹14,000', '₹50,000', '₹1,00,000', '₹2,00,000'],
          action: null,
        });
      }

      // If location is missing, ask location
      if (nextStep === 'state') {
        const prompt = lang === 'hi'
          ? `बहुत बढ़िया! '${formState.business_category}' के लिए रिपोर्ट तैयार करते हैं। सबसे पहले बताएं कि आपका उद्यम किस राज्य (State) में स्थित है? बोलें या नीचे से चुनें:`
          : s.askState;
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: getStateOptions(lang),
          action: null,
        });
      }
    }

    // 7. SIDE QUESTIONS & ADVISORY INFORMATION (Always answer questions directly mid-conversation!)
    const isInformationalQuery = isListQuery || isSchemeQuery || isDocQuery || isViabilityQuery || isCommunityQuery || isCapabilitiesQuery;

    if (isInformationalQuery) {
      const inActiveFlow = formState.step !== 'idle' && formState.step !== 'ready';
      const resumeNote = inActiveFlow
        ? (lang === 'hi'
            ? "\n\n💡 (आपकी रिपोर्ट की जानकारी सुरक्षित है। जब आप चाहें, आगे की जानकारी देकर अपनी रिपोर्ट पूरी कर सकते हैं।)"
            : "\n\n💡 (Your report draft is saved. Whenever you wish, you can continue filling your report.)")
        : "";

      let reply = "";
      let speechText = "";
      let options = [];

      if (isCapabilitiesQuery) {
        reply = getPlatformCapabilitiesAdvice(lang);
        speechText = reply.replace(/[•\n]/g, ' ');
        options = [
          lang === 'hi' ? '📝 बिज़नेस रिपोर्ट बनवाएं' : '📝 Create Business Report',
          lang === 'hi' ? '💼 उपलब्ध सभी व्यवसाय देखें' : '💼 View All Businesses',
          lang === 'hi' ? '🏛️ सरकारी ऋण योजनाएं' : '🏛️ Government Loan Schemes',
          lang === 'hi' ? '📄 आवश्यक दस्तावेज़' : '📄 Required Documents',
          lang === 'hi' ? '💡 वायेबिलिटी स्कोर क्या है?' : '💡 What is Viability Score?',
        ];
      } else if (isListQuery) {
        reply = listAllBusinesses(lang);
        speechText = lang === 'hi' ? "हमारी वेबसाइट पर उपलब्ध सभी व्यवसायों की सूची स्क्रीन पर दी गई है।" : "Here is the list of available businesses.";
        options = Object.keys(CATEGORY_PROFILE).slice(0, 4);
      } else if (isSchemeQuery) {
        reply = getGovernmentSchemesAdvice(lang);
        speechText = reply.replace(/[•\n]/g, ' ');
        options = [
          lang === 'hi' ? '📄 आवश्यक दस्तावेज़' : '📄 Required Documents',
          lang === 'hi' ? '💼 सभी व्यवसाय देखें' : '💼 View All Businesses',
        ];
      } else if (isDocQuery) {
        reply = getRequiredDocumentsAdvice(lang);
        speechText = reply.replace(/[•\n]/g, ' ');
        options = [
          lang === 'hi' ? '🏛️ सरकारी ऋण योजनाएं' : '🏛️ Government Loan Schemes',
          lang === 'hi' ? '💼 सभी व्यवसाय देखें' : '💼 View All Businesses',
        ];
      } else if (isViabilityQuery) {
        reply = getViabilityScoreAdvice(lang);
        speechText = reply.replace(/[•\n]/g, ' ');
        options = [
          lang === 'hi' ? '📝 रिपोर्ट बनवाकर स्कोर देखें' : '📝 Generate Report & View Score',
          lang === 'hi' ? '🏛️ सरकारी ऋण योजनाएं' : '🏛️ Government Loan Schemes',
        ];
      } else if (isCommunityQuery) {
        reply = getCommunityMapAdvice(lang);
        speechText = reply.replace(/[•\n]/g, ' ');
        options = [
          lang === 'hi' ? '📝 रिपोर्ट फॉर्म भरने में मदद करें' : '📝 Help me fill report',
          lang === 'hi' ? '💼 सभी व्यवसाय देखें' : '💼 View All Businesses',
        ];
      }

      if (inActiveFlow) {
        reply += resumeNote;
        options.unshift(lang === 'hi' ? '📝 अपनी रिपोर्ट जारी रखें' : '📝 Continue Report');
      }

      return res.json({
        reply,
        speechText,
        formState,
        options,
        action: null,
      });
    }

    // 8. CONTINUE PREVIOUS REPORT
    if (isContinueReportIntent && formState.step !== 'idle' && formState.step !== 'ready') {
      const nextStep = getNextMissingStep(formState);
      formState.step = nextStep;

      if (nextStep === 'state') {
        return res.json({ reply: s.askState, speechText: s.askState, formState, options: getStateOptions(lang), action: null });
      }
      if (nextStep === 'district') {
        return res.json({ reply: s.askDistrict.replace('{state}', formState.state), speechText: s.askDistrict.replace('{state}', formState.state), formState, options: getDistrictOptions(formState.state, lang), action: null });
      }
      if (nextStep === 'block_village') {
        return res.json({ reply: s.askBlockVillage.replace('{district}', formState.district), speechText: s.askBlockVillage.replace('{district}', formState.district), formState, options: getBlockOptions(formState.state, formState.district), action: null });
      }
      if (nextStep === 'business') {
        return res.json({ reply: s.askBusiness, speechText: s.askBusiness, formState, options: Object.keys(CATEGORY_PROFILE).slice(0, 6), action: null });
      }
      if (nextStep === 'capital') {
        return res.json({ reply: s.askCapital, speechText: s.askCapital, formState, options: ['₹14,000', '₹50,000', '₹1,00,000', '₹2,00,000'], action: null });
      }
      if (nextStep === 'repayment') {
        return res.json({ reply: s.askRepayment, speechText: s.askRepayment, formState, options: ['Monthly (मासिक)', 'Quarterly (त्रैमासिक)'], action: null });
      }
    }

    // 9. MULTI-ENTITY FORM INTAKE
    const wantsBusinessOrReport =
      t.includes('form') || t.includes('report') || t.includes('data') ||
      t.includes('काम') || t.includes('शुरू') || t.includes('खोलना') ||
      t.includes('करना है') || t.includes('उद्यम') || t.includes('रिपोर्ट') ||
      t.includes('फॉर्म') || t.includes('भरवा') || t.includes('भरना') ||
      t.includes('मदद') || t.includes('start') ||
      (t.includes('business') && !isListQuery) ||
      (t.includes('बिजनेस') && !isListQuery) ||
      (t.includes('बिज़नेस') && !isListQuery);

    // Accept spoken or selected village/block names when waiting for block/village
    if (formState.step === 'block_village') {
      if (!formState.block && extracted.block) formState.block = extracted.block;
      if (!formState.village && extracted.village) formState.village = extracted.village;
      if (!formState.block && !formState.village && text) {
        const cleanVillageName = text.replace(/(हमारा|गाँव|ब्लॉक|ग्राम|पंचायत|में|रहते|हैं|का|की|जिला)/gi, '').trim();
        const availableBlocks = Object.keys(LOCATIONS[formState.state]?.[formState.district] || {});
        formState.block = extracted.block || availableBlocks[0] || 'Main Block';
        formState.village = extracted.village || cleanVillageName || formState.block || 'Gram Panchayat';
      }
      if (formState.block && !formState.village) formState.village = formState.block;
      if (formState.village && !formState.block) formState.block = 'Main Block';
    }

    const hasAnyEntity = !!(extracted.state || extracted.district || extracted.block || extracted.village || extracted.business_category || extracted.margin_capital || extracted.repayment_frequency);

    if (formState.step !== 'idle' || wantsBusinessOrReport || hasAnyEntity) {
      const nextStep = getNextMissingStep(formState);
      formState.step = nextStep;

      // STEP 1: STATE
      if (nextStep === 'state') {
        const prompt = formState.business_category && lang === 'hi'
          ? `बहुत बढ़िया! '${formState.business_category}' के लिए रिपोर्ट तैयार करते हैं। सबसे पहले बताएं कि आपका उद्यम किस राज्य (State) में स्थित है? बोलें या नीचे से चुनें:`
          : s.askState;
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: getStateOptions(lang),
          action: null,
        });
      }

      // STEP 2: DISTRICT
      if (nextStep === 'district') {
        const districtOpts = getDistrictOptions(formState.state, lang);
        let prompt = s.askDistrict.replace('{state}', formState.state);
        if (formState.business_category && lang === 'hi') {
          prompt = `शानदार! ${formState.state} में आपका ज़िला (District) कौन सा है? कृपया बोलें या नीचे से चुनें:`;
        }
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: districtOpts,
          action: null,
        });
      }

      // STEP 3: BLOCK & VILLAGE
      if (nextStep === 'block_village') {
        const blocks = getBlockOptions(formState.state, formState.district);
        let prompt = s.askBlockVillage.replace('{district}', formState.district);
        if (lang === 'hi') {
          prompt = `समझ गया! ज़िला ${formState.district} में आपका ब्लॉक और गाँव/ग्राम पंचायत का नाम क्या है? बोलकर बताएं या ब्लॉक चुनें:`;
        }
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: blocks,
          action: null,
        });
      }

      // STEP 4: BUSINESS CATEGORY
      if (nextStep === 'business') {
        const sampleBusinesses = Object.keys(CATEGORY_PROFILE).slice(0, 6);
        let prompt = s.askBusiness;
        if (lang === 'hi') {
          prompt = `स्थान दर्ज हो गया है! अब बताएं कि आप कौन सा व्यापार या उद्यम शुरू करना चाहते हैं? बोलें या नीचे से चुनें:`;
        }
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: sampleBusinesses,
          action: null,
        });
      }

      // STEP 5: MARGIN CAPITAL
      if (nextStep === 'capital') {
        const capitalOpts = ['₹14,000', '₹50,000', '₹1,00,000', '₹2,00,000'];
        let prompt = s.askCapital;
        if (formState.business_category && lang === 'hi') {
          prompt = `आप '${formState.business_category}' के लिए अपनी तरफ से कितनी मार्जिन पूँजी (रुपये) लगा सकते हैं? (जैसे: ₹14,000, ₹50,000, ₹1,00,000)`;
        }
        return res.json({
          reply: prompt,
          speechText: prompt,
          formState,
          options: capitalOpts,
          action: null,
        });
      }

      // STEP 6: REPAYMENT FREQUENCY
      if (nextStep === 'repayment') {
        return res.json({
          reply: s.askRepayment,
          speechText: s.askRepayment,
          formState,
          options: ['Monthly (मासिक)', 'Quarterly (त्रैमासिक)'],
          action: null,
        });
      }

      // STEP 7: READY & COMPLETE
      if (nextStep === 'ready') {
        let fin = null;
        try {
          fin = computeScheme(formState.margin_capital, { frequency: formState.repayment_frequency || 'monthly' });
        } catch (e) {
          fin = { project_cost: formState.margin_capital * 10, approved_loan: formState.margin_capital * 9 };
        }

        const summary = s.summaryReady
          .replace('{village}', formState.village || 'Gram Panchayat')
          .replace('{block}', formState.block || 'Main Block')
          .replace('{district}', formState.district)
          .replace('{state}', formState.state)
          .replace('{business}', formState.business_category)
          .replace('{margin}', Number(formState.margin_capital).toLocaleString('en-IN'))
          .replace('{cost}', Number(fin.project_cost).toLocaleString('en-IN'))
          .replace('{loan}', Number(fin.approved_loan).toLocaleString('en-IN'));

        return res.json({
          reply: summary,
          speechText: summary.replace(/[•\n]/g, ' '),
          formState,
          options: [
            lang === 'hi' ? '💰 पूँजी (बजट) बदलें' : '💰 Change Capital',
            lang === 'hi' ? '📍 स्थान बदलें' : '📍 Change Location',
            lang === 'hi' ? '💼 दूसरा व्यवसाय चुनें' : '💼 Pick Another Business',
          ],
          action: 'ready_to_apply',
          extractedData: formState,
        });
      }
    }

    // 10. FALLBACK: Explain platform capabilities & business advice
    const capabilitiesReply = getPlatformCapabilitiesAdvice(lang);
    return res.json({
      reply: capabilitiesReply,
      speechText: capabilitiesReply.replace(/[•\n]/g, ' '),
      formState,
      options: [
        lang === 'hi' ? '📝 बिज़नेस रिपोर्ट बनवाएं' : '📝 Create Business Report',
        lang === 'hi' ? '💼 उपलब्ध सभी व्यवसाय देखें' : '💼 View All Available Businesses',
        lang === 'hi' ? '🏛️ सरकारी ऋण योजनाएं' : '🏛️ Government Loan Schemes',
        lang === 'hi' ? '📄 लोन के लिए आवश्यक दस्तावेज़' : '📄 Required Documents',
        lang === 'hi' ? '💡 वायेबिलिटी स्कोर क्या है?' : '💡 What is Viability Score?',
      ],
      action: null,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ detail: err.message });
  }
}

// Initial prompt and suggestions
async function getChatSuggestions(req, res) {
  const lang = req.query.lang || 'en';
  const s = BOT_STRINGS[lang] || BOT_STRINGS.en;

  const suggestions = {
    en: [
      '📝 Help me fill the report form',
      '💼 View all available businesses',
      '🏛️ Government loan schemes',
      '📄 Required documents for loan',
      '💡 What is Viability Score?'
    ],
    hi: [
      '📝 रिपोर्ट फॉर्म भरने में मदद करें',
      '💼 उपलब्ध सभी व्यवसाय देखें',
      '🏛️ सरकारी ऋण योजनाएं',
      '📄 लोन के लिए आवश्यक दस्तावेज़',
      '💡 वायेबिलिटी स्कोर क्या है?'
    ],
    mr: [
      '📝 रिपोर्ट फॉर्म भरण्यास मदत करा',
      '💼 उपलब्ध सर्व व्यवसाय पहा',
      '🏛️ शासकीय कर्ज योजना',
      '📄 आवश्यक कागदपत्रे',
      '💡 व्हायॅबिलिटी स्कोर काय आहे?'
    ],
    ta: [
      '📝 ஆலோசனை படிவத்தை நிரப்பவும்',
      '💼 கிடைக்கக்கூடிய தொழில்கள்',
      '🏛️ அரசு கடன் திட்டங்கள்',
      '📄 தேவையான ஆவணங்கள்',
      '💡 சாத்தியக்கூறு மதிப்பெண் என்றால் என்ன?'
    ],
    te: [
      '📝 ఫారమ్ పూరించడానికి సహాయం',
      '💼 అందుబాటులో ఉన్న వ్యాపారాలు',
      '🏛️ ప్రభుత్వ రుణ పథకాలు',
      '📄 అవసరమైన పత్రాలు',
      '💡 వయబిలిటీ స్కోర్ అంటే ఏమిటి?'
    ],
    bn: [
      '📝 ফর্ম পূরণ করতে সাহায্য করুন',
      '💼 উপলব্ধ ব্যবসা সমূহ',
      '🏛️ সরকারি ঋণ প্রকল্পসমূহ',
      '📄 প্রয়োজনীয় কাগজপত্র',
      '💡 ভায়াবিলিটি স্কোর কী?'
    ],
  };

  return res.json({
    welcomeText: s.welcome,
    suggestions: suggestions[lang] || suggestions.en,
  });
}

module.exports = {
  handleChatMessage,
  getChatSuggestions,
  findBusinessMatchWithNegation,
  findUnsupportedBusiness,
  getUnsupportedBusinessResponse,
};
