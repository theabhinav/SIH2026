import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useApp, API } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/sonner';
import {
  MapPin,
  IndianRupee,
  Briefcase,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Building2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import ReportView from '@/components/ReportView';

const CATEGORY_BENCHMARKS = {
  'Dairy & Milk Products': { minMargin: 20000, minCost: 200000, recCost: 600000, sector: 'food_processing', isLivestock: true, turnover: 0.28 },
  'Poultry Farming': { minMargin: 15000, minCost: 150000, recCost: 500000, sector: 'livestock', isLivestock: true, turnover: 0.30 },
  'Goat & Sheep Farming': { minMargin: 12000, minCost: 120000, recCost: 400000, sector: 'livestock', isLivestock: true, turnover: 0.20 },
  'Retail Kirana Store': { minMargin: 10000, minCost: 100000, recCost: 350000, sector: 'trading', turnover: 0.55 },
  'Textiles & Handloom': { minMargin: 12000, minCost: 120000, recCost: 400000, sector: 'manufacturing', turnover: 0.22 },
  'Tailoring & Boutique': { minMargin: 5000, minCost: 50000, recCost: 150000, sector: 'service', turnover: 0.26 },
  'Beauty Parlour': { minMargin: 6000, minCost: 60000, recCost: 200000, sector: 'service', turnover: 0.30 },
  'Mobile Repair & Recharge Shop': { minMargin: 7000, minCost: 70000, recCost: 200000, sector: 'service', turnover: 0.40 },
  'Auto/E-Rickshaw Service': { minMargin: 18000, minCost: 180000, recCost: 300000, sector: 'service', turnover: 0.24 },
  'Bakery & Confectionery': { minMargin: 18000, minCost: 180000, recCost: 500000, sector: 'food_processing', turnover: 0.32 },
  'Tea Stall / Snacks': { minMargin: 5000, minCost: 30000, recCost: 100000, sector: 'service', turnover: 0.45 },
  'Vegetable & Fruit Vending': { minMargin: 5000, minCost: 25000, recCost: 80000, sector: 'trading', turnover: 0.60 },
  'Agri-Inputs (Seeds, Fertilizer)': { minMargin: 15000, minCost: 150000, recCost: 500000, sector: 'trading', turnover: 0.38 },
  'Fisheries': { minMargin: 12000, minCost: 120000, recCost: 400000, sector: 'food_processing', turnover: 0.26 },
  'Handicrafts': { minMargin: 5000, minCost: 50000, recCost: 150000, sector: 'manufacturing', turnover: 0.20 },
  'Beekeeping': { minMargin: 6000, minCost: 60000, recCost: 180000, sector: 'manufacturing', turnover: 0.22 },
  'Flour Mill': { minMargin: 15000, minCost: 150000, recCost: 450000, sector: 'food_processing', turnover: 0.34 },
  'Papad / Pickle Making': { minMargin: 6000, minCost: 60000, recCost: 180000, sector: 'food_processing', turnover: 0.28 },
  'Photocopy & CSC Centre': { minMargin: 8000, minCost: 80000, recCost: 220000, sector: 'service', turnover: 0.36 },
  'Two-Wheeler Repair': { minMargin: 9000, minCost: 90000, recCost: 250000, sector: 'service', turnover: 0.30 },
};

const EXPANSION_PRESETS = [
  {
    id: 'machinery',
    title: 'Machinery & Equipment Modernisation',
    title_hi: 'मशीनरी एवं उपकरण आधुनिकीकरण',
    mult: 0.45,
    boost: '+40% Output',
    desc: 'Upgrade tools, semi-automatic processing equipment, or backup power.',
  },
  {
    id: 'inventory',
    title: 'Inventory & Bulk Stock Expansion',
    title_hi: 'थोक इन्वेंटरी एवं कार्यशील पूंजी',
    mult: 0.30,
    boost: '+35% Turnover',
    desc: 'Procure bulk stock at distributor rates and expand customer product variety.',
  },
  {
    id: 'branch',
    title: 'Additional Counter / Mobile Unit',
    title_hi: 'अतिरिक्त काउंटर / डिलीवरी वाहन',
    mult: 0.65,
    boost: '+70% Reach',
    desc: 'Open a secondary point of sale or add a delivery vehicle to tap weekly markets.',
  },
  {
    id: 'processing',
    title: 'Value-Addition & Packaging Line',
    title_hi: 'मूल्य संवर्धन एवं पैकेजिंग यूनिट',
    mult: 0.55,
    boost: '+55% Margin',
    desc: 'Produce branded, hygienic packaging with higher net profit retention.',
  },
];

export default function Advisory() {
  const { lang, authHeaders } = useApp();
  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState({});
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    advisory_type: 'new', // 'new' | 'expansion'
    applicant_category: 'special', // 'general' | 'special' (Special gets 35% subsidy)
    state: '',
    district: '',
    block: '',
    village: '',
    business_category: '',
    expansion_type: 'machinery',
    current_scale: 'small',
    margin_capital: 35000,
    repayment_frequency: 'monthly',
    loan_mode: 'lean', // 'lean' (kaam ka loan) | 'growth' (10x scale)
    tenure_years: 5, // 3 | 5 | 7
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    axios.get(`${API}/locations`).then((r) => setLocations(r.data));
    axios.get(`${API}/business-categories`).then((r) => setCategories(r.data));
  }, []);

  const states = useMemo(() => Object.keys(locations), [locations]);
  const districts = useMemo(() => (form.state ? Object.keys(locations[form.state] || {}) : []), [locations, form.state]);
  const blocks = useMemo(
    () => (form.district ? Object.keys(locations[form.state]?.[form.district] || {}) : []),
    [locations, form.state, form.district]
  );
  const villages = useMemo(
    () => (form.block ? locations[form.state]?.[form.district]?.[form.block] || [] : []),
    [locations, form.state, form.district, form.block]
  );

  const currentBenchmark = CATEGORY_BENCHMARKS[form.business_category] || {
    minMargin: 10000,
    minCost: 100000,
    recCost: 350000,
    turnover: 0.35,
  };

  const selectedExpansion = EXPANSION_PRESETS.find((e) => e.id === form.expansion_type) || EXPANSION_PRESETS[0];

  // Calculated expansion economics
  const expansionEconomics = useMemo(() => {
    const baseCost = currentBenchmark.recCost || 350000;
    const expansionProjectCost = Math.round(baseCost * selectedExpansion.mult);
    const requiredMargin = Math.round(expansionProjectCost * 0.10);
    const loanNeeded = expansionProjectCost - requiredMargin;
    const isSpecial = form.applicant_category === 'special';
    const subsidyPct = isSpecial ? 20 : 15;
    const subsidyEst = Math.round(expansionProjectCost * (subsidyPct / 100));
    const isEnough = form.margin_capital >= requiredMargin;
    const shortfall = isEnough ? 0 : requiredMargin - form.margin_capital;
    const surplus = isEnough ? form.margin_capital - requiredMargin : 0;
    return {
      expansionProjectCost,
      requiredMargin,
      loanNeeded,
      subsidyPct,
      subsidyEst,
      isEnough,
      shortfall,
      surplus,
    };
  }, [currentBenchmark, selectedExpansion, form.applicant_category, form.margin_capital]);

  // New business adequacy check
  const newBusinessAdequacy = useMemo(() => {
    const minMargin = currentBenchmark.minMargin || 10000;
    const minCost = currentBenchmark.minCost || 100000;
    const recCost = currentBenchmark.recCost || 350000;

    const provided = form.margin_capital;
    const isEnough = provided >= minMargin;
    const shortfall = isEnough ? 0 : minMargin - provided;
    const surplus = isEnough ? provided - minMargin : 0;
    const status = isEnough ? 'sufficient' : 'insufficient';

    // Minimum loan required to launch the business (Min Cost minus Margin Capital, min 0)
    const minLoanNeeded = Math.max(0, minCost - provided);
    // Loan Eligibility: In formal banking, applicant is eligible if promoter margin requirement (10%) is met
    const isLoanEligible = isEnough;

    const isSpecial = form.applicant_category === 'special';
    const subsidyPct = isSpecial ? 35 : 25;

    // Smart Loan sizing:
    // Lean loan: only borrow what is really needed to set up minimum viable unit
    const leanProjectCost = minCost;
    const leanLoanNeeded = minLoanNeeded;

    // Growth loan: standard 10x
    const growthProjectCost = Math.max(minCost, provided * 10);
    const growthLoanNeeded = growthProjectCost - provided;

    // Active loan according to form.loan_mode
    const isLean = form.loan_mode === 'lean';
    const activeProjectCost = isLean ? leanProjectCost : growthProjectCost;
    const activeLoan = isLean ? leanLoanNeeded : growthLoanNeeded;

    const subsidyEst = Math.min(Math.round(activeProjectCost * (subsidyPct / 100)), 1750000);

    // EMI calculation:
    const tenureMonths = (form.tenure_years || 5) * 12;
    const moratoriumMonths = activeProjectCost <= 140000 ? 3 : 6;
    const repaymentMonths = tenureMonths - moratoriumMonths;
    const interestRate = activeProjectCost <= 140000 ? 6.5 : 8.0;
    const rMonthly = interestRate / 100 / 12;

    let emiMonthly = 0;
    if (activeLoan > 0 && repaymentMonths > 0) {
      emiMonthly = Math.round(
        (activeLoan * rMonthly * Math.pow(1 + rMonthly, repaymentMonths)) /
        (Math.pow(1 + rMonthly, repaymentMonths) - 1)
      );
    }
    const quarterlyEmi = emiMonthly * 3;
    const totalInterest = Math.max(0, Math.round(emiMonthly * repaymentMonths - activeLoan));

    // Growth benchmark to show interest savings
    const growthRepaymentMonths = 84 - 6;
    const growthRMonthly = 8.0 / 100 / 12;
    const growthEmi = growthLoanNeeded > 0 ? Math.round((growthLoanNeeded * growthRMonthly * Math.pow(1 + growthRMonthly, growthRepaymentMonths)) / (Math.pow(1 + growthRMonthly, growthRepaymentMonths) - 1)) : 0;
    const growthTotalInterest = Math.max(0, Math.round(growthEmi * growthRepaymentMonths - growthLoanNeeded));
    const interestSaved = Math.max(0, growthTotalInterest - totalInterest);

    // Turnover and profit estimates
    const turnoverMult = currentBenchmark.turnover || 0.35;
    const monthlyTurnover = Math.round(activeProjectCost * turnoverMult);
    const monthlyGrossProfit = Math.round(monthlyTurnover * 0.22);
    const netProfitAfterEmi = monthlyGrossProfit - emiMonthly;
    const emiRatio = monthlyGrossProfit > 0 ? Math.round((emiMonthly / monthlyGrossProfit) * 100) : 100;

    let affordabilityStatus = 'safe';
    if (emiRatio > 55) affordabilityStatus = 'heavy';
    else if (emiRatio > 35) affordabilityStatus = 'moderate';

    return {
      status,
      isEnough,
      isLoanEligible,
      minLoanNeeded,
      minMargin,
      minCost,
      recCost,
      shortfall,
      surplus,
      subsidyPct,
      subsidyEst,
      leanProjectCost,
      leanLoanNeeded,
      growthProjectCost,
      growthLoanNeeded,
      activeProjectCost,
      activeLoan,
      emiMonthly,
      quarterlyEmi,
      totalInterest,
      interestSaved,
      monthlyTurnover,
      monthlyGrossProfit,
      netProfitAfterEmi,
      emiRatio,
      affordabilityStatus,
    };
  }, [currentBenchmark, form.applicant_category, form.margin_capital, form.loan_mode, form.tenure_years]);

  const newBusinessMessage = useMemo(() => {
    if (newBusinessAdequacy.isEnough) {
      return lang === 'hi'
        ? `आपकी ₹${form.margin_capital.toLocaleString('en-IN')} की पूंजी 10% न्यूनतम मार्जिन (₹${newBusinessAdequacy.minMargin.toLocaleString('en-IN')}) को पूरा करती है। आप बैंक ऋण के लिए पूर्णतः पात्र (ELIGIBLE) हैं। इस व्यवसाय को शुरू करने के लिए न्यूनतम ₹${newBusinessAdequacy.minLoanNeeded.toLocaleString('en-IN')} का बैंक ऋण आवश्यक है (और आप ₹${(form.margin_capital * 9).toLocaleString('en-IN')} तक के अधिकतम ऋण के लिए पात्र हैं)।`
        : `Your capital of ₹${form.margin_capital.toLocaleString('en-IN')} satisfies the minimum margin requirement (₹${newBusinessAdequacy.minMargin.toLocaleString('en-IN')}). You are ELIGIBLE for a bank loan: minimum loan required to start is ₹${newBusinessAdequacy.minLoanNeeded.toLocaleString('en-IN')} (and up to ₹${(form.margin_capital * 9).toLocaleString('en-IN')} based on scale).`;
    }
    return lang === 'hi'
      ? `ऋण पात्रता: आप वर्तमान में बैंक ऋण के लिए अपात्र हैं क्योंकि पूंजी में ₹${newBusinessAdequacy.shortfall.toLocaleString('en-IN')} की कमी है। न्यूनतम ₹${newBusinessAdequacy.minLoanNeeded.toLocaleString('en-IN')} का ऋण प्राप्त करने के लिए बैंक को न्यूनतम ₹${newBusinessAdequacy.minMargin.toLocaleString('en-IN')} मार्जिन अनिवार्य रूप से चाहिए।`
      : `Loan Eligibility: NOT YET ELIGIBLE due to a ₹${newBusinessAdequacy.shortfall.toLocaleString('en-IN')} margin shortfall. To unlock the minimum required loan of ₹${newBusinessAdequacy.minLoanNeeded.toLocaleString('en-IN')}, banks mandate at least ₹${newBusinessAdequacy.minMargin.toLocaleString('en-IN')} promoter margin.`;
  }, [newBusinessAdequacy, form.margin_capital, form.business_category, lang]);

  const expansionMessage = useMemo(() => {
    if (expansionEconomics.isEnough) {
      return lang === 'hi'
        ? `आपकी ₹${form.margin_capital.toLocaleString('en-IN')} की पूंजी इस विस्तार की आवश्यक ₹${expansionEconomics.requiredMargin.toLocaleString('en-IN')} मार्जिन को आसानी से पूरा करती है (अतिरिक्त बफर: ₹${expansionEconomics.surplus.toLocaleString('en-IN')})।`
        : `Your available capital of ₹${form.margin_capital.toLocaleString('en-IN')} fully covers the required ₹${expansionEconomics.requiredMargin.toLocaleString('en-IN')} margin contribution.`;
    }
    return lang === 'hi'
      ? `इस विस्तार परियोजना (लागत: ₹${expansionEconomics.expansionProjectCost.toLocaleString('en-IN')}) के लिए ₹${expansionEconomics.requiredMargin.toLocaleString('en-IN')} मार्जिन चाहिए। ₹${expansionEconomics.shortfall.toLocaleString('en-IN')} और जोड़ें अथवा 15% सरकारी सब्सिडी का लाभ उठाएं।`
      : `This expansion requires ₹${expansionEconomics.requiredMargin.toLocaleString('en-IN')} margin. You are short by ₹${expansionEconomics.shortfall.toLocaleString('en-IN')}, which can be supported via PMEGP 2nd Loan capital subsidies.`;
  }, [expansionEconomics, form.margin_capital, lang]);

  const canNext = {
    1: form.state && form.district && form.block && form.village,
    2: !!form.business_category,
    3: form.margin_capital >= 5000,
  }[step];

  const generate = async () => {
    setLoading(true);
    try {
      const r = await axios.post(
        `${API}/feasibility/generate`,
        {
          ...form,
          language: lang,
        },
        { headers: authHeaders }
      );
      setReport(r.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (report) {
    return (
      <ReportView
        report={report}
        onReset={() => {
          setReport(null);
          setStep(1);
        }}
      />
    );
  }

  const STEPS = [
    { n: 1, title: t(lang, 'step1'), icon: MapPin },
    { n: 2, title: t(lang, 'step2'), icon: Briefcase },
    { n: 3, title: t(lang, 'step3'), icon: IndianRupee },
    { n: 4, title: t(lang, 'step4'), icon: Sparkles },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <div className="mb-8">
        <div className="text-xs tracking-[0.3em] uppercase text-accent font-bold mb-2">AI Advisory Engine</div>
        <h1 className="font-display text-3xl lg:text-5xl tracking-tight font-extrabold text-primary">
          {form.advisory_type === 'expansion' ? (lang === 'hi' ? 'व्यवसाय विस्तार एवं पूंजी सलाह' : 'Business Extension Advisory') : t(lang, 'startAdvisory')}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {form.advisory_type === 'expansion'
            ? (lang === 'hi' ? 'विस्तार हेतु आवश्यक पूंजी, अपेक्षित वृद्धि और सरकारी द्वितीय ऋण सब्सिडी का सटीक आकलन।' : 'Calculate capital needed to expand, scaling economics, and government upgradation subsidies.')
            : (lang === 'hi' ? 'स्थानीय व्यवहार्यता, आपकी पूंजी पर्याप्तता और सरकारी योजना सब्सिडी (₹ व %) का पूर्ण विश्लेषण।' : 'Assess local feasibility, capital sufficiency check, and government subsidy benefits (Rupees & %).')}
        </p>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-4 gap-2 mb-8" data-testid="stepper">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className={`border ${
              step >= s.n
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground'
            } p-3 sm:p-4 transition-colors`}
          >
            <s.icon size={16} strokeWidth={1.75} className="mb-2" />
            <div className="text-[10px] tracking-[0.2em] uppercase font-bold">Step {s.n}</div>
            <div className="text-xs sm:text-sm font-semibold mt-1 truncate">{s.title}</div>
          </div>
        ))}
      </div>

      <div className="border border-border bg-card p-6 sm:p-8 lg:p-12">
        {/* STEP 1: ADVISORY MODE & LOCATION */}
        {step === 1 && (
          <div className="space-y-8" data-testid="step-location">
            {/* Mode selection cards */}
            <div>
              <Label className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground block mb-3">
                {t(lang, 'advisoryType')}
              </Label>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, advisory_type: 'new' })}
                  className={`text-left border p-5 transition-all ${
                    form.advisory_type === 'new'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-sm'
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                  data-testid="mode-new"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🌱</span>
                    <span className="font-display font-bold text-base text-primary">
                      {t(lang, 'newBusiness')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(lang, 'newBusinessDesc')}
                  </p>
                  <div className="mt-3 text-[11px] font-semibold text-secondary flex items-center gap-1">
                    <CheckCircle2 size={13} /> {lang === 'hi' ? 'पूंजी पर्याप्तता जांच शामिल' : 'Includes Capital Sufficiency Check'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, advisory_type: 'expansion' })}
                  className={`text-left border p-5 transition-all ${
                    form.advisory_type === 'expansion'
                      ? 'border-accent bg-accent/5 ring-2 ring-accent shadow-sm'
                      : 'border-border bg-background hover:border-accent/50'
                  }`}
                  data-testid="mode-expansion"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🚀</span>
                    <span className="font-display font-bold text-base text-primary">
                      {t(lang, 'businessExtension')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(lang, 'businessExtensionDesc')}
                  </p>
                  <div className="mt-3 text-[11px] font-semibold text-accent flex items-center gap-1">
                    <TrendingUp size={13} /> {lang === 'hi' ? 'विस्तार हेतु पूंजी गणना' : 'Calculates Capital Required to Extend'}
                  </div>
                </button>
              </div>
            </div>

            {/* Entrepreneur Category (For Max Subsidy benefit) */}
            <div className="border border-border p-5 bg-card rounded-lg space-y-3" data-testid="entrepreneur-category-section">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground block">
                    {t(lang, 'applicantCategory')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'hi'
                      ? 'अपनी श्रेणी चुनें — सरकार विशेष श्रेणी को 35% और सामान्य श्रेणी को 25% सब्सिडी देती है।'
                      : 'Select your category — PMEGP grants 35% subsidy for special categories and 25% for general.'}
                  </p>
                </div>
                <span className="text-[11px] text-secondary font-bold flex items-center gap-1 bg-secondary/15 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={13} /> {lang === 'hi' ? 'PMEGP सब्सिडी स्तर' : 'PMEGP Subsidy Tier'}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Special Category Card */}
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, applicant_category: 'special' }))}
                  data-testid="category-special"
                  className={`p-4 text-left border-2 rounded-lg transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    form.applicant_category === 'special'
                      ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/30 shadow-sm'
                      : 'border-border bg-background hover:border-secondary/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-primary flex items-center gap-1.5">
                        ⭐ {lang === 'hi' ? 'विशेष श्रेणी' : 'Special Category'}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        35% Subsidy
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lang === 'hi'
                        ? 'महिलाएं, SC / ST / OBC, अल्पसंख्यक, पूर्व सैनिक, दिव्यांग एवं ग्रामीण उद्यमी'
                        : 'Women, SC, ST, OBC, Minorities, Ex-Servicemen, PwD & Rural Entrepreneurs'}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    form.applicant_category === 'special'
                      ? 'border-secondary bg-secondary text-secondary-foreground'
                      : 'border-muted-foreground/40 bg-background'
                  }`}>
                    {form.applicant_category === 'special' && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </button>

                {/* General Category Card */}
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, applicant_category: 'general' }))}
                  data-testid="category-general"
                  className={`p-4 text-left border-2 rounded-lg transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    form.applicant_category === 'general'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm'
                      : 'border-border bg-background hover:border-primary/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-primary flex items-center gap-1.5">
                        👤 {lang === 'hi' ? 'सामान्य श्रेणी' : 'General Category'}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-primary/15 text-primary">
                        25% Subsidy
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lang === 'hi'
                        ? 'सामान्य वर्ग (शहरी पुरुष उद्यमी)'
                        : 'General category male entrepreneurs in urban areas'}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    form.applicant_category === 'general'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/40 bg-background'
                  }`}>
                    {form.applicant_category === 'general' && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Location form */}
            <div>
              <h2 className="font-display text-xl font-bold text-primary tracking-tight mb-1">
                {lang === 'hi' ? 'आपकी इकाई का स्थान कहां है?' : 'Where is your enterprise located?'}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {lang === 'hi' ? 'AI स्थानीय ग्राम पंचायत के आधार पर बाजार एवं आपूर्ति श्रृंखला का विश्लेषण करेगा।' : 'The analytical engine anchors local competition, mandi proximity and purchasing power.'}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ['state', t(lang, 'state'), states],
                  ['district', t(lang, 'district'), districts],
                  ['block', t(lang, 'block'), blocks],
                  ['village', t(lang, 'village'), villages],
                ].map(([key, label, opts]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs tracking-[0.15em] uppercase font-bold text-muted-foreground">{label}</Label>
                    <Select
                      value={form[key]}
                      onValueChange={(v) => {
                        const upd = { ...form, [key]: v };
                        if (key === 'state') {
                          upd.district = '';
                          upd.block = '';
                          upd.village = '';
                        }
                        if (key === 'district') {
                          upd.block = '';
                          upd.village = '';
                        }
                        if (key === 'block') {
                          upd.village = '';
                        }
                        setForm(upd);
                      }}
                    >
                      <SelectTrigger className="h-11" data-testid={`select-${key}`}>
                        <SelectValue placeholder={`Select ${label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {opts.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS SELECTION & EXPANSION DETAILS */}
        {step === 2 && (
          <div className="space-y-8" data-testid="step-business">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">
                {form.advisory_type === 'expansion'
                  ? (lang === 'hi' ? 'आप किस मौजूदा व्यवसाय का विस्तार करना चाहते हैं?' : 'Which business do you want to extend?')
                  : t(lang, 'businessCategory')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {form.advisory_type === 'expansion'
                  ? (lang === 'hi' ? 'अपनी मौजूदा श्रेणी चुनें — हम विस्तार के लिए आवश्यक पूंजी की गणना करेंगे।' : 'Choose your existing category to determine expansion capital and equipment needs.')
                  : (lang === 'hi' ? 'निकटतम श्रेणी चुनें — AI बेंचमार्क लागत और पूंजी आवश्यकताओं का मिलान करेगा।' : 'Select the closest category — standard setup benchmarks will be applied.')}
              </p>
            </div>

            {/* Category Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {categories.map((c) => {
                const bench = CATEGORY_BENCHMARKS[c];
                const isSel = form.business_category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, business_category: c })}
                    data-testid={`category-${c.replace(/\s+/g, '-').toLowerCase()}`}
                    className={`text-left border p-3 transition-all ${
                      isSel
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background hover:border-primary/60'
                    }`}
                  >
                    <div className="text-sm font-semibold leading-tight">{c}</div>
                    {bench && (
                      <div className={`text-[11px] mt-1.5 flex justify-between ${isSel ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        <span>Min Margin: ₹{bench.minMargin.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* If Business Extension is selected, show Expansion Focus */}
            {form.advisory_type === 'expansion' && (
              <div className="border-t border-border pt-6 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-primary">
                    {t(lang, 'expansionType')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'hi' ? 'व्यवसाय बढ़ाने का मुख्य तरीका चुनें ताकि आवश्यक पूंजी का सही अनुमान लग सके।' : 'Select the method of expansion to calculate exact equipment & working capital needs.'}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {EXPANSION_PRESETS.map((p) => {
                    const isSel = form.expansion_type === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setForm({ ...form, expansion_type: p.id })}
                        className={`text-left border p-4 transition-all ${
                          isSel
                            ? 'border-accent bg-accent/10 ring-1 ring-accent'
                            : 'border-border bg-background hover:border-border/80'
                        }`}
                        data-testid={`expansion-${p.id}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-primary">
                            {lang === 'hi' ? p.title_hi : p.title}
                          </span>
                          <span className="text-[11px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded">
                            {p.boost}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: CAPITAL & CAPITAL ADEQUACY & SUBSIDY */}
        {step === 3 && (
          <div className="space-y-8" data-testid="step-capital">
            {form.advisory_type === 'new' ? (
              /* NEW BUSINESS CAPITAL ADEQUACY FLOW */
              <>
                <div>
                  <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-accent font-bold mb-1">
                    <Zap size={14} /> Capital Sufficiency & Scheme Subsidy
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">
                    How much capital can you invest?
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'hi'
                      ? 'अपनी उपलब्ध पूंजी दर्ज करें। सिस्टम तुरंत बताएगा कि यह पूंजी आपके व्यवसाय के लिए पर्याप्त है या नहीं, और कितनी सरकारी सब्सिडी मिलेगी।'
                      : 'Enter your available margin capital. The AI checks if it is sufficient for your chosen enterprise and calculates eligible subsidies.'}
                  </p>
                </div>

                {/* Quick Entrepreneur Category Switcher in Step 3 */}
                <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 border border-border bg-card rounded-lg text-xs" data-testid="step3-entrepreneur-category">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">
                      {lang === 'hi' ? 'आवेदक श्रेणी (सब्सिडी हेतु):' : 'Applicant Category:'}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {form.applicant_category === 'special'
                        ? (lang === 'hi' ? 'विशेष श्रेणी (35% सब्सिडी लागू)' : 'Special Category (35% Subsidy)')
                        : (lang === 'hi' ? 'सामान्य श्रेणी (25% सब्सिडी लागू)' : 'General Category (25% Subsidy)')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, applicant_category: 'special' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        form.applicant_category === 'special'
                          ? 'bg-secondary text-secondary-foreground shadow-sm ring-2 ring-secondary/50'
                          : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                      }`}
                      data-testid="step3-category-special"
                    >
                      {form.applicant_category === 'special' && <CheckCircle2 size={13} />}
                      ⭐ {lang === 'hi' ? 'विशेष श्रेणी (35%)' : 'Special (35%)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, applicant_category: 'general' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        form.applicant_category === 'general'
                          ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/50'
                          : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                      }`}
                      data-testid="step3-category-general"
                    >
                      {form.applicant_category === 'general' && <CheckCircle2 size={13} />}
                      👤 {lang === 'hi' ? 'सामान्य श्रेणी (25%)' : 'General (25%)'}
                    </button>
                  </div>
                </div>

                {/* Capital Input Bar & Slider */}
                <div className="border border-border bg-background p-6 lg:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs tracking-[0.2em] uppercase font-bold text-primary">
                        {t(lang, 'marginCapital')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'hi'
                          ? 'अपनी पूंजी की राशि यहाँ दर्ज करें या स्लाइडर से चुनें:'
                          : 'Enter your available capital or drag the slider:'}
                      </div>
                    </div>

                    {/* Direct Numeric Input Bar */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-48 sm:w-56">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-base text-primary">₹</span>
                        <Input
                          type="number"
                          min={0}
                          step={5000}
                          value={form.margin_capital}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setForm({ ...form, margin_capital: val });
                          }}
                          className="pl-8 text-right font-display font-black text-2xl h-12 text-primary tabular-nums"
                          placeholder="50000"
                          data-testid="capital-input-field"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="space-y-2">
                    <Slider
                      min={5000}
                      max={500000}
                      step={5000}
                      value={[Math.min(500000, form.margin_capital)]}
                      onValueChange={(v) => setForm({ ...form, margin_capital: v[0] })}
                      data-testid="margin-slider"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                      <span>₹5,000</span>
                      <span>₹2,50,000</span>
                      <span>₹5,00,000</span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-xs text-muted-foreground font-semibold">Quick select:</span>
                    {[10000, 25000, 50000, 100000, 200000, 500000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setForm({ ...form, margin_capital: v })}
                        className={`border px-3 py-1.5 text-xs tabular-nums transition-colors ${
                          form.margin_capital === v
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:border-primary'
                        }`}
                        data-testid={`preset-${v}`}
                      >
                        ₹{v.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>

                  {/* VISUAL CAPITAL ADEQUACY GAUGE / PROGRESS BAR */}
                  <div className="pt-4 border-t border-border/60 space-y-2.5" data-testid="capital-adequacy-progress-bar">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-bold text-primary flex items-center gap-1.5">
                        <Zap size={16} className="text-accent" />
                        {lang === 'hi' ? 'व्यवसाय पूंजी पर्याप्तता स्तर' : 'Capital Adequacy vs Business Benchmark'}
                      </span>
                      <span className="font-black tabular-nums">
                        {newBusinessAdequacy.isEnough ? (
                          <span className="text-secondary font-black text-sm">🟢 100% Sufficient</span>
                        ) : (
                          <span className="text-destructive font-black text-sm">
                            🛑 {Math.min(99, Math.round((form.margin_capital / newBusinessAdequacy.minMargin) * 100))}% (Shortfall ₹{newBusinessAdequacy.shortfall.toLocaleString('en-IN')})
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Progress Bar Container with 2 Visual Zones */}
                    <div className="relative h-4 sm:h-5 bg-muted/70 rounded-full overflow-hidden flex border border-border">
                      {/* Red Shortfall Zone (0 to minMargin) */}
                      <div
                        className="h-full bg-destructive/20 border-r border-background"
                        style={{ width: '50%' }}
                        title={`Below ₹${newBusinessAdequacy.minMargin.toLocaleString('en-IN')}: Shortfall`}
                      />
                      {/* Green Sufficient Zone */}
                      <div
                        className="h-full bg-secondary/25"
                        style={{ width: '50%' }}
                        title={`₹${newBusinessAdequacy.minMargin.toLocaleString('en-IN')}+: Sufficient`}
                      />

                      {/* Active Fill Indicator */}
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-300 rounded-full shadow-inner ${
                          newBusinessAdequacy.isEnough
                            ? 'bg-secondary ring-2 ring-secondary/50'
                            : 'bg-destructive ring-2 ring-destructive/50'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              4,
                              form.margin_capital < newBusinessAdequacy.minMargin
                                ? (form.margin_capital / newBusinessAdequacy.minMargin) * 50
                                : 50 + Math.min(50, ((form.margin_capital - newBusinessAdequacy.minMargin) / newBusinessAdequacy.minMargin) * 50)
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    {/* Zone Labels */}
                    <div className="flex justify-between text-[11px] font-bold px-1">
                      <span className="text-destructive">🔴 0 - ₹{newBusinessAdequacy.minMargin.toLocaleString('en-IN')} (कम है / Shortfall)</span>
                      <span className="text-secondary">🟢 ₹{newBusinessAdequacy.minMargin.toLocaleString('en-IN')}+ (पर्याप्त है / Sufficient)</span>
                    </div>
                  </div>
                </div>

                {/* LIVE CAPITAL ADEQUACY & LOAN ELIGIBILITY ALERT */}
                <div
                  className={`border p-5 rounded-lg transition-all ${
                    newBusinessAdequacy.isEnough
                      ? 'border-secondary/60 bg-secondary/10'
                      : 'border-destructive/60 bg-destructive/10'
                  }`}
                  data-testid="capital-adequacy-box"
                >
                  <div className="flex items-start gap-3">
                    {newBusinessAdequacy.isEnough ? (
                      <CheckCircle2 size={24} className="text-secondary flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={24} className="text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-display font-bold text-base sm:text-lg text-primary">
                          {newBusinessAdequacy.isEnough
                            ? (lang === 'hi' ? 'पूंजी पर्याप्त है' : 'Capital is Sufficient')
                            : (lang === 'hi' ? `पूंजी में कमी: ₹${newBusinessAdequacy.shortfall.toLocaleString('en-IN')}` : `Capital Shortfall: ₹${newBusinessAdequacy.shortfall.toLocaleString('en-IN')}`)}
                        </span>
                        <span
                          className={`text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full ${
                            newBusinessAdequacy.isEnough
                              ? 'bg-secondary text-secondary-foreground'
                              : 'bg-destructive text-destructive-foreground'
                          }`}
                        >
                          {newBusinessAdequacy.isEnough ? '100% Sufficient' : 'Need More Funds'}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {newBusinessMessage}
                      </p>

                      {/* Minimum Loan Required & Loan Eligibility Status Panel */}
                      <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-border/60 mt-3 text-xs">
                        <div className="bg-background/90 p-3 rounded border border-border">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            {lang === 'hi' ? 'न्यूनतम आवश्यक बैंक ऋण' : 'Minimum Loan Required'}
                          </span>
                          <span className="font-display font-bold text-lg text-primary block mt-0.5">
                            ₹{newBusinessAdequacy.minLoanNeeded.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-muted-foreground block mt-0.5">
                            {lang === 'hi'
                              ? `न्यूनतम ₹${newBusinessAdequacy.minCost.toLocaleString('en-IN')} के व्यवसाय सेटअप के लिए`
                              : `For ₹${newBusinessAdequacy.minCost.toLocaleString('en-IN')} minimum setup cost`}
                          </span>
                        </div>

                        <div className={`p-3 rounded border ${
                          newBusinessAdequacy.isLoanEligible
                            ? 'bg-secondary/15 border-secondary/50 text-secondary-foreground'
                            : 'bg-destructive/15 border-destructive/50 text-destructive-foreground'
                        }`}>
                          <span className="text-[10px] uppercase font-bold block opacity-90">
                            {lang === 'hi' ? 'ऋण पात्रता स्थिति' : 'Loan Eligibility Status'}
                          </span>
                          <span className="font-display font-bold text-base flex items-center gap-1.5 mt-0.5">
                            {newBusinessAdequacy.isLoanEligible ? (
                              <>
                                <CheckCircle2 size={16} className="text-secondary flex-shrink-0" />
                                <span className="text-secondary font-bold">
                                  {lang === 'hi' ? 'ऋण के लिए पात्र (Eligible)' : 'Eligible for Bank Loan'}
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={16} className="text-destructive flex-shrink-0" />
                                <span className="text-destructive font-bold">
                                  {lang === 'hi' ? 'अपात्र (मार्जिन कम है)' : 'Ineligible (Margin Shortfall)'}
                                </span>
                              </>
                            )}
                          </span>
                          <span className="text-[11px] block mt-0.5 opacity-90">
                            {newBusinessAdequacy.isLoanEligible
                              ? (lang === 'hi'
                                  ? `10% मार्जिन पूरा। आप ₹${newBusinessAdequacy.minLoanNeeded.toLocaleString('en-IN')} से ₹${(form.margin_capital * 9).toLocaleString('en-IN')} तक के ऋण के पात्र हैं।`
                                  : `Promoter margin met. Qualified for ₹${newBusinessAdequacy.minLoanNeeded.toLocaleString('en-IN')} minimum loan.`)
                              : (lang === 'hi'
                                  ? `ऋण पात्रता हेतु ₹${newBusinessAdequacy.shortfall.toLocaleString('en-IN')} और मार्जिन पूंजी जोड़ें।`
                                  : `Need ₹${newBusinessAdequacy.shortfall.toLocaleString('en-IN')} more margin capital to qualify for bank loan.`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Metric Cards: Min Project Cost, Min Loan Required, Loan Eligibility, Eligible Subsidy */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="border border-border p-4 bg-muted/40 rounded-lg">
                    <div className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-1">
                      {lang === 'hi' ? 'न्यूनतम सेटअप लागत' : 'Min Setup Cost'}
                    </div>
                    <div className="font-display font-bold text-xl sm:text-2xl tabular-nums">
                      ₹{newBusinessAdequacy.minCost.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {lang === 'hi' ? 'न्यूनतम जरूरी पैमाना' : 'Minimum viable scale'}
                    </div>
                  </div>

                  <div className="border border-border p-4 bg-muted/40 rounded-lg">
                    <div className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-1">
                      {lang === 'hi' ? 'न्यूनतम आवश्यक लोन' : 'Min Loan Required'}
                    </div>
                    <div className="font-display font-bold text-xl sm:text-2xl tabular-nums text-accent">
                      ₹{newBusinessAdequacy.minLoanNeeded.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {lang === 'hi' ? 'लागत - आपकी पूंजी' : 'Min cost minus margin'}
                    </div>
                  </div>

                  <div className={`border p-4 rounded-lg ${
                    newBusinessAdequacy.isLoanEligible
                      ? 'border-secondary/40 bg-secondary/5'
                      : 'border-destructive/40 bg-destructive/5'
                  }`}>
                    <div className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-1">
                      {lang === 'hi' ? 'ऋण पात्रता स्थिति' : 'Loan Eligibility'}
                    </div>
                    <div className={`font-display font-bold text-xl sm:text-2xl tabular-nums flex items-center gap-1.5 ${
                      newBusinessAdequacy.isLoanEligible ? 'text-secondary' : 'text-destructive'
                    }`}>
                      {newBusinessAdequacy.isLoanEligible ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>{lang === 'hi' ? 'पात्र' : 'Eligible'}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={18} />
                          <span className="text-base sm:text-lg">{lang === 'hi' ? 'अपात्र' : 'Ineligible'}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {newBusinessAdequacy.isLoanEligible
                        ? `Max loan: ₹${(form.margin_capital * 9).toLocaleString('en-IN')}`
                        : `Short by ₹${newBusinessAdequacy.shortfall.toLocaleString('en-IN')}`}
                    </div>
                  </div>

                  <div className="border border-secondary/40 p-4 bg-secondary/5 rounded-lg">
                    <div className="text-xs tracking-[0.12em] uppercase text-secondary font-bold mb-1">
                      {t(lang, 'eligibleSubsidy')}
                    </div>
                    <div className="font-display font-bold text-xl sm:text-2xl tabular-nums text-secondary">
                      ₹{newBusinessAdequacy.subsidyEst.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {newBusinessAdequacy.subsidyPct}% PMEGP Govt Subsidy
                    </div>
                  </div>
                </div>

                {/* SMART LOAN SIZING ("KAAM KA LOAN" / MINIMUM DEBT NEEDED) */}
                <div className="border border-border bg-card p-5 lg:p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-xs tracking-[0.2em] uppercase font-bold text-accent">
                        {t(lang, 'loanMode')}
                      </div>
                      <h3 className="font-display font-bold text-base text-primary">
                        {lang === 'hi' ? 'ऋण आवश्यकता निर्धारण — केवल काम का लोन लें' : 'Smart Loan Sizing — Borrow only what you need'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'hi'
                          ? 'अनावश्यक बड़ा लोन लेने से बचें। अपनी पूंजी के अनुसार न्यूनतम जरूरी कर्ज चुनें ताकि ब्याज बचे।'
                          : 'Avoid taking unnecessary excess debt. Borrow only the required capital to minimize interest burdens.'}
                      </p>
                    </div>
                  </div>

                  {/* Loan Mode Selector Cards */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, loan_mode: 'lean' })}
                      className={`text-left p-4 border transition-all ${
                        form.loan_mode === 'lean'
                          ? 'border-secondary bg-secondary/10 ring-2 ring-secondary'
                          : 'border-border bg-background hover:border-secondary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-primary flex items-center gap-1.5">
                          🛡️ {t(lang, 'leanLoan')}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            newBusinessAdequacy.isLoanEligible
                              ? 'text-secondary bg-secondary/20'
                              : 'text-destructive bg-destructive/20'
                          }`}>
                            {newBusinessAdequacy.isLoanEligible
                              ? (lang === 'hi' ? 'ऋण पात्र' : 'Eligible')
                              : (lang === 'hi' ? 'अपात्र' : 'Shortfall')}
                          </span>
                          <span className="text-[10px] font-bold text-secondary bg-secondary/20 px-2 py-0.5 rounded">
                            {lang === 'hi' ? 'न्यूनतम जरूरी' : 'Min Loan'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(lang, 'leanLoanDesc')}
                      </p>
                      <div className="mt-2 text-xs font-bold text-primary">
                        Minimum Loan: <span className="text-secondary">₹{newBusinessAdequacy.minLoanNeeded.toLocaleString('en-IN')}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, loan_mode: 'growth' })}
                      className={`text-left p-4 border transition-all ${
                        form.loan_mode === 'growth'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary'
                          : 'border-border bg-background hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-primary flex items-center gap-1.5">
                          📈 {t(lang, 'growthLoan')}
                        </span>
                        <span className="text-[10px] font-bold text-accent bg-accent/20 px-2 py-0.5 rounded">
                          {lang === 'hi' ? 'पूर्ण पैमाना' : 'Full Scale'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(lang, 'growthLoanDesc')}
                      </p>
                      <div className="mt-2 text-xs font-bold text-primary">
                        Loan to borrow: <span className="text-accent">₹{newBusinessAdequacy.growthLoanNeeded.toLocaleString('en-IN')}</span>
                      </div>
                    </button>
                  </div>

                  {/* Savings banner if lean loan is selected */}
                  {form.loan_mode === 'lean' && newBusinessAdequacy.interestSaved > 0 && (
                    <div className="border border-secondary/50 bg-secondary/15 p-3 rounded text-xs flex items-center gap-2 text-secondary-foreground font-medium">
                      <Sparkles size={16} className="text-secondary flex-shrink-0" />
                      <span>
                        {lang === 'hi'
                          ? `स्मार्ट बचत: केवल जरूरी लोन लेने से आपको बैंक ब्याज में लगभग ₹${newBusinessAdequacy.interestSaved.toLocaleString('en-IN')} की सीधी बचत होगी!`
                          : `Interest Saving: By choosing a lean loan, you save approx ₹${newBusinessAdequacy.interestSaved.toLocaleString('en-IN')} in total interest over loan tenure!`}
                      </span>
                    </div>
                  )}

                  {/* 4 Metric Cards: Project Cost, Margin, Loan to Borrow, Subsidy */}
                  <div className="grid sm:grid-cols-4 gap-3 text-sm pt-2">
                    <div className="border border-border p-3.5 bg-background">
                      <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
                        {t(lang, 'projectCost')}
                      </div>
                      <div className="font-display font-bold text-xl tabular-nums">
                        ₹{newBusinessAdequacy.activeProjectCost.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {form.loan_mode === 'lean' ? 'Lean Viable Setup' : 'Full 10x Scale'}
                      </div>
                    </div>

                    <div className="border border-border p-3.5 bg-background">
                      <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
                        Your Margin Capital
                      </div>
                      <div className="font-display font-bold text-xl tabular-nums">
                        ₹{form.margin_capital.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Promoter Equity</div>
                    </div>

                    <div className="border border-border p-3.5 bg-background">
                      <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
                        Bank Loan to Borrow
                      </div>
                      <div className="font-display font-bold text-xl tabular-nums text-accent">
                        ₹{newBusinessAdequacy.activeLoan.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {form.loan_mode === 'lean' ? 'Right-Sized Debt' : 'Max 90% Loan'}
                      </div>
                    </div>

                    <div className="border border-secondary/40 p-3.5 bg-secondary/5">
                      <div className="text-[10px] tracking-[0.15em] uppercase text-secondary font-bold mb-1">
                        Eligible Govt Subsidy
                      </div>
                      <div className="font-display font-bold text-xl tabular-nums text-secondary">
                        ₹{newBusinessAdequacy.subsidyEst.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {newBusinessAdequacy.subsidyPct}% PMEGP Margin Grant
                      </div>
                    </div>
                  </div>
                </div>

                {/* COMPREHENSIVE EMI & CASHFLOW AFFORDABILITY CARD */}
                <div className="border border-border bg-card p-5 lg:p-6 space-y-4" data-testid="emi-calculator-card">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-xs tracking-[0.2em] uppercase font-bold text-primary">
                        Loan EMI & Repayment Planner
                      </div>
                      <h3 className="font-display font-bold text-base text-primary">
                        {lang === 'hi' ? 'मासिक किस्त एवं अदायगी विश्लेषण' : 'Monthly EMI & Cashflow Affordability'}
                      </h3>
                    </div>

                    {/* Tenure Pills */}
                    <div className="flex items-center gap-1 bg-muted/40 border border-border p-1 rounded">
                      <span className="text-[11px] text-muted-foreground px-2 font-medium">Tenure:</span>
                      {[3, 5, 7].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setForm({ ...form, tenure_years: yr })}
                          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                            (form.tenure_years || 5) === yr
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {yr} Yrs
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 items-center border border-border/80 p-4 bg-background">
                    {/* Left: Big EMI */}
                    <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t(lang, 'monthlyEmiBadge')}
                      </div>
                      <div className="font-display font-black text-3xl sm:text-4xl text-primary tabular-nums">
                        ₹{newBusinessAdequacy.emiMonthly.toLocaleString('en-IN')}{' '}
                        <span className="text-sm font-normal text-muted-foreground">/ month</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 pt-1">
                        <span>Quarterly: <b>₹{newBusinessAdequacy.quarterlyEmi.toLocaleString('en-IN')}</b></span>
                        <span>Interest: <b>{newBusinessAdequacy.interestRate}% p.a.</b></span>
                      </div>
                      <div className="text-[11px] text-accent font-medium pt-1">
                        ⏳ {newBusinessAdequacy.moratoriumMonths}-Month Moratorium (No principal EMI during business setup)
                      </div>
                    </div>

                    {/* Right: Profit & Affordability Check */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Est. Monthly Business Profit:</span>
                        <span className="font-semibold text-primary">₹{newBusinessAdequacy.monthlyGrossProfit.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Monthly Loan EMI:</span>
                        <span className="font-semibold text-destructive">-₹{newBusinessAdequacy.emiMonthly.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border font-bold">
                        <span className="text-primary">{t(lang, 'profitAfterEmi')}:</span>
                        <span className="text-secondary text-sm">
                          ₹{newBusinessAdequacy.netProfitAfterEmi.toLocaleString('en-IN')} / mo
                        </span>
                      </div>

                      <div className="pt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                            newBusinessAdequacy.affordabilityStatus === 'safe'
                              ? 'bg-secondary/20 text-secondary-foreground'
                              : newBusinessAdequacy.affordabilityStatus === 'moderate'
                              ? 'bg-amber-500/20 text-amber-900'
                              : 'bg-destructive/20 text-destructive'
                          }`}
                        >
                          {newBusinessAdequacy.affordabilityStatus === 'safe' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {newBusinessAdequacy.affordabilityStatus === 'safe'
                            ? t(lang, 'affordabilitySafe')
                            : newBusinessAdequacy.affordabilityStatus === 'moderate'
                            ? t(lang, 'affordabilityModerate')
                            : t(lang, 'affordabilityHeavy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* BUSINESS EXTENSION CAPITAL REQUIRED FLOW */
              <>
                <div>
                  <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-accent font-bold mb-1">
                    <TrendingUp size={14} /> Extension Capital Blueprint
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">
                    {lang === 'hi' ? 'व्यवसाय विस्तार हेतु आवश्यक पूंजी' : 'Capital Required to Extend Business'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'hi'
                      ? 'अपनी चुनी हुई विस्तार योजना के लिए कुल परियोजना लागत, आवश्यक मार्जिन और सरकारी द्वितीय ऋण सब्सिडी देखें।'
                      : 'Detailed financial assessment of how much capital is required to scale your enterprise.'}
                  </p>
                </div>

                {/* 4 Cards: Expansion Cost, Margin Needed, Loan, Subsidy */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="border border-border p-4 bg-background">
                    <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
                      {t(lang, 'expansionProjectCost')}
                    </div>
                    <div className="font-display font-extrabold text-2xl text-primary tabular-nums">
                      ₹{expansionEconomics.expansionProjectCost.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{selectedExpansion.title}</div>
                  </div>

                  <div className="border border-accent/40 p-4 bg-accent/5">
                    <div className="text-[10px] tracking-[0.15em] uppercase text-accent font-bold mb-1">
                      {t(lang, 'requiredExpansionCapital')}
                    </div>
                    <div className="font-display font-extrabold text-2xl text-accent tabular-nums">
                      ₹{expansionEconomics.requiredMargin.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">10% Promoter Contribution</div>
                  </div>

                  <div className="border border-border p-4 bg-background">
                    <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
                      Bank Expansion Loan
                    </div>
                    <div className="font-display font-extrabold text-2xl text-primary tabular-nums">
                      ₹{expansionEconomics.loanNeeded.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">PMEGP 2nd Loan / MUDRA</div>
                  </div>

                  <div className="border border-secondary/40 p-4 bg-secondary/5">
                    <div className="text-[10px] tracking-[0.15em] uppercase text-secondary font-bold mb-1">
                      {t(lang, 'eligibleSubsidy')}
                    </div>
                    <div className="font-display font-extrabold text-2xl text-secondary tabular-nums">
                      ₹{expansionEconomics.subsidyEst.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {expansionEconomics.subsidyPct}% Upgradation Subsidy
                    </div>
                  </div>
                </div>

                {/* Available Capital Input Bar & Slider */}
                <div className="border border-border bg-background p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs tracking-[0.2em] uppercase font-bold text-primary">
                        {t(lang, 'availableExpansionCapital')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'hi' ? 'विस्तार हेतु अपनी उपलब्ध पूंजी दर्ज करें या स्लाइड करें:' : 'Enter your available expansion capital or drag the slider:'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-48 sm:w-56">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-base text-primary">₹</span>
                        <Input
                          type="number"
                          min={0}
                          step={5000}
                          value={form.margin_capital}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setForm({ ...form, margin_capital: val });
                          }}
                          className="pl-8 text-right font-display font-black text-2xl h-12 text-primary tabular-nums"
                          placeholder="35000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Slider
                      min={5000}
                      max={500000}
                      step={5000}
                      value={[Math.min(500000, form.margin_capital)]}
                      onValueChange={(v) => setForm({ ...form, margin_capital: v[0] })}
                      data-testid="margin-slider"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                      <span>₹5,000</span>
                      <span>₹2,50,000</span>
                      <span>₹5,00,000</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar vs Required Margin */}
                  <div className="pt-3 border-t border-border/60 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-semibold">
                        {lang === 'hi' ? 'आवश्यक मार्जिन कवरेज' : 'Expansion Margin Coverage'}
                      </span>
                      <span className="font-bold tabular-nums">
                        {expansionEconomics.isEnough ? (
                          <span className="text-secondary font-bold">🟢 100% Covered (Surplus: ₹{expansionEconomics.surplus.toLocaleString('en-IN')})</span>
                        ) : (
                          <span className="text-accent font-bold">⚠️ Shortfall: ₹{expansionEconomics.shortfall.toLocaleString('en-IN')}</span>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          expansionEconomics.isEnough ? 'bg-secondary' : 'bg-accent'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(5, (form.margin_capital / expansionEconomics.requiredMargin) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time comparison alert */}
                <div
                  className={`border p-5 ${
                    expansionEconomics.isEnough
                      ? 'border-secondary/60 bg-secondary/10'
                      : 'border-accent/60 bg-accent/10'
                  }`}
                  data-testid="expansion-capital-status"
                >
                  <div className="flex items-start gap-3">
                    {expansionEconomics.isEnough ? (
                      <CheckCircle2 size={22} className="text-secondary flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={22} className="text-accent flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-primary">
                          {expansionEconomics.isEnough
                            ? (lang === 'hi' ? 'विस्तार हेतु पूंजी पूरी तरह पर्याप्त है!' : 'Expansion Capital is Sufficient!')
                            : (lang === 'hi' ? `अतिरिक्त ₹${expansionEconomics.shortfall.toLocaleString('en-IN')} पूंजी आवश्यक` : `Additional ₹${expansionEconomics.shortfall.toLocaleString('en-IN')} Capital Required`)}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            expansionEconomics.isEnough
                              ? 'bg-secondary text-secondary-foreground'
                              : 'bg-accent text-accent-foreground'
                          }`}
                        >
                          {expansionEconomics.isEnough ? 'Ready to Expand' : 'Capital Shortfall'}
                        </span>
                      </div>
                      <p className="text-xs text-foreground mt-1 leading-relaxed">
                        {expansionMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Repayment Frequency Toggle */}
            <div className="pt-2">
              <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
                {t(lang, 'repayment')}
              </div>
              <div className="inline-flex border border-border" data-testid="repayment-toggle">
                {['quarterly', 'monthly'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setForm({ ...form, repayment_frequency: freq })}
                    data-testid={`repayment-${freq}`}
                    className={`px-6 py-2 text-sm font-semibold transition-colors ${
                      form.repayment_frequency === freq
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {t(lang, freq)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: GENERATE ADVISORY REPORT */}
        {step === 4 && (
          <div className="space-y-6 text-center py-6" data-testid="step-generate">
            <div className="w-16 h-16 bg-primary text-primary-foreground mx-auto flex items-center justify-center rounded">
              <Sparkles size={28} strokeWidth={1.5} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/15 text-accent text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                {form.advisory_type === 'expansion' ? '🚀 Business Extension Mode' : '🌱 New Enterprise Mode'}
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-primary tracking-tight">
                {lang === 'hi' ? 'आपकी AI परामर्श रिपोर्ट तैयार करने के लिए तैयार' : 'Ready to generate your comprehensive advisory'}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
                Analysing <b>{form.village}</b>, {form.district} for <b>{form.business_category}</b> with ₹
                {form.margin_capital.toLocaleString('en-IN')} capital and government scheme subsidy mapping.
              </p>
            </div>

            {/* Quick pre-generation recap */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left border border-border p-4 bg-muted/20 text-xs">
              <div>
                <span className="text-muted-foreground uppercase text-[10px] block">Mode</span>
                <span className="font-semibold text-primary capitalize">{form.advisory_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase text-[10px] block">Your Capital</span>
                <span className="font-semibold text-primary">₹{form.margin_capital.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase text-[10px] block">
                  {form.advisory_type === 'expansion' ? 'Expansion Cost' : 'Project Cost'}
                </span>
                <span className="font-semibold text-primary">
                  ₹{form.advisory_type === 'expansion' ? expansionEconomics.expansionProjectCost.toLocaleString('en-IN') : newBusinessAdequacy.activeProjectCost.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase text-[10px] block">
                  {form.advisory_type === 'expansion' ? 'Eligible Subsidy' : 'Loan & EMI'}
                </span>
                <span className="font-semibold text-secondary">
                  {form.advisory_type === 'expansion'
                    ? `₹${expansionEconomics.subsidyEst.toLocaleString('en-IN')}`
                    : `₹${newBusinessAdequacy.activeLoan.toLocaleString('en-IN')} (₹${newBusinessAdequacy.emiMonthly.toLocaleString('en-IN')}/mo)`}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={generate}
              disabled={loading}
              className="rounded-full h-14 px-10 gap-2 mt-4"
              data-testid="generate-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> {t(lang, 'generating')}
                </>
              ) : (
                <>
                  {t(lang, 'generate')} <ArrowRight size={18} />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || loading}
            data-testid="back-btn"
          >
            <ArrowLeft size={16} className="mr-1" /> {t(lang, 'back')}
          </Button>
          {step < 4 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="rounded-full px-6"
              data-testid="next-btn"
            >
              {t(lang, 'next')} <ArrowRight size={16} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
