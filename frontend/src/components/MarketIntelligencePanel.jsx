/**
 * MarketIntelligencePanel.jsx
 *
 * Displays Local Market Intelligence for a selected village + business category:
 *   - 5 km / 10 km demographic catchment (from MongoDB)
 *   - Category-specific competitor counts (from MSME Udyam API)
 *   - Competition level badge (Low / Medium / High)
 *   - Leaflet map with village pin, 5km/10km rings, enterprise markers
 *
 * Fetches from:
 *   GET /api/market-intelligence?masterId=<id>&category=<cat>
 */
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API } from '@/context/AppContext';
import {
  Loader2,
  Users,
  Building2,
  Map,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Leaflet styles
import 'leaflet/dist/leaflet.css';

const COMPETITION_CONFIG = {
  Low: { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', Icon: TrendingDown, label: 'Low Competition' },
  Medium: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', Icon: Minus, label: 'Moderate Competition' },
  High: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', Icon: TrendingUp, label: 'High Competition' },
};

function StatCard({ label, value, sub }) {
  return (
    <div className="border border-border bg-background p-4">
      <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground mb-1">{label}</div>
      <div className="font-display font-black text-2xl text-primary tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : (value ?? '—')}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function CatchmentSection({ title, data }) {
  if (!data) return null;
  const isAvailable = data.demographics_available !== false;
  const subText = isAvailable
    ? (data.reason ? `Census 2011 · ${data.reason}` : 'Census 2011')
    : (data.reason || 'Data unavailable (Urban Census Town)');

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Villages" value={data.village_count} />
        <StatCard label="Population" value={isAvailable ? data.population : 'N/A'} sub={subText} />
        <StatCard label="Households" value={isAvailable ? data.households : 'N/A'} />
        <StatCard label="Workers" value={isAvailable ? data.workers : 'N/A'} />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
        <StatCard label="Male" value={isAvailable ? data.male : 'N/A'} />
        <StatCard label="Female" value={isAvailable ? data.female : 'N/A'} />
        <StatCard label="Literate" value={isAvailable ? data.literate : 'N/A'} />
        <StatCard label="SC Pop." value={isAvailable ? data.sc : 'N/A'} />
        <StatCard label="ST Pop." value={isAvailable ? data.st : 'N/A'} />
      </div>
    </div>
  );
}

// Lazy-load the Leaflet map to avoid SSR issues
function VillageMap({ anchor, enterprises }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!anchor?.location?.coordinates || !mapRef.current) return;

    // Avoid double-init
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const L = window.L;
    if (!L) return;

    const [lon, lat] = anchor.location.coordinates;

    const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lon], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Anchor village marker
    const villageIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:#2563eb;border:2px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
      className: '',
      iconAnchor: [7, 7],
    });
    L.marker([lat, lon], { icon: villageIcon })
      .addTo(map)
      .bindPopup(`<b>${anchor.village_name}</b><br>${anchor.district_name}, ${anchor.state_name}`);

    // 5 km ring
    L.circle([lat, lon], { radius: 5000, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.05, weight: 1.5, dashArray: '4' }).addTo(map);
    // 10 km ring
    L.circle([lat, lon], { radius: 10000, color: '#9333ea', fillColor: '#9333ea', fillOpacity: 0.03, weight: 1.5, dashArray: '4' }).addTo(map);

    // Enterprise markers
    const enterpriseIcon = L.divIcon({
      html: `<div style="width:10px;height:10px;background:#f59e0b;border:1.5px solid white;border-radius:50%;box-shadow:0 0 3px rgba(0,0,0,0.3)"></div>`,
      className: '',
      iconAnchor: [5, 5],
    });

    for (const ent of (enterprises || [])) {
      if (ent.lat && ent.lon) {
        L.marker([ent.lat, ent.lon], { icon: enterpriseIcon })
          .addTo(map)
          .bindPopup(`<b>${ent.name}</b><br>PIN: ${ent.pincode || 'N/A'}<br>${ent.dist_km} km away<br><small>${ent.activities?.slice(0, 80)}...</small>`);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [anchor, enterprises]);

  if (!anchor?.location?.coordinates) {
    return (
      <div className="h-64 border border-border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
        Map not available — no geospatial coordinates for this village.
      </div>
    );
  }

  return (
    <div>
      {/* Leaflet CSS is injected by import; inject Leaflet JS via CDN if not loaded */}
      <LeafletLoader>
        <div ref={mapRef} style={{ height: '360px', width: '100%' }} className="border border-border z-0 relative" />
      </LeafletLoader>
      <div className="text-[10px] text-muted-foreground mt-1.5 flex gap-4">
        <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, display: 'inline-block', background: '#2563eb', borderRadius: '50%' }} /> Selected Village</span>
        <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, display: 'inline-block', background: '#f59e0b', borderRadius: '50%' }} /> Similar Enterprise</span>
        <span className="flex items-center gap-1 text-blue-600">─ ─ 5 km radius</span>
        <span className="flex items-center gap-1 text-purple-600">─ ─ 10 km radius</span>
      </div>
    </div>
  );
}

