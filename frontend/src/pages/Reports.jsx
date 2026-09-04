import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useApp, API } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { MapPin, TrendingUp, Trash2, Eye, Plus } from 'lucide-react';
import ReportView from '@/components/ReportView';

export default function Reports() {
  const { lang, authHeaders, user } = useApp();
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    axios.get(`${API}/reports`, { headers: authHeaders })
      .then(r => setReports(r.data))
      .finally(() => setLoading(false));
  }, [user, nav, authHeaders]);

  const del = async (id) => {
    await axios.delete(`${API}/reports/${id}`, { headers: authHeaders });
    setReports(reports.filter(r => r.id !== id));
    toast.success('Deleted');
  };

  if (selected) return <ReportView report={selected} onReset={() => setSelected(null)} />;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-accent font-bold mb-2">{t(lang, 'yourReports')}</div>
          <h1 className="font-display text-3xl lg:text-5xl tracking-tight font-extrabold text-primary">{t(lang, 'dashboard')}</h1>
        </div>
        <Link to="/advisory">
          <Button className="rounded-full px-6 gap-2" data-testid="new-advisory-btn"><Plus size={16} /> {t(lang, 'startAdvisory')}</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading…</div>
      ) : reports.length === 0 ? (
        <div className="border border-border border-dashed p-16 text-center bg-card" data-testid="empty-reports">
          <p className="text-muted-foreground mb-4">{t(lang, 'noReports')}</p>
          <Link to="/advisory">
            <Button className="rounded-full">{t(lang, 'startAdvisory')}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(r => {
            const input = r?.input || r?.input_params || {};
            const financials = r?.financials || r?.financial_model || {};
            const feasibility = r?.feasibility || r?.viability || {};

            return (
              <div key={r.id || Math.random()} className="border border-border bg-card p-6 hover-lift" data-testid={`report-card-${r.id}`}>
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin size={11} /> {input.village || 'Gram Panchayat'}, {input.district || ''}
                </div>
                <h3 className="font-display font-bold text-lg text-primary mb-4 leading-snug">{input.business_category || 'Enterprise'}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-4">
                  <div>
                    <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Score</div>
                    <div className="font-bold tabular-nums flex items-center gap-1"><TrendingUp size={12} className="text-secondary" /> {feasibility.viability_score || 80}/100</div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Loan</div>
                    <div className="font-bold tabular-nums">₹{(financials.approved_loan || 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelected(r)} data-testid={`view-${r.id}`}>
                    <Eye size={14} className="mr-1" /> {t(lang, 'view')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => del(r.id)} data-testid={`delete-${r.id}`}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
