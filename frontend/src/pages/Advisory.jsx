import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useApp, API } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Search,
  Check,
  X,
  Navigation
} from 'lucide-react';
import ReportView from '@/components/ReportView';

export default function Advisory() {
  const { lang, authHeaders } = useApp();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  
  // Village Search and Selection states
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [form, setForm] = useState({
    state: '',
    district: '',
    block: '',
    village: '',
    selected_village: null,
    business_category: '',
    margin_capital: 100000,
    repayment_frequency: 'quarterly',
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  // Load business categories on mount
  useEffect(() => {
    axios.get(`${API}/business-categories`)
      .then(r => setCategories(r.data))
      .catch(err => console.error('Failed to load business categories:', err));
  }, []);

  // Debounced live search across 644k+ villages in MongoDB
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || selectedVillage) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const debounceTimer = setTimeout(async () => {
      try {
        const response = await axios.get(`${API}/villages/search`, {
          params: { q: trimmed, limit: 20 }
        });
        setSearchResults(Array.isArray(response.data) ? response.data : []);
        setHasSearched(true);
      } catch (err) {
        console.error('Village search API error:', err);
        setSearchError(err.response?.data?.detail || 'Failed to search villages. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedVillage]);

  const handleSelectVillage = (village) => {
    setSelectedVillage(village);
    setForm(prev => ({
      ...prev,
      state: village.state_name,
      district: village.district_name,
      block: village.block_name || '',
      village: village.village_name,
      selected_village: village,
    }));
    setSearchResults([]);
    setSearchQuery(village.village_name);
  };

  const handleClearVillage = () => {
    setSelectedVillage(null);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setForm(prev => ({
      ...prev,
      state: '',
      district: '',
      block: '',
      village: '',
      selected_village: null,
    }));
  };

  const canNext = {
    1: !!selectedVillage && !!form.state && !!form.district && !!form.village,
    2: !!form.business_category,
    3: form.margin_capital >= 10000,
  }[step];

  const generate = async () => {
    setLoading(true);
    try {
      const r = await axios.post(`${API}/feasibility/generate`, {
        ...form,
        selected_village: selectedVillage,
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
        <div className="text-xs tracking-[0.3em] uppercase text-accent font-bold mb-3">{t(lang, 'aiAdvisory')}</div>
        <h1 className="font-display text-3xl lg:text-5xl tracking-tight font-extrabold text-primary">
          {t(lang, 'startAdvisory')}
        </h1>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-4 gap-2 mb-10" data-testid="stepper">
        {STEPS.map((s) => (
          <div key={s.n} className={`border ${step >= s.n ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'} p-4 transition-colors`}>
            <s.icon size={16} strokeWidth={1.75} className="mb-2" />
            <div className="text-[10px] tracking-[0.2em] uppercase font-bold">{t(lang, 'step')} {s.n}</div>
            <div className="text-sm font-semibold mt-1">{s.title}</div>
          </div>
        ))}
      </div>

      <div className="border border-border bg-card p-8 lg:p-12">
        {step === 1 && (
          <div className="space-y-6" data-testid="step-location">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">{t(lang, 'whereIsEnterprise')}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t(lang, 'panchayatAnchor')}</p>
            </div>

            {!selectedVillage ? (
              <div className="space-y-4">
                <div className="relative">
                  <Label htmlFor="village-search-input" className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground mb-2 block">
                    {t(lang, 'village')} / Search Village Name
                  </Label>
                  <div className="relative flex items-center">
                    <Search size={18} className="absolute left-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="village-search-input"
                      data-testid="village-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type village name (e.g., Khag, Rampur, Sinnar)..."
                      className="pl-10 pr-10 h-13 text-base border-border focus-visible:ring-primary"
                      autoComplete="off"
                    />
                    {isSearching ? (
                      <Loader2 size={18} className="absolute right-3.5 animate-spin text-muted-foreground" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setSearchResults([]); setHasSearched(false); }}
                        className="absolute right-3.5 text-muted-foreground hover:text-foreground p-1"
                        aria-label="Clear search"
                        data-testid="clear-search-btn"
                      >
                        <X size={16} />
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Search across 644,000+ Indian villages from Census & Master records.
                  </p>
                </div>

                {/* Search Error Notice */}
                {searchError && (
                  <div className="p-4 border border-destructive/30 bg-destructive/10 text-destructive text-sm" data-testid="search-error">
                    {searchError}
                  </div>
                )}

                {/* Searching Loader Indicator */}
                {isSearching && (
                  <div className="p-4 border border-border bg-background text-sm text-muted-foreground flex items-center gap-2" data-testid="search-loading">
                    <Loader2 size={16} className="animate-spin text-primary" /> Searching village database...
                  </div>
                )}

                {/* No Results Found Notice */}
                {!isSearching && hasSearched && searchResults.length === 0 && (
                  <div className="p-6 border border-border bg-muted/20 text-center space-y-1" data-testid="no-villages-found">
                    <p className="text-sm font-semibold text-foreground">No villages found matching &quot;{searchQuery.trim()}&quot;</p>
                    <p className="text-xs text-muted-foreground">Check the spelling or try searching for the Gram Panchayat name.</p>
                  </div>
                )}

                {/* Autocomplete Results Dropdown List */}
                {!isSearching && searchResults.length > 0 && (
                  <div className="border border-border bg-card shadow-sm divide-y divide-border max-h-96 overflow-y-auto" data-testid="village-search-results">
                    <div className="p-2.5 bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                      <span>Matching Villages ({searchResults.length})</span>
                      <span>Click to select anchor</span>
                    </div>
                    {searchResults.map((v) => (
                      <div
                        key={v.master_id}
                        onClick={() => handleSelectVillage(v)}
                        data-testid={`village-item-${v.master_id}`}
                        className="p-3.5 hover:bg-muted/60 cursor-pointer transition-colors text-left flex items-start justify-between group"
                      >
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
                              {v.village_name}
                            </span>
                            {v.block_name && (
                              <span className="text-xs px-2 py-0.5 border border-border bg-muted/40 text-muted-foreground">
                                Block: {v.block_name}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-medium text-foreground/80">{v.district_name}, {v.state_name}</span>
                            {v.village_census_code && (
                              <span className="text-muted-foreground/70">· Census Code: {v.village_census_code}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {v.centroid_latitude !== null && v.centroid_longitude !== null ? (
                            <div className="inline-flex items-center gap-1 text-[11px] font-mono text-accent bg-accent/10 px-2 py-1 border border-accent/20">
                              <Navigation size={11} className="rotate-45" />
                              <span>{v.centroid_latitude.toFixed(4)}°, {v.centroid_longitude.toFixed(4)}°</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 border border-border px-1.5 py-0.5">
                              Centroid pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Village Card View */
              <div className="border border-primary bg-primary/5 p-6 space-y-4" data-testid="selected-village-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Selected Anchor Village</div>
                      <h3 className="font-display text-2xl font-black text-foreground mt-0.5">
                        {selectedVillage.village_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {selectedVillage.district_name} District, {selectedVillage.state_name} {selectedVillage.state_code ? `(${selectedVillage.state_code})` : ''}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearVillage}
                    className="text-xs gap-1.5 border-border hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    data-testid="change-village-btn"
                  >
                    <X size={14} /> Change Village
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-border/60">
                  <div className="p-3 bg-background border border-border">
                    <div className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Block / Taluka</div>
                    <div className="font-semibold mt-1 text-foreground">{selectedVillage.block_name || 'N/A'}</div>
                  </div>
                  <div className="p-3 bg-background border border-border">
                    <div className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">District</div>
                    <div className="font-semibold mt-1 text-foreground">{selectedVillage.district_name}</div>
                  </div>
                  <div className="p-3 bg-background border border-border">
                    <div className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">State</div>
                    <div className="font-semibold mt-1 text-foreground">{selectedVillage.state_name}</div>
                  </div>
                  <div className="p-3 bg-background border border-border">
                    <div className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Geospatial Anchor</div>
                    <div className="font-mono text-accent font-semibold mt-1">
                      {selectedVillage.centroid_latitude !== null && selectedVillage.centroid_longitude !== null
                        ? `${selectedVillage.centroid_latitude.toFixed(4)}°, ${selectedVillage.centroid_longitude.toFixed(4)}°`
                        : 'Census Centroid'}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground/70">ID: {selectedVillage.master_id}</span>
                  {selectedVillage.village_census_code && (
                    <span>· Census Code: {selectedVillage.village_census_code}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6" data-testid="step-business">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">{t(lang, 'whichBusinessPlanning')}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t(lang, 'chooseClosestCategory')}</p>
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
              <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">{t(lang, 'howMuchMargin')}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t(lang, 'marginExplanation')}</p>
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
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">{t(lang, 'projectCostLabel')}</div>
                <div className="font-display font-bold text-2xl tabular-nums">₹{(form.margin_capital * 10).toLocaleString('en-IN')}</div>
              </div>
              <div className="border border-border p-4 bg-muted/40">
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">{t(lang, 'estLoan')}</div>
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
              <h2 className="font-display text-2xl font-extrabold text-primary tracking-tight">{t(lang, 'readyToGenerate')}</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                {t(lang, 'readyAnalyseText')}
              </p>
            </div>
            <Button size="lg" onClick={generate} disabled={loading} className="rounded-full h-14 px-10 gap-2" data-testid="generate-btn">
              {loading ? <><Loader2 className="animate-spin" size={18} /> {t(lang, 'generating')}</> : <>{t(lang, 'generate')} <ArrowRight size={18} /></>}
            </Button>
          </div>
        )}

        {/* Navigation buttons */}
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