function LeafletLoader({ children }) {
  const [ready, setReady] = useState(!!window.L);

  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  if (!ready) return <div className="h-64 border border-border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="animate-spin mr-2" size={16} /> Loading map...</div>;
  return children;
}

export default function MarketIntelligencePanel({ masterId, category }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showEnterprises, setShowEnterprises] = useState(false);

  useEffect(() => {
    if (!masterId || !category) return;
    setLoading(true);
    setData(null);
    setError(null);

    axios
      .get(`${API}/market-intelligence`, { params: { masterId, category } })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load market intelligence.'))
      .finally(() => setLoading(false));
  }, [masterId, category]);

  if (!masterId || !category) return null;

  if (loading) {
    return (
      <div className="border border-border bg-card p-8 flex items-center gap-3 text-sm text-muted-foreground mt-6">
        <Loader2 className="animate-spin text-primary" size={20} />
        <div>
          <div className="font-semibold text-foreground">Analysing Local Market Intelligence…</div>
          <div className="text-xs mt-0.5">Fetching MSME data from Udyam registry, resolving pincodes, calculating catchment. This may take 30–60 seconds.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-destructive/30 bg-destructive/5 p-6 flex gap-3 mt-6">
        <AlertCircle size={20} className="text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-destructive text-sm">Market Intelligence Error</div>
          <div className="text-xs text-muted-foreground mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const compConfig = COMPETITION_CONFIG[data.competition_level] || COMPETITION_CONFIG.Low;

  return (
    <div className="mt-6 space-y-6 border-t border-border pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-accent mb-1">Local Market Intelligence</div>
          <h3 className="font-display text-xl font-extrabold text-primary">
            {data.anchor?.village_name} — {category}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {data.anchor?.district_name}, {data.anchor?.state_name} · Real data from Census 2011 + MSME Udyam Registry
          </p>
        </div>
        <div className={`border ${compConfig.bg} px-4 py-2 text-center shrink-0`}>
          <compConfig.Icon size={18} className={`${compConfig.color} mx-auto mb-1`} />
          <div className={`text-xs font-bold uppercase tracking-wider ${compConfig.color}`}>{compConfig.label}</div>
        </div>
      </div>

      {/* Competition counts */}
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
          <Building2 size={13} className="inline mr-1.5 -mt-0.5" />
          {category} Enterprises — Udyam Registry (Same District)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Within 5 km" value={data.competitors_5km} sub="By pincode radius" />
          <StatCard label="Within 10 km" value={data.competitors_10km} sub="By pincode radius" />
          <StatCard label="Matched in District" value={data.msme_summary?.matched_category} sub={`of ${(data.msme_summary?.fetched_for_analysis || 0).toLocaleString('en-IN')} analysed`} />
          <StatCard label="Total in District" value={data.msme_summary?.total_in_district} sub="All MSME categories" />
        </div>
      </div>

      {/* Geographic Catchment */}
      {data.catchment_available ? (
        <div className="space-y-5">
          <CatchmentSection title="Village Demographic Catchment — 5 km Radius" data={data.catchment_5km} />
          <CatchmentSection title="Village Demographic Catchment — 10 km Radius" data={data.catchment_10km} />
        </div>
      ) : (
        <div className="p-4 border border-border bg-muted/20 text-sm text-muted-foreground flex gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          Geospatial catchment unavailable — this village has no centroid coordinates in the database.
        </div>
      )}

      {/* Map */}
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
          <Map size={13} className="inline mr-1.5 -mt-0.5" />
          Village Map · {data.enterprises?.length || 0} matched enterprises plotted (within 10 km)
        </div>
        <VillageMap anchor={data.anchor} enterprises={data.enterprises} />
      </div>

      {/* Enterprise list */}
      {data.enterprises?.length > 0 && (
        <div>
          <button
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            onClick={() => setShowEnterprises(!showEnterprises)}
          >
            {showEnterprises ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showEnterprises ? 'Hide' : 'Show'} {data.enterprises.length} matched enterprises (within 10 km)
          </button>
          {showEnterprises && (
            <div className="mt-3 border border-border divide-y divide-border max-h-72 overflow-y-auto text-xs">
              {data.enterprises.map((ent, i) => (
                <div key={i} className="p-3 hover:bg-muted/40 transition-colors">
                  <div className="font-semibold text-foreground">{ent.name}</div>
                  <div className="text-muted-foreground mt-0.5">
                    PIN {ent.pincode} · {ent.dist_km} km away
                  </div>
                  {ent.activities && (
                    <div className="text-muted-foreground/70 mt-0.5 line-clamp-1">{ent.activities}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data notes (transparency) */}
      <div>
        <button
          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          onClick={() => setShowNotes(!showNotes)}
        >
          {showNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Data methodology &amp; limitations
        </button>
        {showNotes && (
          <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground pl-4 list-disc">
            {(data.data_notes || []).map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
