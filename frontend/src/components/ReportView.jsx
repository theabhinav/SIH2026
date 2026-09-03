import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, Download, Sparkles, MapPin, TrendingUp, ShieldAlert, 
  Users, IndianRupee, Target, ListChecks, Landmark, Info, Wallet, 
  FileText, CheckCircle2, Phone, Store, Award, ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SupplyChainMap from '@/components/SupplyChainMap';
import { localizeReport, CATEGORY_I18N } from '@/lib/reportLocalization';

function inr(n) {
  if (n === undefined || n === null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const Section = ({ icon: Icon, title, subtitle, children, testId }) => (
  <div className="border border-border bg-card p-6 lg:p-8 rounded-xl shadow-xs transition-all duration-300 hover:shadow-md" data-testid={testId}>
    <div className="flex items-start gap-4 mb-6">
      <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 rounded-lg shadow-xs">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="font-display font-bold text-xl text-primary tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const SwotCard = ({ label, items, tone }) => (
  <div className={`border border-border p-6 rounded-lg ${tone}`}>
    <div className="text-xs tracking-[0.25em] uppercase font-bold mb-4">{label}</div>
    <ul className="space-y-2 text-sm">
      {items?.map((s, i) => (
        <li key={i} className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0" /><span>{s}</span></li>
      ))}
    </ul>
  </div>
);

const TAB_LABELS = {
  overview: {
    en: 'Overview & Viability',
    hi: 'अवलोकन और व्यवहार्यता',
    mr: 'आढावा आणि व्यवहार्यता',
    ta: 'மதிப்பாய்வு & சாத்தியக்கூறு',
    te: 'అవలోకనం & నివేదిక',
    bn: 'সংক্ষিপ্ত বিবরণ ও সম্ভাব্যতা'
  },
  schemes: {
    en: 'Government Schemes',
    hi: 'सरकारी योजनाएं',
    mr: 'शासकीय योजना',
    ta: 'அரசுத் திட்டங்கள்',
    te: 'ప్రభుత్వ పథకాలు',
    bn: 'সরকারি প্রকল্প'
  },
  swot: {
    en: 'SWOT & Risks',
    hi: 'SWOT और जोखिम',
    mr: 'SWOT आणि धोके',
    ta: 'SWOT & அபாயங்கள்',
    te: 'SWOT & ప్రమాదాలు',
    bn: 'SWOT ও ঝুঁকি'
  },
  pricing: {
    en: 'Market & Pricing',
    hi: 'बाजार और मूल्य निर्धारण',
    mr: 'बाजार व किंमत',
    ta: 'சந்தை & விலை நிர்ணயம்',
    te: 'మార్కెట్ & ధరలు',
    bn: 'বাজার ও মূল্য নির্ধারণ'
  },
  financials: {
    en: 'Revenue & Economics',
    hi: 'राजस्व और अर्थशास्त्र',
    mr: 'महसूल आणि अर्थशास्त्र',
    ta: 'வருவாய் & நிதி',
    te: 'ఆదాయం & ఆర్థికం',
    bn: 'রাজস্ব ও অর্থনীতি'
  },
  roadmap: {
    en: 'Roadmap & Supply Chain',
    hi: 'मार्गदर्शिका और आपूर्ति श्रृंखला',
    mr: 'रस्ता नकाशा व पुरवठा साखळी',
    ta: 'செயல்திட்டம் & விநியோகம்',
    te: 'రోడ్‌ம్యాప్ & సప్లై చైన్',
    bn: 'রোডম্যাপ ও সরবরাহ শৃঙ্খল'
  },
  all: {
    en: 'Full Report (Single View)',
    hi: 'पूर्ण रिपोर्ट (एकल दृश्य)',
    mr: 'संपूर्ण अहवाल',
    ta: 'முழு அறிக்கை',
    te: 'పూర్తి నివేదిక',
    bn: 'সম্পূর্ণ রিপোর্ট'
  }
};

export default function ReportView({ report, onReset }) {
  const { lang } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef();

  const localizedReport = useMemo(() => localizeReport(report, lang), [report, lang]);

  if (!localizedReport) return null;

  const input = localizedReport.input || localizedReport.input_params || {};
  const fin = localizedReport.financials || localizedReport.financial_model || {};
  const rev = localizedReport.revenue_model || localizedReport.feasibility?.revenue_model || {};
  const viability = localizedReport.viability || localizedReport.feasibility?.viability || {};
  const rec = localizedReport.recommendation || localizedReport.feasibility?.recommendation || {};
  const schemes = localizedReport.government_schemes || localizedReport.schemes || localizedReport.feasibility?.government_schemes || [];
  const vendors = localizedReport.nearby_vendors || localizedReport.vendors || localizedReport.feasibility?.vendors || [];
  const supplyChain = localizedReport.supply_chain_map || localizedReport.supply_chain || localizedReport.feasibility?.supply_chain_map || {};
  const narrative = localizedReport.narrative || {};

  const f = {
    ...narrative,
    ...localizedReport.feasibility,
    viability_score: viability.score || localizedReport.feasibility?.viability_score || 75,
    viability_label: viability.label || localizedReport.feasibility?.viability_label || 'Good',
    recommendation: rec,
    revenue_model: rev,
  };

  const downloadPDF = async () => {
    setIsGeneratingPdf(true);
    const el = printRef.current;
    if (!el) {
      setIsGeneratingPdf(false);
      return;
    }
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#F4F1EA', useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= pdfH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
        heightLeft -= pdfH;
      }
      pdf.save(`Grameen-Udyog-${input.village || 'Report'}-${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const yearlySchedule = fin.yearly_schedule || fin.yearly || [];
  const yearlyData = yearlySchedule.map(y => ({ name: `Y${y.year}`, Principal: y.principal, Interest: y.interest }));
  const pieData = [
    { name: t(lang, 'marginLabel') || 'Margin', value: fin.margin_capital || 0, color: 'hsl(var(--secondary))' },
    { name: t(lang, 'loanLabel') || 'Loan', value: fin.approved_loan || 0, color: 'hsl(var(--accent))' },
  ];

  const categoryTitle = CATEGORY_I18N[lang]?.[input.business_category] || input.business_category;

  const TABS = [
    { id: 'overview', label: TAB_LABELS.overview[lang] || TAB_LABELS.overview.en, icon: Sparkles },
    { id: 'schemes', label: TAB_LABELS.schemes[lang] || TAB_LABELS.schemes.en, icon: Landmark, count: schemes.length },
    { id: 'swot', label: TAB_LABELS.swot[lang] || TAB_LABELS.swot.en, icon: Target },
    { id: 'pricing', label: TAB_LABELS.pricing[lang] || TAB_LABELS.pricing.en, icon: IndianRupee },
    { id: 'financials', label: TAB_LABELS.financials[lang] || TAB_LABELS.financials.en, icon: Wallet },
    { id: 'roadmap', label: TAB_LABELS.roadmap[lang] || TAB_LABELS.roadmap.en, icon: ListChecks },
    { id: 'all', label: TAB_LABELS.all[lang] || TAB_LABELS.all.en, icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <Button variant="ghost" onClick={onReset} className="gap-2 font-medium" data-testid="report-back">
          <ArrowLeft size={16} /> {t(lang, 'newAdvisory') || 'New Advisory'}
        </Button>
        <div className="flex items-center gap-3">
          <Button 
            onClick={downloadPDF} 
            disabled={isGeneratingPdf} 
            className="rounded-full px-6 gap-2 shadow-md hover:shadow-lg transition-all" 
            data-testid="download-pdf-btn"
          >
            <Download size={16} /> {isGeneratingPdf ? 'Generating PDF...' : (t(lang, 'downloadPdf') || 'Download PDF')}
          </Button>
        </div>
      </div>

      {/* Main Report Header Banner */}
      <div className="border border-border bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground p-8 lg:p-10 rounded-2xl relative overflow-hidden shadow-xl mb-8">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs tracking-[0.3em] uppercase mb-3 opacity-85">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles size={14} className="text-accent" /> {t(lang, 'feasibilityReportBanner') || 'Feasibility Report · Grameen Udyog'}
            </span>
            <span className="bg-primary-foreground/15 text-primary-foreground px-3 py-1 rounded-full backdrop-blur-sm font-semibold tracking-normal text-xs">
              AI Powered Analysis
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3 leading-tight">
            {categoryTitle}
          </h1>
          <div className="flex items-center gap-2 text-sm opacity-90 mb-6">
            <MapPin size={16} className="text-accent" /> {input.village}, {input.block} · {input.district}, {input.state}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-primary-foreground/20">
            <div className="bg-primary-foreground/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="text-xs tracking-[0.2em] uppercase opacity-70 font-bold">{t(lang, 'viability')}</div>
              <div className="font-display font-black text-3xl sm:text-4xl mt-1 tabular-nums flex items-baseline gap-1">
                {f.viability_score}<span className="text-lg font-normal opacity-70">/100</span>
              </div>
              <div className="text-xs font-semibold text-accent mt-1">{f.viability_label}</div>
            </div>
            <div className="bg-primary-foreground/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="text-xs tracking-[0.2em] uppercase opacity-70 font-bold">{t(lang, 'projectCost')}</div>
              <div className="font-display font-black text-2xl sm:text-3xl mt-1 tabular-nums">{inr(fin.project_cost)}</div>
            </div>
            <div className="bg-primary-foreground/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="text-xs tracking-[0.2em] uppercase opacity-70 font-bold">{t(lang, 'loanEligibility')}</div>
              <div className="font-display font-black text-2xl sm:text-3xl mt-1 tabular-nums text-accent">{inr(fin.approved_loan)}</div>
            </div>
            <div className="bg-primary-foreground/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="text-xs tracking-[0.2em] uppercase opacity-70 font-bold">{t(lang, 'emi')}</div>
              <div className="font-display font-black text-2xl sm:text-3xl mt-1 tabular-nums">{inr(fin.emi)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Segmented Tabs Navigation */}
      <div className="bg-card border border-border p-2 rounded-xl shadow-sm mb-8 sticky top-4 z-20 backdrop-blur-md bg-card/95">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Segment Views */}
      <div className="space-y-8">

        {/* TAB 1: OVERVIEW & VIABILITY */}
        {(activeTab === 'overview' || activeTab === 'all') && (
          <div className="space-y-6 animate-fadeIn">
            {rec.verdict && (() => {
              const toneMap = {
                positive: 'border-secondary/50 bg-secondary/10',
                caution: 'border-accent/50 bg-accent/10',
                warn: 'border-accent/60 bg-accent/10',
                negative: 'border-destructive/50 bg-destructive/10',
              };
              const dotMap = { positive: 'bg-secondary', caution: 'bg-accent', warn: 'bg-accent', negative: 'bg-destructive' };
              return (
                <div className={`border p-8 rounded-xl ${toneMap[rec.tone] || 'border-border bg-card'}`} data-testid="section-recommendation">
                  <div className="flex items-center gap-2 text-xs tracking-[0.25em] uppercase font-bold mb-3">
                    <Award size={16} /> {t(lang, 'recommendation')}
                    <span className={`ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-primary-foreground ${dotMap[rec.tone] || 'bg-primary'}`}>{rec.verdict}</span>
                  </div>
                  <h3 className="font-display font-extrabold text-xl lg:text-2xl text-primary tracking-tight mb-3">{rec.headline}</h3>
                  <p className="text-sm leading-relaxed text-foreground mb-3">{rec.rationale}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{rec.long_term_outlook}</p>
                  {rec.suggested_capital && (
                    <div className="mt-4 inline-flex items-center gap-2 border border-border bg-background px-4 py-2 rounded-lg text-sm">
                      <IndianRupee size={16} className="text-accent" /> {t(lang, 'suggestedCapital') || 'Suggested margin capital:'}
                      <span className="font-display font-bold tabular-nums">{inr(rec.suggested_capital)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid lg:grid-cols-2 gap-6">
              {f.executive_summary && (
                <Section icon={FileText} title={t(lang, 'executiveSummary')} testId="section-summary">
                  <p className="text-base leading-relaxed text-foreground">{f.executive_summary}</p>
                </Section>
              )}

              <Section icon={TrendingUp} title={t(lang, 'marketReach')} subtitle={`${f.market_reach?.radius_km || 8} km radius`} testId="section-market">
                <p className="text-sm leading-relaxed mb-4">{f.market_reach?.consumer_base_estimate}</p>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1 font-bold">{t(lang, 'salesChannels') || 'Sales Channels'}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {f.market_reach?.primary_channels?.map((c, i) => (
                        <span key={i} className="text-xs bg-muted font-medium px-3 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1 font-bold">{t(lang, 'targetCustomers') || 'Target Customers'}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {f.market_reach?.target_segments?.map((c, i) => (
                        <span key={i} className="text-xs bg-secondary/15 text-secondary font-semibold px-3 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* TAB 2: GOVERNMENT SCHEMES */}
        {(activeTab === 'schemes' || activeTab === 'all') && (
          <div className="space-y-6 animate-fadeIn">
            {/* Scheme card + capital pie */}
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 border border-border bg-card p-8 rounded-xl shadow-xs" data-testid="scheme-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs tracking-[0.25em] uppercase text-accent font-bold">{t(lang, 'autoSelectedScheme') || 'Auto-Selected Primary Scheme'}</div>
                    <h3 className="font-display font-extrabold text-2xl text-primary mt-1">{fin.scheme_name}</h3>
                  </div>
                  <Landmark size={32} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                  <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold">{t(lang, 'interestRate')}</div><div className="font-display font-bold text-xl tabular-nums mt-1">{fin.interest_rate}%</div></div>
                  <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold">{t(lang, 'tenure')}</div><div className="font-display font-bold text-xl tabular-nums mt-1">{fin.tenure_years} yrs</div></div>
                  <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold">{t(lang, 'moratorium')}</div><div className="font-display font-bold text-xl tabular-nums mt-1">{fin.moratorium_months} mo</div></div>
                  <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold">{t(lang, 'repayment')}</div><div className="font-display font-bold text-xl tabular-nums mt-1 uppercase">{fin.repayment_frequency}</div></div>
                </div>
                {fin.capped_by_max && (
                  <div className="mt-4 border border-destructive/40 bg-destructive/5 p-4 rounded-lg text-xs text-destructive flex gap-2">
                    <ShieldAlert size={16} className="flex-shrink-0" />
                    Loan requested exceeds scheme max cap ({inr(fin.max_loan_cap)}). Funding gap: {inr(fin.shortfall)}.
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 border border-border bg-card p-6 rounded-xl flex flex-col items-center justify-center shadow-xs">
                <div className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground mb-2">{t(lang, 'capitalMix') || 'Capital Mix'}</div>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={4}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => inr(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-secondary" /><span>{t(lang, 'marginLabel') || 'Margin'}: {inr(fin.margin_capital)}</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent" /><span>{t(lang, 'loanLabel') || 'Loan'}: {inr(fin.approved_loan)}</span></div>
                </div>
              </div>
            </div>

            {/* Government schemes to explore */}
            {schemes.length > 0 && (
              <Section icon={Landmark} title={t(lang, 'exploreSchemes')} subtitle="Compare & apply" testId="section-schemes">
                <div className="grid md:grid-cols-2 gap-4">
                  {schemes.map((s) => (
                    <div key={s.code} className={`border p-6 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${s.primary ? 'border-accent bg-accent/5' : 'border-border bg-background'}`} data-testid={`scheme-${s.code}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-display font-bold text-lg text-primary leading-snug">{s.name}</h4>
                        {s.primary && <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-accent border border-accent/50 bg-accent/10 px-2.5 py-1 rounded-full flex-shrink-0">Best Fit</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3 font-medium">{s.agency}</div>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs mb-3 bg-muted/40 p-3 rounded-lg">
                        <div><span className="text-muted-foreground">Interest:</span> <span className="font-semibold text-foreground">{s.interest_range}</span></div>
                        <div><span className="text-muted-foreground">Max loan:</span> <span className="font-semibold text-foreground">{s.max_loan}</span></div>
                        <div className="col-span-2"><span className="text-muted-foreground">Subsidy:</span> <span className="font-semibold text-accent">{s.subsidy}</span></div>
                        <div className="col-span-2"><span className="text-muted-foreground">Ideal for:</span> <span className="text-foreground">{s.ideal_for}</span></div>
                      </div>
                      <details className="text-xs">
                        <summary className="cursor-pointer font-bold text-primary hover:underline">Documents & eligibility</summary>
                        <div className="mt-2 text-muted-foreground"><b>Eligibility:</b> {s.eligibility}</div>
                        <ul className="mt-2 space-y-1">
                          {s.required_documents?.map((d, i) => <li key={i} className="flex gap-1.5"><CheckCircle2 size={13} className="text-secondary mt-0.5 flex-shrink-0" />{d}</li>)}
                        </ul>
                      </details>
                      {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent font-bold mt-3 hover:underline">Official portal <ExternalLink size={12} /></a>}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* TAB 3: SWOT & RISKS */}
        {(activeTab === 'swot' || activeTab === 'all') && (
          <div className="space-y-6 animate-fadeIn">
            <Section icon={Target} title={t(lang, 'opportunityAndSwot') || 'Opportunity & SWOT'} testId="section-swot">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold mb-2">{t(lang, 'unservedOpportunities') || 'Unserved Opportunities'}</div>
                  <ul className="space-y-2 text-sm">
                    {f.opportunity_analysis?.unserved_niches?.map((n, i) => (
                      <li key={i} className="flex gap-2"><CheckCircle2 size={16} className="text-secondary mt-0.5 flex-shrink-0" /><span className="font-medium">{n}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold mb-2">{t(lang, 'seasonalWindows') || 'Seasonal Windows'}</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {f.opportunity_analysis?.seasonal_windows?.map((c, i) => (
                      <span key={i} className="text-xs border border-border bg-muted/30 px-3 py-1 rounded-md font-semibold">{c}</span>
                    ))}
                  </div>
                  <p className="text-sm italic text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">{f.opportunity_analysis?.recommended_positioning}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SwotCard label={t(lang, 'strengths')} items={f.swot?.strengths} tone="bg-secondary/10 border-secondary/40 text-secondary" />
                <SwotCard label={t(lang, 'weaknesses')} items={f.swot?.weaknesses} tone="bg-muted text-foreground" />
                <SwotCard label={t(lang, 'opportunities')} items={f.swot?.opportunities} tone="bg-accent/10 border-accent/40 text-accent" />
                <SwotCard label={t(lang, 'threats')} items={f.swot?.threats} tone="bg-destructive/10 border-destructive/40 text-destructive" />
              </div>

              {f.threats_detailed?.length > 0 && (
                <div className="mt-8 border-t border-border pt-6">
                  <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold mb-4">{t(lang, 'riskMitigation') || 'Risk Mitigation Strategies'}</div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {f.threats_detailed?.map((th, i) => (
                      <div key={i} className="border border-border p-4 rounded-xl bg-background shadow-xs">
                        <div className="font-bold text-primary mb-1 text-sm">{th.threat}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">{th.mitigation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* TAB 4: MARKET & PRICING */}
        {(activeTab === 'pricing' || activeTab === 'all') && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid lg:grid-cols-2 gap-6">
              <Section icon={Users} title={t(lang, 'competitors')} subtitle={f.competitor_mapping?.competition_level} testId="section-competitors">
                <p className="text-sm leading-relaxed mb-4">{f.competitor_mapping?.estimated_density}</p>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold mb-1">{t(lang, 'keyCompetitorTypes') || 'Key Competitor Types'}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {f.competitor_mapping?.key_competitors_type?.map((c, i) => (
                        <span key={i} className="text-xs border border-border bg-muted/30 px-3 py-1 rounded-full font-medium">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold mb-1">{t(lang, 'differentiationStrategy') || 'Differentiation Strategy'}</div>
                    <p className="text-sm bg-accent/5 p-3 rounded-lg border border-accent/20 font-medium">{f.competitor_mapping?.differentiation_strategy}</p>
                  </div>
                </div>
              </Section>

              <Section icon={IndianRupee} title={t(lang, 'pricingStrategy') || 'Pricing Strategy'} testId="section-pricing">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold mb-1">{t(lang, 'suggestedPriceRange') || 'Suggested Price Range'}</div>
                    <div className="font-display font-extrabold text-2xl lg:text-3xl text-primary tabular-nums mb-4">{f.product_market_value?.suggested_price_range}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{f.product_market_value?.regional_purchasing_power_note}</p>
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t(lang, 'strategy') || 'Strategy'}</div>
                    <div className="text-sm font-bold mt-1 text-accent">{f.product_market_value?.pricing_strategy}</div>
                  </div>
                  <div className="border-l border-border pl-4 space-y-4">
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground font-bold">{t(lang, 'monthlyPotentialLow') || 'Monthly Potential (Low)'}</div>
                      <div className="font-display font-bold text-xl tabular-nums mt-1">{inr(f.product_market_value?.monthly_revenue_potential_low)}</div>
                    </div>
                    <div className="bg-accent/10 p-3 rounded-lg border border-accent/30">
                      <div className="text-xs text-muted-foreground font-bold">{t(lang, 'monthlyPotentialHigh') || 'Monthly Potential (High)'}</div>
                      <div className="font-display font-bold text-xl tabular-nums text-accent mt-1">{inr(f.product_market_value?.monthly_revenue_potential_high)}</div>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* TAB 5: REVENUE & ECONOMICS */}
        {(activeTab === 'financials' || activeTab === 'all') && (
          <div className="space-y-6 animate-fadeIn">
            {rev.monthly_revenue !== undefined && (
              <Section icon={Wallet} title={t(lang, 'revenueModel')} subtitle="Projected monthly economics" testId="section-revenue">
                <p className="text-sm leading-relaxed text-foreground mb-6">{rev.description}</p>
                <div className="grid lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3">
                    <div className="flex items-baseline justify-between mb-4 bg-muted/40 p-4 rounded-xl">
                      <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold">{t(lang, 'projectedMonthlyRevenue') || 'Projected Monthly Revenue'}</span>
                      <span className="font-display font-black text-2xl lg:text-3xl text-primary tabular-nums">{inr(rev.monthly_revenue)}</span>
                    </div>
                    <div className="space-y-3">
                      {rev.cost_breakdown?.map((c, i) => {
                        const pct = rev.monthly_revenue > 0 ? Math.min(100, (c.value / rev.monthly_revenue) * 100) : 0;
                        return (
                          <div key={i} className="bg-background p-3 rounded-lg border border-border">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-semibold">{c.label}</span>
                              <span className="tabular-nums font-bold text-muted-foreground">{inr(c.value)}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} /></div>
                            <div className="text-[11px] text-muted-foreground mt-1">{c.note}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-2 gap-3 content-start">
                    {[
                      [t(lang, 'operatingCost') || 'Operating Cost', inr(rev.operating_cost_total), ''],
                      [t(lang, 'loanEmiMonthly') || 'Loan EMI (mo.)', inr(rev.loan_servicing_monthly), ''],
                      [t(lang, 'grossProfit') || 'Gross Profit', inr(rev.gross_profit_monthly), 'text-secondary'],
                      [t(lang, 'netProfitMonthly') || 'Net Profit (mo.)', inr(rev.net_profit_monthly), rev.net_profit_monthly >= 0 ? 'text-secondary' : 'text-destructive'],
                      [t(lang, 'netMargin') || 'Net Margin', `${rev.net_margin_pct}%`, ''],
                      [t(lang, 'annualRoi') || 'Annual ROI', `${rev.roi_annual_pct}%`, 'text-accent'],
                      [t(lang, 'breakeven') || 'Break-even', rev.break_even_months ? `${rev.break_even_months} mo` : '—', ''],
                      [t(lang, 'annualNet') || 'Annual Net', inr(rev.annual_net_profit), ''],
                    ].map(([label, val, cls]) => (
                      <div key={label} className="border border-border p-3.5 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-bold">{label}</div>
                        <div className={`font-display font-black text-xl tabular-nums mt-1 ${cls}`}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {yearlyData.length > 0 && (
              <Section icon={TrendingUp} title={t(lang, 'amortisationSchedule')} subtitle={t(lang, 'amortisationSubtitle') || '7-year principal & interest repayment'} testId="section-amortisation">
                <div className="w-full h-72 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip formatter={(v) => inr(v)} />
                      <Legend />
                      <Bar dataKey="Principal" name={t(lang, 'principal') || 'Principal'} fill="hsl(var(--primary))" stackId="a" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Interest" name={t(lang, 'interest') || 'Interest'} fill="hsl(var(--accent))" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Section>
            )}
          </div>
        )}

        {/* TAB 6: ROADMAP & SUPPLY CHAIN */}
        {(activeTab === 'roadmap' || activeTab === 'all') && (
          <div className="space-y-6 animate-fadeIn">
            <Section icon={ListChecks} title={t(lang, 'actionRoadmap')} testId="section-roadmap">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs tracking-[0.15em] uppercase text-accent font-bold mb-4">{t(lang, 'stepImplementation') || '5-Step Implementation Plan'}</div>
                  <ol className="space-y-3">
                    {f.action_roadmap?.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm bg-muted/20 p-3 rounded-lg border border-border/60">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-xs">{i + 1}</span>
                        <span className="leading-relaxed font-medium">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <div className="text-xs tracking-[0.15em] uppercase text-accent font-bold mb-4">{t(lang, 'requiredDocs') || 'Required Documents & Subsidies'}</div>
                  <ul className="space-y-2 text-sm mb-4">
                    {f.government_support?.required_documents?.map((d, i) => (
                      <li key={i} className="flex gap-2"><CheckCircle2 size={16} className="text-secondary mt-0.5 flex-shrink-0" /><span className="font-medium">{d}</span></li>
                    ))}
                  </ul>
                  {f.government_support?.subsidies?.map((s, i) => (
                    <div key={i} className="border border-accent/40 bg-accent/10 p-3.5 rounded-lg text-xs mb-2 font-semibold text-accent">{s}</div>
                  ))}
                  {f.government_support?.notes && (
                    <div className="border border-border bg-muted/40 p-3.5 rounded-lg text-xs text-muted-foreground flex gap-2"><Info size={16} className="flex-shrink-0" />{f.government_support.notes}</div>
                  )}
                  {f.cultural_local_note && (
                    <div className="mt-4 border-t border-border pt-4 italic text-sm text-muted-foreground">{f.cultural_local_note}</div>
                  )}
                </div>
              </div>
            </Section>

            {/* Nearby vendors */}
            {vendors.length > 0 && (
              <Section icon={Store} title={t(lang, 'vendors')} subtitle="Supplier price & contact" testId="section-vendors">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        {['Type', 'Vendor', 'Item', 'Price', 'Contact', 'Distance', 'Rating'].map((h) => (
                          <th key={h} className="py-2.5 text-xs tracking-[0.15em] uppercase text-muted-foreground font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map((v, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30" data-testid={`vendor-row-${i}`}>
                          <td className="py-3 pr-3"><span className="text-[10px] tracking-[0.1em] uppercase border border-border bg-muted/40 px-2 py-1 rounded-md font-semibold">{v.vendor_type}</span></td>
                          <td className="py-3 pr-3 font-semibold">{v.name}<div className="text-[11px] text-muted-foreground font-normal">{v.location}</div></td>
                          <td className="py-3 pr-3">{v.item}<div className="text-[11px] text-muted-foreground">{v.unit}</div></td>
                          <td className="py-3 pr-3 tabular-nums font-bold text-primary">{inr(v.price)}</td>
                          <td className="py-3 pr-3"><span className="flex items-center gap-1 text-xs font-medium"><Phone size={12} /> {v.contact}</span></td>
                          <td className="py-3 pr-3 tabular-nums text-muted-foreground">{v.distance_km} km</td>
                          <td className="py-3 tabular-nums font-bold text-amber-600">⭐ {v.rating}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Vendor estimates are indicative. Find community-verified suppliers and add your own on the Community page.</p>
              </Section>
            )}

            {/* Supply chain map */}
            {supplyChain.stages && (
              <Section icon={Target} title={t(lang, 'supplyChain')} subtitle="Hyper-local procurement & distribution" testId="section-supply-chain">
                <SupplyChainMap map={supplyChain} category={input.business_category} village={input.village} />
              </Section>
            )}
          </div>
        )}

      </div>

      {/* Hidden Full Printable Report Container for PDF Generation */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-[#F4F1EA] text-slate-900 space-y-6 max-w-4xl mx-auto">
          <div className="border border-slate-300 bg-emerald-950 text-white p-8 rounded-xl">
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-2">Grameen Udyog Advisory Report</div>
            <h1 className="text-3xl font-black">{categoryTitle}</h1>
            <p className="text-sm opacity-90 mt-1">{input.village}, {input.block}, {input.district}, {input.state}</p>
            <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-emerald-800 text-center">
              <div><div className="text-[10px] uppercase opacity-70">Viability Score</div><div className="text-2xl font-bold">{f.viability_score}/100</div></div>
              <div><div className="text-[10px] uppercase opacity-70">Project Cost</div><div className="text-xl font-bold">{inr(fin.project_cost)}</div></div>
              <div><div className="text-[10px] uppercase opacity-70">Approved Loan</div><div className="text-xl font-bold text-amber-400">{inr(fin.approved_loan)}</div></div>
              <div><div className="text-[10px] uppercase opacity-70">Monthly EMI</div><div className="text-xl font-bold">{inr(fin.emi)}</div></div>
            </div>
          </div>

          {rec.verdict && (
            <div className="border border-slate-300 p-6 bg-white rounded-xl">
              <h3 className="font-bold text-lg text-emerald-900 mb-2">Recommendation: {rec.verdict}</h3>
              <p className="text-sm mb-2">{rec.headline}</p>
              <p className="text-xs text-slate-600">{rec.rationale}</p>
            </div>
          )}

          <div className="border border-slate-300 p-6 bg-white rounded-xl">
            <h3 className="font-bold text-lg text-slate-900 mb-3">Primary Scheme: {fin.scheme_name}</h3>
            <div className="grid grid-cols-4 gap-2 text-xs bg-slate-100 p-3 rounded-lg">
              <div>Interest: <b>{fin.interest_rate}%</b></div>
              <div>Tenure: <b>{fin.tenure_years} yrs</b></div>
              <div>Moratorium: <b>{fin.moratorium_months} mo</b></div>
              <div>Repayment: <b className="uppercase">{fin.repayment_frequency}</b></div>
            </div>
          </div>

          {f.executive_summary && (
            <div className="border border-slate-300 p-6 bg-white rounded-xl">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Executive Summary</h3>
              <p className="text-sm text-slate-700">{f.executive_summary}</p>
            </div>
          )}

          <div className="border border-slate-300 p-6 bg-white rounded-xl">
            <h3 className="font-bold text-lg text-slate-900 mb-3">SWOT Analysis</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-50 p-3 rounded"><b>Strengths:</b> {f.swot?.strengths?.join(', ')}</div>
              <div className="bg-slate-50 p-3 rounded"><b>Weaknesses:</b> {f.swot?.weaknesses?.join(', ')}</div>
              <div className="bg-amber-50 p-3 rounded"><b>Opportunities:</b> {f.swot?.opportunities?.join(', ')}</div>
              <div className="bg-rose-50 p-3 rounded"><b>Threats:</b> {f.swot?.threats?.join(', ')}</div>
            </div>
          </div>

          {rev.monthly_revenue !== undefined && (
            <div className="border border-slate-300 p-6 bg-white rounded-xl">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Revenue & Financial Breakdown</h3>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                <div>Monthly Rev: {inr(rev.monthly_revenue)}</div>
                <div>Net Profit: {inr(rev.net_profit_monthly)}</div>
                <div>Annual ROI: {rev.roi_annual_pct}%</div>
              </div>
            </div>
          )}

          {f.action_roadmap?.length > 0 && (
            <div className="border border-slate-300 p-6 bg-white rounded-xl">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Action Roadmap</h3>
              <ol className="text-xs space-y-1 list-decimal list-inside">
                {f.action_roadmap.map((st, i) => <li key={i}>{st}</li>)}
              </ol>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
