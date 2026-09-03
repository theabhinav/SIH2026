import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useApp, API } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { MapPin, IndianRupee, Briefcase, Sparkles, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import ReportView from '@/components/ReportView';

export default function Advisory() {
  const { lang, authHeaders } = useApp();
  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState({});
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    state: '', district: '', block: '', village: '',
    business_category: '', margin_capital: 100000, repayment_frequency: 'quarterly',
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    axios.get(`${API}/locations`).then(r => setLocations(r.data));
    axios.get(`${API}/business-categories`).then(r => setCategories(r.data));
  }, []);

  const states = useMemo(() => Object.keys(locations), [locations]);
  const districts = useMemo(() => form.state ? Object.keys(locations[form.state] || {}) : [], [locations, form.state]);
  const blocks = useMemo(() => form.district ? Object.keys(locations[form.state]?.[form.district] || {}) : [], [locations, form.state, form.district]);
  const villages = useMemo(() => form.block ? (locations[form.state]?.[form.district]?.[form.block] || []) : [], [locations, form.state, form.district, form.block]);

  const canNext = {
    1: form.state && form.district && form.block && form.village,
    2: !!form.business_category,
    3: form.margin_capital >= 10000,
  }[step];

  const generate = async () => {
    setLoading(true);
    try {
      const r = await axios.post(`${API}/feasibility/generate`, {
        ...form,
        language: lang,
      }, { headers: authHeaders });
      setReport(r.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (report) return <ReportView report={report} onReset={() => { setReport(null); setStep(1); }} />;

  const STEPS = [
    { n: 1, title: t(lang, 'step1'), icon: MapPin },
    { n: 2, title: t(lang, 'step2'), icon: Briefcase },
    { n: 3, title: t(lang, 'step3'), icon: IndianRupee },
    { n: 4, title: t(lang, 'step4'), icon: Sparkles },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <div className="mb-10">
        <div className="text-xs tracking-[0.3em] uppercase text-accent font-bold mb-3">AI Advisory</div>
        <h1 className="font-display text-3xl lg:text-5xl tracking-tight font-extrabold text-primary">
          {t(lang, 'startAdvisory')}
        </h1>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-4 gap-2 mb-10" data-testid="stepper">
        {STEPS.map((s) => (
          <div key={s.n} className={`border ${step >= s.n ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'} p-4 transition-colors`}>
            <s.icon size={16} strokeWidth={1.75} className="mb-2" />
            <div className="text-[10px] tracking-[0.2em] uppercase font-bold">Step {s.n}</div>
            <div className="text-sm font-semibold mt-1">{s.title}</div>
          </div>
        ))}
      </div>

      <div className="border border-border bg-card p-8 lg:p-12">
        {step === 1 && (
          <div className="space-y-6" data-testid="step-location">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">Where is your enterprise?</h2>
              <p className="text-sm text-muted-foreground mt-2">The AI uses your Gram Panchayat as the analytical anchor.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                ['state', t(lang, 'state'), states],
                ['district', t(lang, 'district'), districts],
                ['block', t(lang, 'block'), blocks],
                ['village', t(lang, 'village'), villages],
              ].map(([key, label, opts]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground">{label}</Label>
                  <Select
                    value={form[key]}
                    onValueChange={(v) => {
                      const upd = { ...form, [key]: v };
                      if (key === 'state') { upd.district = ''; upd.block = ''; upd.village = ''; }
                      if (key === 'district') { upd.block = ''; upd.village = ''; }
                      if (key === 'block') { upd.village = ''; }
                      setForm(upd);
                    }}
                  >
                    <SelectTrigger className="h-12" data-testid={`select-${key}`}>
                      <SelectValue placeholder={`Select ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6" data-testid="step-business">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">Which business are you planning?</h2>
              <p className="text-sm text-muted-foreground mt-2">Choose the closest category — the AI will tailor niches and pricing.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, business_category: c })}
                  data-testid={`category-${c.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`text-left border p-4 transition-colors ${form.business_category === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}
                >
                  <div className="text-sm font-semibold">{c}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8" data-testid="step-capital">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">How much margin capital do you have?</h2>
              <p className="text-sm text-muted-foreground mt-2">This is the 10% you must contribute. The scheme funds 90% as concessional loan.</p>
            </div>
            <div className="border border-border bg-background p-8">
              <div className="flex items-baseline justify-between mb-6">
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground">{t(lang, 'marginCapital')}</div>
                <div className="font-display font-black text-4xl lg:text-5xl text-primary tabular-nums">
                  ₹{form.margin_capital.toLocaleString('en-IN')}
                </div>
              </div>
              <Slider
                min={10000}
                max={500000}
                step={5000}
                value={[form.margin_capital]}
                onValueChange={(v) => setForm({ ...form, margin_capital: v[0] })}
                data-testid="margin-slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 tabular-nums">
                <span>₹10,000</span><span>₹5,00,000</span>
              </div>
              <div className="mt-6 flex gap-2 flex-wrap">
                {[14000, 50000, 100000, 200000, 500000].map(v => (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, margin_capital: v })}
                    className="border border-border px-3 py-1.5 text-xs tabular-nums hover:border-primary transition-colors"
                    data-testid={`preset-${v}`}
                  >
                    ₹{v.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="border border-border p-4 bg-muted/40">
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Project Cost</div>
                <div className="font-display font-bold text-2xl tabular-nums">₹{(form.margin_capital * 10).toLocaleString('en-IN')}</div>
              </div>
              <div className="border border-border p-4 bg-muted/40">
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Est. Loan</div>
                <div className="font-display font-bold text-2xl tabular-nums text-accent">₹{(form.margin_capital * 9).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div>
              <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">{t(lang, 'repayment')}</div>
              <div className="inline-flex border border-border" data-testid="repayment-toggle">
                {['quarterly', 'monthly'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setForm({ ...form, repayment_frequency: freq })}
                    data-testid={`repayment-${freq}`}
                    className={`px-6 py-2.5 text-sm font-semibold transition-colors ${form.repayment_frequency === freq ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-primary'}`}
                  >
                    {t(lang, freq)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 text-center py-8" data-testid="step-generate">
            <div className="w-16 h-16 bg-primary text-primary-foreground mx-auto flex items-center justify-center">
              <Sparkles size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">Ready to generate your advisory</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                OpenAI GPT will analyse <b>{form.village}</b> for a <b>{form.business_category}</b> enterprise with ₹{form.margin_capital.toLocaleString('en-IN')} margin.
              </p>
            </div>
            <Button size="lg" onClick={generate} disabled={loading} className="rounded-full h-14 px-10 gap-2" data-testid="generate-btn">
              {loading ? <><Loader2 className="animate-spin" size={18} /> {t(lang, 'generating')}</> : <>{t(lang, 'generate')} <ArrowRight size={18} /></>}
            </Button>
          </div>
        )}

        {/* nav */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || loading} data-testid="back-btn">
            <ArrowLeft size={16} className="mr-1" /> {t(lang, 'back')}
          </Button>
          {step < 4 && (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext} className="rounded-full px-6" data-testid="next-btn">
              {t(lang, 'next')} <ArrowRight size={16} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
