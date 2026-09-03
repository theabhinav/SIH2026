import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Shield, Calculator, MapPin, IndianRupee } from 'lucide-react';

const HERO_IMG = 'https://images.unsplash.com/photo-1775817647097-04b0cfad5cd2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBydXJhbCUyMGVudHJlcHJlbmV1ciUyMHBvcnRyYWl0fGVufDB8fHx8MTc4ODE5MzUxNHww&ixlib=rb-4.1.0&q=85';
const MARKET_IMG = 'https://images.unsplash.com/photo-1761753088381-9fcaa087edae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjBzbWFsbCUyMHNob3AlMjBvd25lcnxlbnwwfHx8fDE3ODgxOTM1MTR8MA&ixlib=rb-4.1.0&q=85';

export default function Landing() {
  const { lang, user } = useApp();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center relative">
          <div className="lg:col-span-7 space-y-8">
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
                  {t(lang, 'tryCalculator')}
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div>
                <div className="font-display font-black text-3xl text-primary tabular-nums">10%</div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">{t(lang, 'yourMargin')}</div>
              </div>
              <div>
                <div className="font-display font-black text-3xl text-accent tabular-nums">90%</div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">{t(lang, 'concessionalLoan')}</div>
              </div>
              <div>
                <div className="font-display font-black text-3xl text-primary tabular-nums">6</div>
                <div className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">{t(lang, 'languagesStat')}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative border border-border overflow-hidden">
              <img src={HERO_IMG} alt="Rural entrepreneur" className="w-full h-[520px] object-cover" />
              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur border border-border p-4">
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">{t(lang, 'sampleAdvisory')}</div>
                <div className="font-display font-bold text-sm text-primary">{t(lang, 'sampleEnterprise')}</div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-secondary"><TrendingUp size={12} /> 78 {t(lang, 'score')}</span>
                  <span className="tabular-nums">{t(lang, 'sampleLoanDetail')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="text-xs tracking-[0.3em] uppercase text-accent font-bold mb-4">{t(lang, 'twoCoreModules')}</div>
        <h2 className="font-display text-3xl lg:text-5xl tracking-tight font-extrabold text-primary max-w-3xl mb-16">
          {t(lang, 'modulesHeadline')}
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="border border-border bg-card p-8 lg:p-12 relative hover-lift" data-testid="module-feasibility">
            <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center mb-6">
              <MapPin size={22} strokeWidth={1.75} />
            </div>
            <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">{t(lang, 'module1Tag')}</div>
            <h3 className="font-display font-bold text-2xl mb-4 text-primary">{t(lang, 'module1Title')}</h3>
            <ul className="space-y-3 text-sm">
              {[
                t(lang, 'mod1Feature1'),
                t(lang, 'mod1Feature2'),
                t(lang, 'mod1Feature3'),
                t(lang, 'mod1Feature4'),
                t(lang, 'mod1Feature5'),
                t(lang, 'mod1Feature6'),
              ].map((f) => (
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
            <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">{t(lang, 'module2Tag')}</div>
            <h3 className="font-display font-bold text-2xl mb-4 text-primary">{t(lang, 'module2Title')}</h3>
            <ul className="space-y-3 text-sm">
              {[
                t(lang, 'mod2Feature1'),
                t(lang, 'mod2Feature2'),
                t(lang, 'mod2Feature3'),
                t(lang, 'mod2Feature4'),
                t(lang, 'mod2Feature5'),
                t(lang, 'mod2Feature6'),
              ].map((f) => (
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
              <div className="text-xs tracking-[0.2em] uppercase font-bold text-secondary">{t(lang, 'schemeA')}</div>
              <IndianRupee size={18} className="text-secondary" />
            </div>
            <h4 className="font-display font-bold text-2xl text-primary mb-6">{t(lang, 'microFinance')}</h4>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted-foreground">{t(lang, 'projectCostLabel')}</div><div className="tabular-nums font-medium">{t(lang, 'microCostVal')}</div>
              <div className="text-muted-foreground">{t(lang, 'maxLoan')}</div><div className="tabular-nums font-medium">{t(lang, 'microLoanVal')}</div>
              <div className="text-muted-foreground">{t(lang, 'interestRate')}</div><div className="tabular-nums font-medium">{t(lang, 'microInterestVal')}</div>
              <div className="text-muted-foreground">{t(lang, 'tenure')}</div><div className="tabular-nums font-medium">{t(lang, 'microTenureVal')}</div>
              <div className="text-muted-foreground">{t(lang, 'moratorium')}</div><div className="tabular-nums font-medium">{t(lang, 'microMoratoriumVal')}</div>
            </div>
          </div>
          <div className="border border-border bg-background p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs tracking-[0.2em] uppercase font-bold text-accent">{t(lang, 'schemeB')}</div>
              <IndianRupee size={18} className="text-accent" />
            </div>
            <h4 className="font-display font-bold text-2xl text-primary mb-6">{t(lang, 'termLoan')}</h4>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted-foreground">{t(lang, 'projectCostLabel')}</div><div className="tabular-nums font-medium">{t(lang, 'termCostVal')}</div>
              <div className="text-muted-foreground">{t(lang, 'maxLoan')}</div><div className="tabular-nums font-medium">{t(lang, 'termLoanVal')}</div>
              <div className="text-muted-foreground">{t(lang, 'interestRate')}</div><div className="tabular-nums font-medium">{t(lang, 'termInterestVal')}</div>
              <div className="text-muted-foreground">{t(lang, 'tenure')}</div><div className="tabular-nums font-medium">{t(lang, 'termTenureVal')}</div>
              <div className="text-muted-foreground">{t(lang, 'moratorium')}</div><div className="tabular-nums font-medium">{t(lang, 'termMoratoriumVal')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 border border-border p-10 bg-primary text-primary-foreground relative overflow-hidden">
          <Shield size={32} strokeWidth={1.5} className="mb-6 opacity-80" />
          <h3 className="font-display font-extrabold text-3xl lg:text-4xl tracking-tight mb-4 max-w-lg">
            {t(lang, 'trustHeadline')}
          </h3>
          <p className="text-primary-foreground/80 max-w-lg leading-relaxed">
            {t(lang, 'trustBody')}
          </p>
        </div>
        <div className="relative border border-border overflow-hidden">
          <img src={MARKET_IMG} alt="Rural market" className="w-full h-full object-cover min-h-[280px]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground">{t(lang, 'footerCopy')}</div>
          <div className="text-xs text-muted-foreground">{t(lang, 'footerFramework')}</div>
        </div>
      </footer>
    </div>
  );
}
