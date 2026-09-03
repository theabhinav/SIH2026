import React, { useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, Sparkles, MapPin, TrendingUp, ShieldAlert, Users, IndianRupee, Target, ListChecks, Landmark, Info, Wallet, FileText, CheckCircle2, Phone, Store, Award, ExternalLink, AlertTriangle, Zap, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SupplyChainMap from '@/components/SupplyChainMap';

function inr(n) {
  if (n === undefined || n === null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const Section = ({ icon: Icon, title, subtitle, children, testId }) => (
  <div className="border border-border bg-card p-8" data-testid={testId}>
    <div className="flex items-start gap-4 mb-6">
      <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
        <Icon size={18} strokeWidth={1.75} />
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
  <div className={`border border-border p-6 ${tone}`}>
    <div className="text-xs tracking-[0.25em] uppercase font-bold mb-4">{label}</div>
    <ul className="space-y-2 text-sm">
      {items?.map((s, i) => (
        <li key={i} className="flex gap-2"><span className="w-1 h-1 bg-current mt-2 flex-shrink-0" /><span>{s}</span></li>
      ))}
    </ul>
  </div>
);

export default function ReportView({ report, onReset }) {
  const { lang } = useApp();
  const printRef = useRef();

  if (!report) return null;

  const input = report.input || report.input_params || {};
  const fin = report.financials || report.financial_model || {};
  const rev = report.revenue_model || report.feasibility?.revenue_model || {};
  const viability = report.viability || report.feasibility?.viability || {};
  const rec = report.recommendation || report.feasibility?.recommendation || {};
  const schemes = report.government_schemes || report.schemes || report.feasibility?.government_schemes || [];
  const vendors = report.nearby_vendors || report.vendors || report.feasibility?.vendors || [];
  const supplyChain = report.supply_chain_map || report.supply_chain || report.feasibility?.supply_chain_map || {};
  const narrative = report.narrative || {};

  const isExpansion = report.advisory_type === 'expansion' || input.advisory_type === 'expansion';
  const adequacy = report.capital_adequacy || {
    is_enough: (fin.margin_capital || 0) >= 10000,
    status: (fin.margin_capital || 0) >= 10000 ? 'sufficient' : 'shortfall',
    badge_text: (fin.margin_capital || 0) >= 10000 ? 'Capital is Sufficient' : 'Capital Shortfall',
    min_required_margin: 10000,
    min_project_cost: 100000,
    shortfall: Math.max(0, 10000 - (fin.margin_capital || 0)),
    message: (fin.margin_capital || 0) >= 10000 ? 'Capital meets minimum setup requirement.' : 'Capital is below minimum setup requirement.',
    advice: 'Government subsidy under PMEGP provides up to 35% margin money assistance.',
  };
  const expansionModel = report.expansion_model;
  const primaryScheme = schemes.find((s) => s.primary) || schemes[0] || {};
  const maxSubsidy = schemes.reduce((m, s) => Math.max(m, s.exact_subsidy_amount || 0), 0) || primaryScheme.exact_subsidy_amount || Math.round(fin.project_cost * 0.25);

  const f = {
    ...narrative,
    ...report.feasibility,
    viability_score: viability.score || report.feasibility?.viability_score || 75,
    viability_label: viability.label || report.feasibility?.viability_label || 'Good',
    recommendation: rec,
    revenue_model: rev,
  };

  const downloadPDF = async () => {
    const el = printRef.current;
    if (!el) return;
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
  };

  const yearlySchedule = fin.yearly_schedule || fin.yearly || [];
  const yearlyData = yearlySchedule.map(y => ({ name: `Y${y.year}`, Principal: y.principal, Interest: y.interest }));
  const pieData = [
    { name: 'Margin', value: fin.margin_capital || 0, color: 'hsl(var(--secondary))' },
    { name: 'Loan', value: fin.approved_loan || 0, color: 'hsl(var(--accent))' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Button variant="ghost" onClick={onReset} data-testid="report-back">
          <ArrowLeft size={16} className="mr-2" /> New Advisory
        </Button>
        <Button onClick={downloadPDF} className="rounded-full px-6 gap-2" data-testid="download-pdf-btn">
          <Download size={16} /> {t(lang, 'downloadPdf')}
        </Button>
      </div>

      <div ref={printRef} className="space-y-6">
        {/* Header banner */}
        <div className="border border-border bg-primary text-primary-foreground p-8 lg:p-10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs tracking-[0.3em] uppercase mb-4 opacity-80">
              <Sparkles size={12} /> {isExpansion ? 'Business Extension Advisory' : 'Feasibility Report'} · Grameen Udyog
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider rounded-full border border-accent/40">
                {isExpansion ? '🚀 Business Extension & Upgradation' : '🌱 New Enterprise Setup'}
              </span>
            </div>
            <h1 className="font-display text-3xl lg:text-5xl font-black tracking-tight mb-3 leading-tight">
              {input.business_category}
            </h1>
            <div className="flex items-center gap-2 text-sm opacity-90 mb-6">
              <MapPin size={14} /> {input.village}, {input.block} · {input.district}, {input.state}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-primary-foreground/20">
              <div>
                <div className="text-xs tracking-[0.2em] uppercase opacity-70">{t(lang, 'viability')}</div>
                <div className="font-display font-black text-4xl mt-1 tabular-nums">{f.viability_score}<span className="text-xl opacity-60">/100</span></div>
                <div className="text-xs opacity-80 mt-1">{f.viability_label}</div>
              </div>
              <div>
                <div className="text-xs tracking-[0.2em] uppercase opacity-70">
                  {isExpansion ? (lang === 'hi' ? 'कुल विस्तार लागत' : 'Total Expansion Cost') : t(lang, 'projectCost')}
                </div>
                <div className="font-display font-black text-2xl mt-1 tabular-nums">
                  {inr(isExpansion && expansionModel ? expansionModel.expansion_project_cost : fin.project_cost)}
                </div>
              </div>
              <div>
                <div className="text-xs tracking-[0.2em] uppercase opacity-70">
                  {isExpansion ? (lang === 'hi' ? 'विस्तार ऋण' : 'Expansion Loan') : t(lang, 'loanEligibility')}
                </div>
                <div className="font-display font-black text-2xl mt-1 tabular-nums text-accent">
                  {inr(isExpansion && expansionModel ? expansionModel.loan_needed : fin.approved_loan)}
                </div>
              </div>
              <div>
                <div className="text-xs tracking-[0.2em] uppercase opacity-70">
                  {lang === 'hi' ? 'पात्र सरकारी सब्सिडी' : 'Eligible Govt Subsidy'}
                </div>
                <div className="font-display font-black text-2xl mt-1 tabular-nums text-secondary">
                  {inr(maxSubsidy)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        {rec.verdict && (() => {
          const toneMap = {
            positive: 'border-secondary/50 bg-secondary/10',
            caution: 'border-accent/50 bg-accent/10',
            warn: 'border-accent/60 bg-accent/10',
            negative: 'border-destructive/50 bg-destructive/10',
          };
          const dotMap = { positive: 'bg-secondary', caution: 'bg-accent', warn: 'bg-accent', negative: 'bg-destructive' };
          return (
            <div className={`border p-8 ${toneMap[rec.tone] || 'border-border bg-card'}`} data-testid="section-recommendation">
              <div className="flex items-center gap-2 text-xs tracking-[0.25em] uppercase font-bold mb-3">
                <Award size={14} /> {t(lang, 'recommendation')}
                <span className={`ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-primary-foreground ${dotMap[rec.tone] || 'bg-primary'}`}>{rec.verdict}</span>
              </div>
              <h3 className="font-display font-extrabold text-xl lg:text-2xl text-primary tracking-tight mb-3">{rec.headline}</h3>
              <p className="text-sm leading-relaxed text-foreground mb-3">{rec.rationale}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{rec.long_term_outlook}</p>
              {rec.suggested_capital && (
                <div className="mt-4 inline-flex items-center gap-2 border border-border bg-background px-4 py-2 text-sm">
                  <IndianRupee size={14} className="text-accent" /> Suggested margin capital:
                  <span className="font-display font-bold tabular-nums">{inr(rec.suggested_capital)}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Dedicated Capital Adequacy & Investment Assessment Card */}
        <div className="border border-border bg-card p-8" data-testid="section-capital-assessment">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                <Zap size={18} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-primary tracking-tight">
                  {isExpansion
                    ? (lang === 'hi' ? 'व्यवसाय विस्तार एवं पूंजी आवश्यकता विश्लेषण' : 'Business Extension & Capital Assessment')
                    : (lang === 'hi' ? 'पूंजी पर्याप्तता एवं निवेश विश्लेषण' : 'Capital Adequacy & Investment Assessment')}
                </h3>
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-0.5">
                  {isExpansion
                    ? (lang === 'hi' ? 'विस्तार हेतु आवश्यक पूंजी और अपेक्षित वृद्धि' : 'Capital required to extend vs available funds & ROI')
                    : (lang === 'hi' ? 'व्यवसाय शुरू करने के लिए आपकी पूंजी पर्याप्त है या नहीं' : 'Evaluation of your starting capital adequacy & safety margin')}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            {isExpansion ? (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                  expansionModel?.is_enough
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-accent text-accent-foreground'
                }`}
              >
                {expansionModel?.is_enough ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {expansionModel?.is_enough
                  ? (lang === 'hi' ? 'विस्तार हेतु पूंजी पर्याप्त है' : 'Expansion Capital Sufficient')
                  : (lang === 'hi' ? `अतिरिक्त ₹${expansionModel?.shortfall?.toLocaleString('en-IN')} पूंजी आवश्यक` : `Shortfall: ${inr(expansionModel?.shortfall)}`)}
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                  adequacy.status === 'sufficient'
                    ? 'bg-secondary text-secondary-foreground'
                    : adequacy.status === 'marginal'
                    ? 'bg-amber-500 text-white'
                    : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {adequacy.status === 'sufficient' ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <AlertTriangle size={13} />
                )}
                {adequacy.status === 'sufficient'
                  ? (lang === 'hi' ? 'पूंजी पूर्णतः पर्याप्त एवं सुरक्षित' : 'Capital is Fully Sufficient')
                  : adequacy.status === 'marginal'
                  ? (lang === 'hi' ? 'न्यूनतम कामचलाऊ पूंजी' : 'Marginal / Minimum Viable')
                  : (lang === 'hi' ? `पूंजी में कमी: ${inr(adequacy.shortfall)}` : `Capital Shortfall: ${inr(adequacy.shortfall)}`)}
              </span>
            )}
          </div>

          {/* Cards Grid */}
          {isExpansion && expansionModel ? (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="border border-border p-4 bg-muted/20">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold">Total Expansion Cost</div>
                  <div className="font-display font-bold text-2xl text-primary tabular-nums mt-1">
                    {inr(expansionModel.expansion_project_cost)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{expansionModel.expansion_name}</div>
                </div>

                <div className="border border-accent/40 p-4 bg-accent/5">
                  <div className="text-[10px] uppercase text-accent font-semibold">Required Promoter Margin</div>
                  <div className="font-display font-bold text-2xl text-accent tabular-nums mt-1">
                    {inr(expansionModel.required_margin_capital)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">10% Personal Contribution</div>
                </div>

                <div className="border border-border p-4 bg-muted/20">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold">Your Available Capital</div>
                  <div className="font-display font-bold text-2xl text-primary tabular-nums mt-1">
                    {inr(expansionModel.available_margin)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {expansionModel.is_enough ? `Surplus: ${inr(expansionModel.surplus)}` : `Shortfall: ${inr(expansionModel.shortfall)}`}
                  </div>
                </div>

                <div className="border border-secondary/40 p-4 bg-secondary/5">
                  <div className="text-[10px] uppercase text-secondary font-semibold">Eligible Govt Subsidy</div>
                  <div className="font-display font-bold text-2xl text-secondary tabular-nums mt-1">
                    {inr(maxSubsidy)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">PMEGP 2nd Loan / Upgradation</div>
                </div>
              </div>

              {/* Expansion Revenue Impact & Payback */}
              <div className="grid sm:grid-cols-3 gap-3 p-4 border border-border bg-background text-sm">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block">Turnover Boost</span>
                  <span className="font-display font-bold text-lg text-primary">
                    +{expansionModel.growth_percentage}% ({inr(expansionModel.incremental_monthly_revenue)}/mo)
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block">Extra Monthly Profit</span>
                  <span className="font-display font-bold text-lg text-secondary">
                    +{inr(expansionModel.incremental_monthly_profit)}/month
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block">Estimated Payback Period</span>
                  <span className="font-display font-bold text-lg text-accent">
                    ~{expansionModel.payback_months} Months ({expansionModel.expansion_roi_annual}% Annual ROI)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="border border-border p-4 bg-muted/20">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold">Your Invested Capital</div>
                  <div className="font-display font-bold text-2xl text-primary tabular-nums mt-1">
                    {inr(fin.margin_capital)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Margin contribution</div>
                </div>

                <div className="border border-border p-4 bg-muted/20">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold">Minimum Required Margin</div>
                  <div className="font-display font-bold text-2xl text-primary tabular-nums mt-1">
                    {inr(adequacy.min_required_margin)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">For {input.business_category}</div>
                </div>

                <div className="border border-border p-4 bg-muted/20">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold">Total Supported Project</div>
                  <div className="font-display font-bold text-2xl text-accent tabular-nums mt-1">
                    {inr(fin.project_cost)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">10x of your margin capital</div>
                </div>

                <div className="border border-secondary/40 p-4 bg-secondary/5">
                  <div className="text-[10px] uppercase text-secondary font-semibold">Eligible Govt Subsidy</div>
                  <div className="font-display font-bold text-2xl text-secondary tabular-nums mt-1">
                    {inr(maxSubsidy)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Direct Margin Money Grant</div>
                </div>
              </div>

              {/* Minimum Loan Required and Loan Eligibility Status Banner */}
              <div className="grid sm:grid-cols-2 gap-3 mb-4 text-xs">
                <div className="border border-border p-3 bg-muted/20 rounded">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                    {lang === 'hi' ? 'न्यूनतम आवश्यक बैंक ऋण' : 'Minimum Loan Required'}
                  </span>
                  <span className="font-display font-bold text-xl text-primary block mt-0.5">
                    {inr(adequacy.min_loan_required || Math.max(0, (adequacy.min_project_cost || 100000) - (fin.margin_capital || 0)))}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {lang === 'hi' ? 'न्यूनतम व्यवहार्य इकाई सेटअप के लिए' : 'For baseline minimum viable setup'}
                  </span>
                </div>

                <div className={`border p-3 rounded ${
                  adequacy.is_enough
                    ? 'border-secondary/50 bg-secondary/10 text-secondary-foreground'
                    : 'border-destructive/50 bg-destructive/10 text-destructive-foreground'
                }`}>
                  <span className="text-[10px] uppercase font-semibold block opacity-90">
                    {lang === 'hi' ? 'ऋण पात्रता स्थिति' : 'Loan Eligibility Status'}
                  </span>
                  <span className="font-display font-bold text-base flex items-center gap-1.5 mt-0.5">
                    {adequacy.is_enough ? (
                      <>
                        <CheckCircle2 size={16} className="text-secondary flex-shrink-0" />
                        <span className="text-secondary">
                          {lang === 'hi' ? 'ऋण के लिए पात्र (Eligible)' : 'Eligible for Bank Loan'}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} className="text-destructive flex-shrink-0" />
                        <span className="text-destructive">
                          {lang === 'hi' ? 'अपात्र (मार्जिन कम है)' : 'Ineligible (Margin Shortfall)'}
                        </span>
                      </>
                    )}
                  </span>
                  <span className="text-[11px] block mt-0.5 opacity-90">
                    {adequacy.is_enough
                      ? (lang === 'hi' ? '10% न्यूनतम प्रमोटर मार्जिन मानदंड पूरा। बैंक ऋण हेतु अनुमोदित।' : 'Promoter margin criteria satisfied. Approved for bank loan processing.')
                      : (lang === 'hi' ? `ऋण पात्रता हेतु ₹${(adequacy.shortfall || 0).toLocaleString('en-IN')} और मार्जिन जोड़ें।` : `Need ${inr(adequacy.shortfall)} more promoter margin to qualify for bank loan.`)}
                  </span>
                </div>
              </div>

              {/* Capex and Working Capital Benchmarks */}
              {adequacy.capex_min && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
                  <div className="border border-border p-2.5 bg-background">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Min Fixed Capex</span>
                    <span className="font-bold text-primary">{inr(adequacy.capex_min)}</span>
                  </div>
                  <div className="border border-border p-2.5 bg-background">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">45-Day Stock / Opex</span>
                    <span className="font-bold text-primary">{inr(adequacy.working_capital_min)}</span>
                  </div>
                  <div className="border border-border p-2.5 bg-background">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Min Margin Required</span>
                    <span className="font-bold text-primary">{inr(adequacy.min_required_margin)}</span>
                  </div>
                  <div className="border border-border p-2.5 bg-background">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Safe Recommended Margin</span>
                    <span className="font-bold text-secondary">{inr(adequacy.recommended_margin)}</span>
                  </div>
                </div>
              )}

              <div className="p-4 border border-border bg-background text-sm space-y-1.5">
                <div className="font-semibold text-primary">{adequacy.message}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{adequacy.advice}</div>
              </div>
            </div>
          )}
        </div>

        {/* Scheme card + capital pie */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 border border-border bg-card p-8" data-testid="scheme-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs tracking-[0.25em] uppercase text-accent font-bold">
                  {fin.loan_mode === 'lean' ? '🛡️ Right-Sized Loan' : 'Auto-Selected'}
                </div>
                <h3 className="font-display font-extrabold text-2xl text-primary mt-1">{fin.scheme_name}</h3>
              </div>
              <Landmark size={28} strokeWidth={1.5} className="text-primary" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'interestRate')}</div><div className="font-display font-bold text-xl tabular-nums mt-1">{fin.interest_rate}%</div></div>
              <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Tenure</div><div className="font-display font-bold text-xl tabular-nums mt-1">{fin.tenure_years} yrs</div></div>
              <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Moratorium</div><div className="font-display font-bold text-xl tabular-nums mt-1">{fin.moratorium_months} mo</div></div>
              <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Repayment</div><div className="font-display font-bold text-xl tabular-nums mt-1 uppercase">{fin.repayment_frequency}</div></div>
            </div>

            {/* EMI and Repayment Highlight Box */}
            <div className="mt-5 border border-border/80 p-4 bg-background/80 rounded space-y-3">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    {lang === 'hi' ? 'मासिक किस्त (Monthly EMI)' : 'Monthly EMI'}
                  </div>
                  <div className="font-display font-black text-2xl text-primary mt-0.5">
                    {inr(fin.emi_monthly)} <span className="text-xs font-normal text-muted-foreground">/ month</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    {lang === 'hi' ? 'तिमाही किस्त' : 'Quarterly Installment'}
                  </div>
                  <div className="font-display font-bold text-lg text-primary mt-0.5">
                    {inr(fin.quarterly_instalment)}
                  </div>
                </div>
              </div>

              {fin.affordability && (
                <div className="pt-2 border-t border-border flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Net Monthly Cash After EMI: </span>
                    <span className="font-bold text-secondary">{inr(fin.affordability.net_profit_after_emi)}/mo</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 font-semibold rounded-full text-[11px] ${
                      fin.affordability.status === 'safe'
                        ? 'bg-secondary/20 text-secondary-foreground'
                        : fin.affordability.status === 'moderate'
                        ? 'bg-amber-500/20 text-amber-900'
                        : 'bg-destructive/20 text-destructive'
                    }`}
                  >
                    {fin.affordability.status === 'safe' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                    {lang === 'hi' ? fin.affordability.badge_hi : fin.affordability.badge}
                  </span>
                </div>
              )}

              {fin.interest_saved > 0 && (
                <div className="text-[11px] font-medium text-secondary bg-secondary/10 p-2 rounded flex items-center gap-1.5">
                  <Sparkles size={13} className="flex-shrink-0" />
                  <span>
                    {lang === 'hi'
                      ? `काम का लोन चुनने से कुल ₹${fin.interest_saved.toLocaleString('en-IN')} के बैंक ब्याज की सीधी बचत हुई है!`
                      : `Smart Loan Sizing: You saved approx ₹${fin.interest_saved.toLocaleString('en-IN')} in total interest!`}
                  </span>
                </div>
              )}
            </div>

            {fin.capped_by_max && (
              <div className="mt-4 border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive flex gap-2">
                <ShieldAlert size={14} className="flex-shrink-0" />
                Loan requested exceeds scheme max cap ({inr(fin.max_loan_cap)}). Funding gap: {inr(fin.shortfall)}.
              </div>
            )}
          </div>

          <div className="lg:col-span-2 border border-border bg-card p-6 flex flex-col items-center justify-center">
            <div className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground mb-2">Capital Mix</div>
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
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-secondary" /><span>Margin: {inr(fin.margin_capital)}</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" /><span>Loan: {inr(fin.approved_loan)}</span></div>
            </div>
          </div>
        </div>

        {/* Executive summary & market */}
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
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Sales Channels</div>
                <div className="flex flex-wrap gap-1.5">
                  {f.market_reach?.primary_channels?.map((c, i) => (
                    <span key={i} className="text-xs bg-muted px-2.5 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Target Customers</div>
                <div className="flex flex-wrap gap-1.5">
                  {f.market_reach?.target_segments?.map((c, i) => (
                    <span key={i} className="text-xs bg-secondary/15 text-secondary font-medium px-2.5 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Opportunity & SWOT */}
        <Section icon={Target} title={t(lang, 'opportunityAndSwot')} testId="section-swot">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Unserved Opportunities</div>
              <ul className="space-y-1.5 text-sm">
                {f.opportunity_analysis?.unserved_niches?.map((n, i) => (
                  <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="text-secondary mt-0.5 flex-shrink-0" /><span>{n}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Seasonal Windows</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {f.opportunity_analysis?.seasonal_windows?.map((c, i) => (
                  <span key={i} className="text-xs border border-border px-2.5 py-1">{c}</span>
                ))}
              </div>
              <p className="text-sm italic text-muted-foreground">{f.opportunity_analysis?.recommended_positioning}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SwotCard label={t(lang, 'strengths')} items={f.swot?.strengths} tone="bg-secondary/10 border-secondary/40 text-secondary" />
            <SwotCard label={t(lang, 'weaknesses')} items={f.swot?.weaknesses} tone="bg-muted text-foreground" />
            <SwotCard label={t(lang, 'opportunities')} items={f.swot?.opportunities} tone="bg-accent/10 border-accent/40 text-accent" />
            <SwotCard label={t(lang, 'threats')} items={f.swot?.threats} tone="bg-destructive/10 border-destructive/40 text-destructive" />
          </div>

          {f.threats_detailed?.length > 0 && (
            <div className="mt-6 border-t border-border pt-6">
              <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3">Risk Mitigation</div>
              <div className="grid md:grid-cols-3 gap-3">
                {f.threats_detailed?.map((th, i) => (
                  <div key={i} className="border border-border p-3 text-xs bg-background">
                    <div className="font-semibold text-primary mb-1">{th.threat}</div>
                    <div className="text-muted-foreground">{th.mitigation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Competitors & Pricing */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Section icon={Users} title={t(lang, 'competitors')} subtitle={f.competitor_mapping?.competition_level} testId="section-competitors">
            <p className="text-sm leading-relaxed mb-4">{f.competitor_mapping?.estimated_density}</p>
            <div className="space-y-3">
              <div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Key Competitor Types</div>
                <div className="flex flex-wrap gap-1.5">
                  {f.competitor_mapping?.key_competitors_type?.map((c, i) => (
                    <span key={i} className="text-xs border border-border px-2 py-0.5">{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Differentiation Strategy</div>
                <p className="text-sm">{f.competitor_mapping?.differentiation_strategy}</p>
              </div>
            </div>
          </Section>

          <Section icon={IndianRupee} title={t(lang, 'pricingStrategy')} testId="section-pricing">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Suggested Price Range</div>
                <div className="font-display font-extrabold text-2xl text-primary tabular-nums mb-4">{f.product_market_value?.suggested_price_range}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{f.product_market_value?.regional_purchasing_power_note}</p>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Strategy</div>
                <div className="text-sm font-semibold mt-1">{f.product_market_value?.pricing_strategy}</div>
              </div>
              <div className="border-l border-border pl-4 space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Monthly Potential (Low)</div>
                  <div className="font-display font-bold text-xl tabular-nums">{inr(f.product_market_value?.monthly_revenue_potential_low)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Monthly Potential (High)</div>
                  <div className="font-display font-bold text-xl tabular-nums text-accent">{inr(f.product_market_value?.monthly_revenue_potential_high)}</div>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Amortisation Chart */}
        {yearlyData.length > 0 && (
          <Section icon={TrendingUp} title={t(lang, 'amortisationSchedule')} subtitle="7-year principal & interest repayment" testId="section-amortisation">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v) => inr(v)} />
                  <Legend />
                  <Bar dataKey="Principal" fill="hsl(var(--primary))" stackId="a" />
                  <Bar dataKey="Interest" fill="hsl(var(--accent))" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {/* Roadmap */}
        <Section icon={ListChecks} title={t(lang, 'actionRoadmap')} testId="section-roadmap">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs tracking-[0.15em] uppercase text-accent font-bold mb-3">5-Step Implementation</div>
              <ol className="space-y-3">
                {f.action_roadmap?.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="text-xs tracking-[0.15em] uppercase text-accent font-bold mb-3">Required Documents & Subsidy</div>
              <ul className="space-y-2 text-sm mb-4">
                {f.government_support?.required_documents?.map((d, i) => (
                  <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="text-secondary mt-0.5 flex-shrink-0" /><span>{d}</span></li>
                ))}
              </ul>
              {f.government_support?.subsidies?.map((s, i) => (
                <div key={i} className="border border-accent/40 bg-accent/10 p-3 text-xs mb-2 font-medium">{s}</div>
              ))}
              {f.government_support?.notes && (
                <div className="border border-border bg-muted/40 p-3 text-xs text-muted-foreground flex gap-2"><Info size={14} className="flex-shrink-0" />{f.government_support.notes}</div>
              )}
              {f.cultural_local_note && (
                <div className="mt-4 border-t border-border pt-4 italic text-sm text-muted-foreground">{f.cultural_local_note}</div>
              )}
            </div>
          </div>
        </Section>

        {/* Revenue & Cost Breakdown */}
        {rev.monthly_revenue !== undefined && (
          <Section icon={Wallet} title={t(lang, 'revenueModel')} subtitle="Projected monthly economics" testId="section-revenue">
            <p className="text-sm leading-relaxed text-foreground mb-6">{rev.description}</p>
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Projected Monthly Revenue</span>
                  <span className="font-display font-black text-2xl text-primary tabular-nums">{inr(rev.monthly_revenue)}</span>
                </div>
                <div className="space-y-3">
                  {rev.cost_breakdown?.map((c, i) => {
                    const pct = rev.monthly_revenue > 0 ? Math.min(100, (c.value / rev.monthly_revenue) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{c.label}</span>
                          <span className="tabular-nums text-muted-foreground">{inr(c.value)}</span>
                        </div>
                        <div className="h-2 bg-muted overflow-hidden"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{c.note}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="lg:col-span-2 grid grid-cols-2 gap-3 content-start">
                {[
                  ['Operating Cost', inr(rev.operating_cost_total), ''],
                  ['Loan EMI (mo.)', inr(rev.loan_servicing_monthly), ''],
                  ['Gross Profit', inr(rev.gross_profit_monthly), 'text-secondary'],
                  ['Net Profit (mo.)', inr(rev.net_profit_monthly), rev.net_profit_monthly >= 0 ? 'text-secondary' : 'text-destructive'],
                  ['Net Margin', `${rev.net_margin_pct}%`, ''],
                  ['Annual ROI', `${rev.roi_annual_pct}%`, 'text-accent'],
                  ['Break-even', rev.break_even_months ? `${rev.break_even_months} mo` : '—', ''],
                  ['Annual Net', inr(rev.annual_net_profit), ''],
                ].map(([label, val, cls]) => (
                  <div key={label} className="border border-border p-3 bg-muted/30">
                    <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{label}</div>
                    <div className={`font-display font-bold text-lg tabular-nums mt-1 ${cls}`}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* Government schemes to explore */}
        {schemes.length > 0 && (
          <Section icon={Landmark} title={t(lang, 'exploreSchemes')} subtitle="Compare & apply" testId="section-schemes">
            {/* Prominent Subsidy Callout Banner */}
            <div className="mb-6 p-5 border border-secondary/40 bg-secondary/10 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs tracking-[0.2em] uppercase font-bold text-secondary">
                  {lang === 'hi' ? 'सरकारी योजना सब्सिडी लाभ' : 'Government Subsidy Benefit'}
                </div>
                <div className="font-display font-extrabold text-2xl text-primary mt-0.5">
                  {lang === 'hi' ? 'पात्र सरकारी सब्सिडी:' : 'Eligible Subsidy:'} Up to {inr(maxSubsidy)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === 'hi'
                    ? 'गैर-वापसी योग्य पूंजी अनुदान / मार्जिन-मनी, जो बैंक ऋण खाते में सीधे जमा होती है।'
                    : 'Non-repayable capital grant / margin-money credited directly to your loan account under Central & State schemes.'}
                </p>
              </div>
              <span className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1.5">
                <CheckCircle2 size={14} /> 100% Direct Bank Transfer
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {schemes.map((s) => (
                <div key={s.code} className={`border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${s.primary ? 'border-accent bg-accent/5' : 'border-border bg-background'}`} data-testid={`scheme-${s.code}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-display font-bold text-primary leading-snug">{s.name}</h4>
                      {s.name_hi && lang === 'hi' && <div className="text-xs text-muted-foreground mt-0.5">{s.name_hi}</div>}
                    </div>
                    {s.primary && <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-accent border border-accent/50 px-2 py-0.5 flex-shrink-0">Best Fit</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{s.agency}</div>

                  {/* Highlighted Subsidy Badge */}
                  {s.exact_subsidy_amount > 0 && (
                    <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/15 text-secondary text-xs font-bold rounded">
                      <CheckCircle2 size={13} /> {inr(s.exact_subsidy_amount)} Grant / Subsidy ({s.subsidy_rate || 'Govt. Grant'})
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs mb-3">
                    <div><span className="text-muted-foreground">Interest:</span> <span className="font-semibold">{s.interest_range}</span></div>
                    <div><span className="text-muted-foreground">Max loan:</span> <span className="font-semibold">{s.max_loan}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Subsidy:</span> <span className="font-semibold">{s.subsidy}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Ideal for:</span> {s.ideal_for}</div>
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold text-accent">Documents & eligibility</summary>
                    <div className="mt-2 text-muted-foreground"><b>Eligibility:</b> {s.eligibility}</div>
                    <ul className="mt-2 space-y-1">
                      {s.required_documents?.map((d, i) => <li key={i} className="flex gap-1.5"><CheckCircle2 size={12} className="text-secondary mt-0.5 flex-shrink-0" />{d}</li>)}
                    </ul>
                  </details>
                  {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent font-semibold mt-3 underline underline-offset-2">Official portal <ExternalLink size={11} /></a>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* HOW & WHERE TO GET LOAN & EMI (PROCESS GUIDE) */}
        <Section
          icon={Building2}
          title={lang === 'hi' ? 'लोन एवं EMI कहाँ से लें और आवेदन प्रक्रिया' : 'Where & How to Get Your Loan / EMI'}
          subtitle={lang === 'hi' ? 'आधिकारिक पोर्टल, बैंक एवं 5-चरणीय आवेदन प्रक्रिया' : 'Official Portals, Participating Banks & 5-Step Process'}
          testId="section-loan-guide"
        >
          <div className="space-y-6">
            {/* Top 3 Official Digital Portals to Apply */}
            <div>
              <div className="text-xs tracking-[0.2em] uppercase font-bold text-accent mb-3">
                {lang === 'hi' ? '1. आधिकारिक सरकारी पोर्टल (सीधे ऑनलाइन आवेदन करें)' : '1. Official Government Portals (Apply Online Directly)'}
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="border border-border p-4 bg-background hover:border-primary transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-primary">JanSamarth Portal</span>
                    <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded font-semibold">13+ Schemes</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {lang === 'hi'
                      ? 'भारत सरकार का एकीकृत क्रेडिट पोर्टल। 125+ बैंकों से तुरंत ऑनलाइन सैद्धांतिक स्वीकृति (In-principle Approval) प्राप्त करें।'
                      : 'Government of India unified credit platform. Connects directly with 125+ partner banks for digital in-principle sanction.'}
                  </p>
                  <a
                    href="https://www.jansamarth.in"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent underline"
                  >
                    jansamarth.in <ExternalLink size={12} />
                  </a>
                </div>

                <div className="border border-secondary/50 bg-secondary/5 p-4 hover:border-secondary transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-primary">KVIC PMEGP e-Portal</span>
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-semibold">Up to 35% Subsidy</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {lang === 'hi'
                      ? 'खादी एवं ग्रामोद्योग आयोग का आधिकारिक पोर्टल। PMEGP मार्जिन मनी सब्सिडी एवं बैंक ऋण के लिए सीधा ऑनलाइन फॉर्म भरें।'
                      : 'Official portal by KVIC & Ministry of MSME. Direct application gateway for capital subsidy and bank loan tracking.'}
                  </p>
                  <a
                    href="https://www.kviconline.gov.in/pmegpeportal"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline"
                  >
                    kviconline.gov.in <ExternalLink size={12} />
                  </a>
                </div>

                <div className="border border-border p-4 bg-background hover:border-primary transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-primary">Udyam Mitra Portal</span>
                    <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded font-semibold">SIDBI Powered</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {lang === 'hi'
                      ? 'सिडबी (SIDBI) का पोर्टल — मुद्रा लोन (MUDRA Shishu/Kishore) एवं स्टैंड-अप इंडिया ऋण के लिए आसान ऑनलाइन आवेदन।'
                      : 'Operated by SIDBI for MUDRA, Stand-Up India, and MSME credit assistance without collateral.'}
                  </p>
                  <a
                    href="https://udyammitra.in"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent underline"
                  >
                    udyammitra.in <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Where to visit physically */}
            <div className="border border-border/80 bg-muted/20 p-4">
              <div className="text-xs tracking-[0.2em] uppercase font-bold text-primary mb-2">
                {lang === 'hi' ? '2. ऑफ़लाइन कहाँ संपर्क करें (जिला / ब्लॉक स्तर)' : '2. Physical Touchpoints (District & Block Level)'}
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="font-semibold text-primary block">Lead Bank & Rural Banks</span>
                  <span className="text-muted-foreground">Any Public Sector Bank (SBI, PNB, BOB, Canara) or Regional Rural Bank (Gramin Bank) branch in your block.</span>
                </div>
                <div>
                  <span className="font-semibold text-primary block">District Industries Centre (DIC)</span>
                  <span className="text-muted-foreground">Visit the General Manager, DIC office at your district collectorate compound for offline sponsorship.</span>
                </div>
                <div>
                  <span className="font-semibold text-primary block">KVIC / KVIB District Office</span>
                  <span className="text-muted-foreground">District Khadi & Village Industries Board officers help verify project reports and assist rural applicants.</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step 5-Stage Loan & EMI Process */}
            <div>
              <div className="text-xs tracking-[0.2em] uppercase font-bold text-accent mb-3">
                {lang === 'hi' ? '3. आवेदन से लेकर EMI शुरू होने तक की 5-चरणीय प्रक्रिया' : '3. Step-by-Step Process: Application to EMI Disbursement'}
              </div>
              <div className="grid md:grid-cols-5 gap-3 text-xs">
                <div className="border border-border p-3.5 bg-background space-y-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">1</div>
                  <div className="font-bold text-primary pt-1">Prepare DPR & KYC</div>
                  <p className="text-muted-foreground">Download this project advisory report. Gather Aadhaar, PAN, caste certificate, and unit rent/electricity proof.</p>
                </div>

                <div className="border border-border p-3.5 bg-background space-y-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">2</div>
                  <div className="font-bold text-primary pt-1">Apply Online</div>
                  <p className="text-muted-foreground">Submit application on JanSamarth or PMEGP e-portal. Choose your nearest preferred lending bank branch.</p>
                </div>

                <div className="border border-border p-3.5 bg-background space-y-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">3</div>
                  <div className="font-bold text-primary pt-1">DTFC Scrutiny</div>
                  <p className="text-muted-foreground">District Task Force Committee reviews feasibility within 15–20 days and forwards your file to the bank.</p>
                </div>

                <div className="border border-border p-3.5 bg-background space-y-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">4</div>
                  <div className="font-bold text-primary pt-1">Bank Sanction</div>
                  <p className="text-muted-foreground">Bank verifies promoter margin, approves loan, and completes 5-10 day online EDP training certification.</p>
                </div>

                <div className="border border-secondary/50 p-3.5 bg-secondary/10 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs">5</div>
                  <div className="font-bold text-secondary pt-1">Subsidy & EMI</div>
                  <p className="text-foreground">Subsidy is credited into a 3-yr locked TDR. 3–6 month moratorium begins, followed by auto-debited monthly EMI.</p>
                </div>
              </div>
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
                      <th key={h} className="py-2 text-xs tracking-[0.15em] uppercase text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v, i) => (
                    <tr key={i} className="border-b border-border/50" data-testid={`vendor-row-${i}`}>
                      <td className="py-2 pr-3"><span className="text-[10px] tracking-[0.1em] uppercase border border-border px-1.5 py-0.5">{v.vendor_type}</span></td>
                      <td className="py-2 pr-3 font-semibold">{v.name}<div className="text-[11px] text-muted-foreground font-normal">{v.location}</div></td>
                      <td className="py-2 pr-3">{v.item}<div className="text-[11px] text-muted-foreground">{v.unit}</div></td>
                      <td className="py-2 pr-3 tabular-nums font-semibold">{inr(v.price)}</td>
                      <td className="py-2 pr-3"><span className="flex items-center gap-1 text-xs"><Phone size={11} /> {v.contact}</span></td>
                      <td className="py-2 pr-3 tabular-nums text-muted-foreground">{v.distance_km} km</td>
                      <td className="py-2 tabular-nums">⭐ {v.rating}</td>
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
    </div>
  );
}
