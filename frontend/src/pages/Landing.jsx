import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Shield, Calculator, MapPin, Sparkles, IndianRupee } from 'lucide-react';

const HERO_IMG = 'https://images.unsplash.com/photo-1775817647097-04b0cfad5cd2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBydXJhbCUyMGVudHJlcHJlbmV1ciUyMHBvcnRyYWl0fGVufDB8fHx8MTc4ODE5MzUxNHww&ixlib=rb-4.1.0&q=85';
const MARKET_IMG = 'https://images.unsplash.com/photo-1761753088381-9fcaa087edae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjBzbWFsbCUyMHNob3AlMjBvd25lcnxlbnwwfHx8fDE3ODgxOTM1MTR8MA&ixlib=rb-4.1.0&q=85';
const STORE_IMG = 'https://images.unsplash.com/photo-1751901173169-1ca6df2a5f11?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBzbWFsbCUyMHNob3AlMjBvd25lcnxlbnwwfHx8fDE3ODgxOTM1MTR8MA&ixlib=rb-4.1.0&q=85';

export default function Landing() {
  const { lang, user } = useApp();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center relative">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 border border-border bg-card px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase font-bold">
              <Sparkles size={12} className="text-accent" />
              <span>Powered by OpenAI GPT</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl tracking-tighter font-black leading-[0.95] text-primary">
              {t(lang, 'heroTitle')}
            </h1>
            <p className="text-lg lg:text-xl leading-relaxed text-muted-foreground max-w-xl">
              {t(lang, 'heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to={user ? '/advisory' : '/register'}>
                <Button size="lg" className="rounded-full px-8 h-14 text-base gap-2" data-testid="hero-cta-primary">
                  {t(lang, 'getStarted')} <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/advisory">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base" data-testid="hero-cta-secondary">
                  Try Calculator
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div>
                <div className="font-display font-black text-3xl text-primary tabular-nums">10%</div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">Your margin</div>
              </div>
              <div>
                <div className="font-display font-black text-3xl text-accent tabular-nums">90%</div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">Concessional loan</div>
              </div>
              <div>
                <div className="font-display font-black text-3xl text-primary tabular-nums">6</div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">Languages</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative border border-border overflow-hidden">
              <img src={HERO_IMG} alt="Rural entrepreneur" className="w-full h-[520px] object-cover" />
              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur border border-border p-4">
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Sample Advisory</div>
                <div className="font-display font-bold text-sm text-primary">Dairy Micro-Enterprise · Sinnar Block, Nashik</div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-secondary"><TrendingUp size={12} /> 78 score</span>
                  <span className="tabular-nums">₹1.25L loan · 6.5% p.a.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="text-xs tracking-[0.3em] uppercase text-accent font-bold mb-4">Two Core Modules</div>
        <h2 className="font-display text-3xl lg:text-5xl tracking-tight font-extrabold text-primary max-w-3xl mb-16">
          From village-level market data to your exact repayment schedule.
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="border border-border bg-card p-8 lg:p-12 relative hover-lift" data-testid="module-feasibility">
            <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center mb-6">
              <MapPin size={22} strokeWidth={1.75} />
            </div>
            <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Module 01</div>
            <h3 className="font-display font-bold text-2xl mb-4 text-primary">Hyper-Local Feasibility Report</h3>
            <ul className="space-y-3 text-sm">
              {['Market Reach in 5–10 km radius', 'Underserved niches specific to your block', 'SWOT tailored to micro-enterprise budget', 'Local threats & seasonal risks', 'Competitor density estimation', 'Regional pricing intelligence'].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-accent mt-1.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-border bg-card p-8 lg:p-12 relative hover-lift" data-testid="module-calculator">
            <div className="w-12 h-12 bg-accent text-accent-foreground flex items-center justify-center mb-6">
              <Calculator size={22} strokeWidth={1.75} />
            </div>
            <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Module 02</div>
            <h3 className="font-display font-bold text-2xl mb-4 text-primary">Smart Scheme Calculator</h3>
            <ul className="space-y-3 text-sm">
              {['Auto-computes project cost from your margin', 'Routes to Micro Finance (≤₹1.40L) or Term Loan', 'Exact EMI with moratorium accrual', 'Quarterly repayment schedule', 'Working capital & opex estimate', 'PDF download for bank submission'].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-accent mt-1.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Scheme comparison strip */}
      <section className="border-y border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid md:grid-cols-2 gap-6">
          <div className="border border-border bg-background p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs tracking-[0.2em] uppercase font-bold text-secondary">Scheme A</div>
              <IndianRupee size={18} className="text-secondary" />
            </div>
            <h4 className="font-display font-bold text-2xl text-primary mb-6">Micro Finance</h4>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted-foreground">Project cost</div><div className="tabular-nums font-medium">Up to ₹1.40L</div>
              <div className="text-muted-foreground">Max loan</div><div className="tabular-nums font-medium">₹1.25L</div>
              <div className="text-muted-foreground">Interest</div><div className="tabular-nums font-medium">6.5% p.a.</div>
              <div className="text-muted-foreground">Tenure</div><div className="tabular-nums font-medium">3 years</div>
              <div className="text-muted-foreground">Moratorium</div><div className="tabular-nums font-medium">3 months</div>
            </div>
          </div>
          <div className="border border-border bg-background p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs tracking-[0.2em] uppercase font-bold text-accent">Scheme B</div>
              <IndianRupee size={18} className="text-accent" />
            </div>
            <h4 className="font-display font-bold text-2xl text-primary mb-6">Term Loan</h4>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted-foreground">Project cost</div><div className="tabular-nums font-medium">₹1.40L – ₹50L</div>
              <div className="text-muted-foreground">Max loan</div><div className="tabular-nums font-medium">₹45L</div>
              <div className="text-muted-foreground">Interest</div><div className="tabular-nums font-medium">8% p.a.</div>
              <div className="text-muted-foreground">Tenure</div><div className="tabular-nums font-medium">7 years</div>
              <div className="text-muted-foreground">Moratorium</div><div className="tabular-nums font-medium">6 months</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 border border-border p-10 bg-primary text-primary-foreground relative overflow-hidden">
          <Shield size={32} strokeWidth={1.5} className="mb-6 opacity-80" />
          <h3 className="font-display font-extrabold text-3xl lg:text-4xl tracking-tight mb-4 max-w-lg">
            Reduce micro-enterprise failure with data, not anecdote.
          </h3>
          <p className="text-primary-foreground/80 max-w-lg leading-relaxed">
            Rural entrepreneurs often pick businesses based on hearsay. Grameen Udyog grounds every decision in your block's demographic reality — before you sign the loan papers.
          </p>
        </div>
        <div className="relative border border-border overflow-hidden">
          <img src={MARKET_IMG} alt="Rural market" className="w-full h-full object-cover min-h-[280px]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground">© 2026 Grameen Udyog · Built for Bharat</div>
          <div className="text-xs text-muted-foreground">Inspired by NSFDC · NBCFDC · NSKFDC concessional lending frameworks</div>
        </div>
      </footer>
    </div>
  );
}
