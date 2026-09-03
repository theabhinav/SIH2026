import React, { useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, Sparkles, MapPin, TrendingUp, ShieldAlert, Users, IndianRupee, Target, ListChecks, Landmark, Info, Wallet, FileText, CheckCircle2, Phone, Store, Award, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SupplyChainMap from '@/components/SupplyChainMap';

function inr(n) {
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
  const f = report.feasibility;
  const fin = report.financials;

  const downloadPDF = async () => {
    const el = printRef.current;
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
    pdf.save(`Grameen-Udyog-${report.input.village}-${Date.now()}.pdf`);
  };

  const yearlyData = fin.yearly_schedule.map(y => ({ name: `Y${y.year}`, Principal: y.principal, Interest: y.interest }));
  const pieData = [
    { name: 'Margin', value: fin.margin_capital, color: 'hsl(var(--secondary))' },
    { name: 'Loan', value: fin.approved_loan, color: 'hsl(var(--accent))' },
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
        <div className="border border-border bg-primary text-primary-foreground p-10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs tracking-[0.3em] uppercase mb-4 opacity-80">
              <Sparkles size={12} /> Feasibility Report · Grameen Udyog
            </div>
            <h1 className="font-display text-3xl lg:text-5xl font-black tracking-tight mb-3 leading-tight">
              {report.input.business_category}
            </h1>
            <div className="flex items-center gap-2 text-sm opacity-90 mb-6">
              <MapPin size={14} /> {report.input.village}, {report.input.block} · {report.input.district}, {report.input.state}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-primary-foreground/20">
              <div>
                <div className="text-xs tracking-[0.2em] uppercase opacity-70">{t(lang, 'viability')}</div>
                <div className="font-display font-black text-4xl mt-1 tabular-nums">{f.viability_score}<span className="text-xl opacity-60">/100</span></div>
                <div className="text-xs opacity-80 mt-1">{f.viability_label}</div>
              </div>
              <div>
                <div className="text-xs tracking-[0.2em] uppercase opacity-70">{t(lang, 'projectCost')}</div>
                <div className="font-display font-black text-2xl mt-1 tabular-nums">{inr(fin.project_cost)}</div>
              </div>
              <div>
                <div className="text-xs tracking-[0.2em] uppercase opacity-70">{t(lang, 'loanEligibility')}</div>
                <div className="font-display font-black text-2xl mt-1 tabular-nums text-accent">{inr(fin.approved_loan)}</div>
              </div>
              <div>
                <div className="text-xs tracking-[0.2em] uppercase opacity-70">{t(lang, 'emi')}</div>
                <div className="font-display font-black text-2xl mt-1 tabular-nums">{inr(fin.emi)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        {f.recommendation && (() => {
          const rec = f.recommendation;
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

        {/* Scheme card + capital pie */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 border border-border bg-card p-8" data-testid="scheme-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs tracking-[0.25em] uppercase text-accent font-bold">Auto-Selected</div>
                <h3 className="font-display font-extrabold text-2xl text-primary mt-1">{fin.scheme_name}</h3>
              </div>
              <Landmark size={28} strokeWidth={1.5} className="text-primary" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'interestRate')}</div><div className="font-display font-bold text-xl tabular-nums mt-1">{fin.interest_rate}%</div></div>
              <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'tenure')}</div><div className="font-display font-bold text-xl tabular-nums mt-1">{fin.tenure_years} yr</div></div>
              <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'moratorium')}</div><div className="font-display font-bold text-xl tabular-nums mt-1">{fin.moratorium_months} mo</div></div>
              <div><div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'totalInterest')}</div><div className="font-display font-bold text-xl tabular-nums mt-1 text-accent">{inr(fin.total_interest)}</div></div>
            </div>
            {fin.capped_by_max && (
              <div className="mt-4 border border-accent/50 bg-accent/10 text-accent p-3 text-xs flex gap-2"><Info size={14} /> Loan capped at scheme maximum of {inr(fin.max_loan_cap)}. Balance must be covered by additional margin.</div>
            )}
          </div>
          <div className="lg:col-span-2 border border-border bg-card p-6">
            <div className="text-xs tracking-[0.25em] uppercase font-bold text-muted-foreground mb-2">Capital Structure</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => inr(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-around text-xs mt-2">
              <div><span className="inline-block w-2 h-2 bg-secondary mr-2" />Margin 10%</div>
              <div><span className="inline-block w-2 h-2 bg-accent mr-2" />Loan 90%</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <Section icon={Sparkles} title={t(lang, 'executiveSummary')} testId="section-summary">
          <p className="text-base leading-relaxed text-foreground">{f.executive_summary}</p>
        </Section>

        {/* Bento: Market Reach + Opportunities */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Section icon={TrendingUp} title={t(lang, 'marketReach')} subtitle={`${f.market_reach?.radius_km || 8} km radius`} testId="section-market">
            <p className="text-sm leading-relaxed mb-4">{f.market_reach?.consumer_base_estimate}</p>
            <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Primary Channels</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {f.market_reach?.primary_channels?.map((c, i) => (
                <span key={i} className="border border-border px-3 py-1 text-xs">{c}</span>
              ))}
            </div>
            <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Target Segments</div>
            <div className="flex flex-wrap gap-2">
              {f.market_reach?.target_segments?.map((c, i) => (
                <span key={i} className="border border-secondary/40 bg-secondary/10 text-secondary px-3 py-1 text-xs">{c}</span>
              ))}
            </div>
          </Section>
          <Section icon={Target} title={t(lang, 'opportunities')} testId="section-opportunity">
            <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Unserved Niches</div>
            <ul className="space-y-2 text-sm mb-4">
              {f.opportunity_analysis?.unserved_niches?.map((n, i) => (
                <li key={i} className="flex gap-2"><span className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />{n}</li>
              ))}
            </ul>
            <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Seasonal Windows</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {f.opportunity_analysis?.seasonal_windows?.map((c, i) => (
                <span key={i} className="border border-accent/50 bg-accent/10 text-accent px-3 py-1 text-xs">{c}</span>
              ))}
            </div>
            <p className="text-sm italic text-muted-foreground">{f.opportunity_analysis?.recommended_positioning}</p>
          </Section>
        </div>

        {/* SWOT */}
        <Section icon={ListChecks} title={t(lang, 'swot')} testId="section-swot">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SwotCard label={t(lang, 'strengths')} items={f.swot?.strengths} tone="bg-secondary/10 border-secondary/40 text-secondary" />
            <SwotCard label={t(lang, 'weaknesses')} items={f.swot?.weaknesses} tone="bg-muted text-foreground" />
            <SwotCard label={t(lang, 'opportunities')} items={f.swot?.opportunities} tone="bg-accent/10 border-accent/40 text-accent" />
            <SwotCard label={t(lang, 'threats')} items={f.swot?.threats} tone="bg-destructive/10 border-destructive/40 text-destructive" />
          </div>
        </Section>

        {/* Threats detail + competitors */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Section icon={ShieldAlert} title={t(lang, 'threatsDetail')} testId="section-threats">
            <div className="space-y-3">
              {f.threats_detailed?.map((th, i) => (
                <div key={i} className="border border-border p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm">{th.threat}</div>
                    <span className={`text-[10px] tracking-[0.15em] uppercase font-bold px-2 py-0.5 border ${th.severity === 'High' ? 'text-destructive border-destructive/50 bg-destructive/10' : th.severity === 'Medium' ? 'text-accent border-accent/50 bg-accent/10' : 'text-secondary border-secondary/50 bg-secondary/10'}`}>
                      {th.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">→ {th.mitigation}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={Users} title={t(lang, 'competitors')} subtitle={f.competitor_mapping?.competition_level} testId="section-competitors">
            <p className="text-sm leading-relaxed mb-4">{f.competitor_mapping?.estimated_density}</p>
            <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Competitor Types</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {f.competitor_mapping?.key_competitors_type?.map((c, i) => (
                <span key={i} className="border border-border px-3 py-1 text-xs">{c}</span>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Differentiation Strategy</div>
              <p className="text-sm">{f.competitor_mapping?.differentiation_strategy}</p>
            </div>
          </Section>
        </div>

        {/* Pricing */}
        <Section icon={IndianRupee} title={t(lang, 'pricing')} testId="section-pricing">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Suggested Price Range</div>
              <div className="font-display font-extrabold text-2xl text-primary tabular-nums mb-4">{f.product_market_value?.suggested_price_range}</div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{f.product_market_value?.regional_purchasing_power_note}</p>
              <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Strategy</div>
              <div className="text-sm font-semibold mt-1">{f.product_market_value?.pricing_strategy}</div>
            </div>
            <div className="border border-border p-4 bg-muted/30">
              <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Monthly Revenue Potential</div>
              <div className="text-xs text-muted-foreground">Low</div>
              <div className="font-display font-bold text-xl tabular-nums">{inr(f.product_market_value?.monthly_revenue_potential_low)}</div>
              <div className="text-xs text-muted-foreground mt-3">High</div>
              <div className="font-display font-bold text-xl tabular-nums text-accent">{inr(f.product_market_value?.monthly_revenue_potential_high)}</div>
            </div>
          </div>
        </Section>

        {/* Amortization chart */}
        <Section icon={TrendingUp} title={t(lang, 'yearlyAmortization')} testId="section-amortization">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Bar dataKey="Principal" fill="hsl(var(--primary))" stackId="a" />
              <Bar dataKey="Interest" fill="hsl(var(--accent))" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Quarterly repayment table */}
        <Section icon={ListChecks} title={t(lang, 'quarterlyRepayment')} testId="section-quarterly">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'quarter')}</th>
                  <th className="text-right py-2 text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'principal')}</th>
                  <th className="text-right py-2 text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'interest')}</th>
                  <th className="text-right py-2 text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'total')}</th>
                  <th className="text-right py-2 text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'balance')}</th>
                </tr>
              </thead>
              <tbody>
                {fin.quarterly_schedule.map((q) => (
                  <tr key={q.quarter} className="border-b border-border/50">
                    <td className="py-2 font-semibold">Q{q.quarter}</td>
                    <td className="py-2 text-right tabular-nums">{inr(q.principal)}</td>
                    <td className="py-2 text-right tabular-nums text-accent">{inr(q.interest)}</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{inr(q.total)}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{inr(q.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="border border-border p-4 bg-muted/30">
              <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'workingCapital')}</div>
              <div className="font-display font-bold text-xl tabular-nums mt-1">{inr(fin.working_capital_estimate)}</div>
            </div>
            <div className="border border-border p-4 bg-muted/30">
              <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground">{t(lang, 'monthlyOpex')}</div>
              <div className="font-display font-bold text-xl tabular-nums mt-1">{inr(fin.operational_cost_monthly)}</div>
            </div>
          </div>
        </Section>

        {/* Roadmap + Gov */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Section icon={ListChecks} title={t(lang, 'roadmap')} testId="section-roadmap">
            <ol className="space-y-3">
              {f.action_roadmap?.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-7 h-7 border border-primary bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <div className="text-sm leading-relaxed pt-0.5">{step}</div>
                </li>
              ))}
            </ol>
          </Section>
          <Section icon={Landmark} title={t(lang, 'govSupport')} subtitle="Documents & subsidy" testId="section-gov">
            <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">{t(lang, 'requiredDocs')}</div>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-5">
              {f.government_support?.required_documents?.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 size={14} className="text-secondary mt-0.5 flex-shrink-0" />{d}</div>
              ))}
            </div>
            <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Subsidy & Benefits</div>
            <ul className="space-y-2 text-sm mb-4">
              {f.government_support?.subsidies?.map((s, i) => (
                <li key={i} className="border-l-2 border-accent pl-3 py-1">{s}</li>
              ))}
            </ul>
            {f.government_support?.notes && (
              <div className="border border-border bg-muted/40 p-3 text-xs text-muted-foreground flex gap-2"><Info size={14} className="flex-shrink-0" />{f.government_support.notes}</div>
            )}
            {f.cultural_local_note && (
              <div className="mt-4 border-t border-border pt-4 italic text-sm text-muted-foreground">{f.cultural_local_note}</div>
            )}
          </Section>
        </div>

        {/* Revenue & Cost Breakdown */}
        {f.revenue_model && (
          <Section icon={Wallet} title={t(lang, 'revenueModel')} subtitle="Projected monthly economics" testId="section-revenue">
            <p className="text-sm leading-relaxed text-foreground mb-6">{f.revenue_model.description}</p>
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Projected Monthly Revenue</span>
                  <span className="font-display font-black text-2xl text-primary tabular-nums">{inr(f.revenue_model.monthly_revenue)}</span>
                </div>
                <div className="space-y-3">
                  {f.revenue_model.cost_breakdown?.map((c, i) => {
                    const pct = f.revenue_model.monthly_revenue > 0 ? Math.min(100, (c.value / f.revenue_model.monthly_revenue) * 100) : 0;
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
                  ['Operating Cost', inr(f.revenue_model.operating_cost_total), ''],
                  ['Loan EMI (mo.)', inr(f.revenue_model.loan_servicing_monthly), ''],
                  ['Gross Profit', inr(f.revenue_model.gross_profit_monthly), 'text-secondary'],
                  ['Net Profit (mo.)', inr(f.revenue_model.net_profit_monthly), f.revenue_model.net_profit_monthly >= 0 ? 'text-secondary' : 'text-destructive'],
                  ['Net Margin', `${f.revenue_model.net_margin_pct}%`, ''],
                  ['Annual ROI', `${f.revenue_model.roi_annual_pct}%`, 'text-accent'],
                  ['Break-even', f.revenue_model.break_even_months ? `${f.revenue_model.break_even_months} mo` : '—', ''],
                  ['Annual Net', inr(f.revenue_model.annual_net_profit), ''],
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
        {f.government_schemes?.length > 0 && (
          <Section icon={Landmark} title={t(lang, 'exploreSchemes')} subtitle="Compare & apply" testId="section-schemes">
            <div className="grid md:grid-cols-2 gap-4">
              {f.government_schemes.map((s) => (
                <div key={s.code} className={`border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${s.primary ? 'border-accent bg-accent/5' : 'border-border bg-background'}`} data-testid={`scheme-${s.code}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-display font-bold text-primary leading-snug">{s.name}</h4>
                    {s.primary && <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-accent border border-accent/50 px-2 py-0.5 flex-shrink-0">Best Fit</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{s.agency}</div>
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

        {/* Nearby vendors */}
        {f.vendors?.length > 0 && (
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
                  {f.vendors.map((v, i) => (
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
        {f.supply_chain && (
          <Section icon={TrendingUp} title={t(lang, 'supplyChain')} subtitle="Source → Customer" testId="section-supply-chain">
            <SupplyChainMap supplyChain={f.supply_chain} />
          </Section>
        )}
      </div>
    </div>
  );
}
