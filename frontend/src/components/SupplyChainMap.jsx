import React from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
import { ArrowRight, Factory, PackageOpen, Truck, Users, Sprout } from 'lucide-react';

const ICONS = { source: Sprout, produce: Factory, store: PackageOpen, distribute: Truck, customer: Users };

const STAGE_TITLES = {
  hi: {
    'Sourcing': 'कच्चा माल खरीद',
    'Production': 'उत्पादन / प्रसंस्करण',
    'Storage': 'भंडारण और सुरक्षा',
    'Distribution': 'वितरण और आपूर्ति',
    'Customers': 'ग्राहक और बाजार',
  },
  mr: {
    'Sourcing': 'कच्चा माल खरेदी',
    'Production': 'उत्पादन / प्रक्रिया',
    'Storage': 'साठवणूक आणि काळजी',
    'Distribution': 'वितरण आणि पुरवठा',
    'Customers': 'ग्राहक आणि बाजारपेठ',
  },
  ta: {
    'Sourcing': 'மூலப்பொருள் கொள்முதல்',
    'Production': 'உற்பத்தி',
    'Storage': 'சேமிப்பு',
    'Distribution': 'விநியோகம்',
    'Customers': 'வாடிக்கையாளர்கள்',
  },
  te: {
    'Sourcing': 'ముడిసరుకు సేకరణ',
    'Production': 'ఉత్పత్తి',
    'Storage': 'నిల్వ',
    'Distribution': 'పంపిణీ',
    'Customers': 'వినియోగదారులు',
  },
  bn: {
    'Sourcing': 'কাঁচামাল সংগ্রহ',
    'Production': 'উৎপাদন',
    'Storage': 'সংরক্ষণ',
    'Distribution': 'বণ্টন',
    'Customers': 'গ্রাহক',
  },
};

const STAGE_DETAILS = {
  hi: {
    'Hold stock & maintain quality buffer': 'स्टॉक सुरक्षित रखें और गुणवत्ता बनाए रखें',
    'Move goods to points of sale': 'उत्पादों को बिक्री केंद्रों तक पहुंचाएं',
  },
  mr: {
    'Hold stock & maintain quality buffer': 'साठा सुरक्षित ठेवा आणि दर्जा राखा',
    'Move goods to points of sale': 'उत्पादने विक्री केंद्रांपर्यंत पोहोचवा',
  },
  ta: {
    'Hold stock & maintain quality buffer': 'இருப்பை பராமரித்து தரத்தை உறுதி செய்தல்',
    'Move goods to points of sale': 'விற்பனை மையங்களுக்கு கொண்டு செல்லுதல்',
  },
  te: {
    'Hold stock & maintain quality buffer': 'నాణ్యతతో కూడిన సరుకును నిల్వ ఉంచడం',
    'Move goods to points of sale': 'విక్రయ కేంద్రాలకు సరుకును చేర్చడం',
  },
  bn: {
    'Hold stock & maintain quality buffer': 'স্টক সুরক্ষিত রাখা ও গুণমান বজায় রাখা',
    'Move goods to points of sale': 'বিক্রয় কেন্দ্রে পণ্য পৌঁছে দেওয়া',
  },
};

const NODE_TRANSLATIONS = {
  hi: {
    'On-site inventory': 'कार्यस्थल पर इन्वेंटरी',
    'Direct retail': 'सीधी खुदरा बिक्री',
    'Weekly haat': 'साप्ताहिक हाट',
    'Nearby town B2B': 'आस-पास के शहरों में B2B',
    'Households': 'स्थानीय परिवार',
    'Retail shops': 'खुदरा दुकानें',
    'Institutions': 'संस्थान और कैंटीन',
  },
  mr: {
    'On-site inventory': 'जागेवरील साठा',
    'Direct retail': 'थेट किरकोळ विक्री',
    'Weekly haat': 'आठवडी बाजार',
    'Nearby town B2B': 'जवळच्या शहरांना पुरवठा',
    'Households': 'कुटुंबे',
    'Retail shops': 'किरकोळ दुकाने',
    'Institutions': 'संस्था',
  },
  ta: {
    'On-site inventory': 'நேரடி இருப்பு',
    'Direct retail': 'நேரடி சில்லறை விற்பனை',
    'Weekly haat': 'வாராந்திர சந்தை',
    'Nearby town B2B': 'அருகிலுள்ள நகரங்களுக்கு B2B',
    'Households': 'குடும்பங்கள்',
    'Retail shops': 'சில்லறை கடைகள்',
    'Institutions': 'நிறுவனங்கள்',
  },
  te: {
    'On-site inventory': 'స్థానిక నిల్వ',
    'Direct retail': 'ప్రత్యక్ష రిటైల్ విక్రయం',
    'Weekly haat': 'వారపు సంత',
    'Nearby town B2B': 'సమీప పట్టణాలకు B2B',
    'Households': 'కుటుంబాలు',
    'Retail shops': 'చిల్లర దుకాణాలు',
    'Institutions': 'సంస్థలు',
  },
  bn: {
    'On-site inventory': 'সাইট ইনভেন্টরি',
    'Direct retail': 'সরাসরি খুচরা বিক্রি',
    'Weekly haat': 'সাপ্তাহিক হাট',
    'Nearby town B2B': 'কাছের শহরে B2B',
    'Households': 'পরিবার',
    'Retail shops': 'খুচরা দোকান',
    'Institutions': 'প্রতিষ্ঠান',
  },
};

export default function SupplyChainMap({ supplyChain, map }) {
  const { lang } = useApp();
  const stages = supplyChain?.stages || map?.stages || [];
  if (!stages.length) return null;

  return (
    <div className="overflow-x-auto" data-testid="supply-chain-map">
      <div className="flex items-stretch gap-2 min-w-[720px]">
        {stages.map((s, i) => {
          const Icon = ICONS[s.key] || Sprout;
          const stageTitle = STAGE_TITLES[lang]?.[s.title] || s.title;
          const stageDetail = STAGE_DETAILS[lang]?.[s.detail] || s.detail;

          return (
            <React.Fragment key={s.key}>
              <div className="flex-1 border border-border bg-background p-4 flex flex-col" data-testid={`chain-stage-${s.key}`}>
                <div className="w-9 h-9 bg-primary text-primary-foreground flex items-center justify-center mb-3">
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t(lang, 'step')} {i + 1}</div>
                <div className="font-display font-bold text-primary mt-0.5">{stageTitle}</div>
                <p className="text-xs text-muted-foreground mt-1 mb-3 leading-snug">{stageDetail}</p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {(s.nodes || []).map((n, j) => {
                    const nodeText = NODE_TRANSLATIONS[lang]?.[n] || n;
                    return (
                      <span key={j} className="border border-border bg-muted/40 px-2 py-1 text-[11px] leading-tight">{nodeText}</span>
                    );
                  })}
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className="flex items-center text-accent flex-shrink-0">
                  <ArrowRight size={20} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
