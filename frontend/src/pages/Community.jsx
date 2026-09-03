import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useApp, API } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Store, ChevronUp, Coins, Trophy, ImagePlus, Phone, MapPin, Camera, Award } from 'lucide-react';

const RULES = [
  { pts: '+10', label: 'Add shop details' },
  { pts: '+5', label: 'Attach a photo' },
  { pts: '+3', label: 'Add contact number' },
  { pts: '🔓', label: 'Points unlock after 2 upvotes' },
];

export default function Community() {
  const { lang, user, authHeaders, setPoints } = useApp();
  const [shops, setShops] = useState([]);
  const [board, setBoard] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(false);
  const empty = { shop_name: '', category: '', supplies: '', price_info: '', contact: '', state: '', district: '', block: '', village: '', address: '', photo: '' };
  const [form, setForm] = useState(empty);

  const loadShops = () => axios.get(`${API}/shops`, { headers: authHeaders }).then((r) => setShops(r.data));
  const loadBoard = () => axios.get(`${API}/leaderboard`).then((r) => setBoard(r.data));

  useEffect(() => {
    axios.get(`${API}/business-categories`).then((r) => setCategories(r.data));
    axios.get(`${API}/locations`).then((r) => setLocations(r.data));
    loadShops();
    loadBoard();
    // eslint-disable-next-line
  }, []);

  const districts = useMemo(() => (form.state ? Object.keys(locations[form.state] || {}) : []), [locations, form.state]);
  const blocks = useMemo(() => (form.district ? Object.keys(locations[form.state]?.[form.district] || {}) : []), [locations, form.state, form.district]);
  const villages = useMemo(() => (form.block ? (locations[form.state]?.[form.district]?.[form.block] || []) : []), [locations, form.state, form.district, form.block]);

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) { toast.error('Image too large (max 2.5MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, name: form.shop_name || form.name };
      const r = await axios.post(`${API}/shops`, payload, { headers: authHeaders });
      toast.success(r.data.message || 'Shop added!');
      if (r.data.total_points != null) setPoints(r.data.total_points);
      setForm(empty);
      loadShops();
      loadBoard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not add shop');
    } finally {
      setLoading(false);
    }
  };

  const upvote = async (shop) => {
    try {
      const r = await axios.post(`${API}/shops/${shop.id}/upvote`, {}, { headers: authHeaders });
      setShops((list) => list.map((s) => (s.id === shop.id ? { ...s, upvotes: r.data.upvotes, upvoted_by_me: r.data.upvoted_by_me, points_credited: r.data.points_credited } : s)));
      loadBoard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not upvote');
    }
  };

  const setField = (key, v) => {
    const upd = { ...form, [key]: v };
    if (key === 'state') { upd.district = ''; upd.block = ''; upd.village = ''; }
    if (key === 'district') { upd.block = ''; upd.village = ''; }
    if (key === 'block') { upd.village = ''; }
    setForm(upd);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12" data-testid="community-page">
      <div className="mb-10">
        <div className="text-xs tracking-[0.3em] uppercase text-accent font-bold mb-3">{t(lang, 'communityMap')}</div>
        <h1 className="font-display text-3xl lg:text-5xl tracking-tight font-extrabold text-primary">{t(lang, 'localShopsSuppliers')}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">{t(lang, 'communitySub')}</p>
      </div>

      {/* Points rules */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {[
          { pts: '+10', label: t(lang, 'ruleAddShop') },
          { pts: '+5', label: t(lang, 'rulePhoto') },
          { pts: '+3', label: t(lang, 'ruleContact') },
          { pts: '🔓', label: t(lang, 'ruleUnlock') },
        ].map((r) => (
          <div key={r.label} className="border border-border bg-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 text-accent flex items-center justify-center font-display font-black tabular-nums">{r.pts}</div>
            <div className="text-sm font-medium">{r.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-1 space-y-6">
          {user ? (
            <form onSubmit={submit} className="border border-border bg-card p-6 space-y-4" data-testid="add-shop-form">
              <div className="flex items-center gap-2 mb-2">
                <Store size={18} className="text-accent" />
                <h3 className="font-display font-bold text-lg text-primary">{t(lang, 'addShop')}</h3>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'shopName')} *</Label>
                <Input required value={form.shop_name} onChange={(e) => setField('shop_name', e.target.value)} data-testid="shop-name-input" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'category')} *</Label>
                <Select value={form.category} onValueChange={(v) => setField('category', v)}>
                  <SelectTrigger data-testid="shop-category-select"><SelectValue placeholder={`${t(lang, 'selectPrefix')} ${t(lang, 'category')}`} /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'suppliesOffered')}</Label>
                <Textarea rows={2} value={form.supplies} onChange={(e) => setField('supplies', e.target.value)} placeholder="e.g. cattle feed, milk cans" data-testid="shop-supplies-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'priceIndications')}</Label>
                  <Input value={form.price_info} onChange={(e) => setField('price_info', e.target.value)} placeholder="₹/kg, ₹/unit" data-testid="shop-price-input" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'contactNumber')}</Label>
                  <Input value={form.contact} onChange={(e) => setField('contact', e.target.value)} placeholder="Phone" data-testid="shop-contact-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'state')}</Label>
                  <Select value={form.state} onValueChange={(v) => setField('state', v)}>
                    <SelectTrigger data-testid="shop-state-select"><SelectValue placeholder={t(lang, 'state')} /></SelectTrigger>
                    <SelectContent>{Object.keys(locations).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'district')}</Label>
                  <Select value={form.district} onValueChange={(v) => setField('district', v)} disabled={!form.state}>
                    <SelectTrigger data-testid="shop-district-select"><SelectValue placeholder={t(lang, 'district')} /></SelectTrigger>
                    <SelectContent>{districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'block')}</Label>
                  <Select value={form.block} onValueChange={(v) => setField('block', v)} disabled={!form.district}>
                    <SelectTrigger data-testid="shop-block-select"><SelectValue placeholder={t(lang, 'block')} /></SelectTrigger>
                    <SelectContent>{blocks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'village')}</Label>
                  <Select value={form.village} onValueChange={(v) => setField('village', v)} disabled={!form.block}>
                    <SelectTrigger data-testid="shop-village-select"><SelectValue placeholder={t(lang, 'village')} /></SelectTrigger>
                    <SelectContent>{villages.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(lang, 'addressOptional')}</Label>
                <Input value={form.address} onChange={(e) => setField('address', e.target.value)} data-testid="shop-address-input" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><ImagePlus size={14} /> Photo (optional, +5 pts)</Label>
                <input type="file" accept="image/*" onChange={onPhoto} className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:border file:border-border file:bg-background file:text-sm file:cursor-pointer" data-testid="shop-photo-input" />
                {form.photo && <img src={form.photo} alt="preview" className="mt-2 h-28 w-full object-cover border border-border" />}
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-full" data-testid="submit-shop-btn">
                {loading ? 'Saving…' : 'Add & Earn Points'}
              </Button>
            </form>
          ) : (
            <div className="border border-border border-dashed bg-card p-8 text-center" data-testid="community-login-prompt">
              <Award size={28} className="mx-auto text-accent mb-3" />
              <p className="text-muted-foreground mb-4">Sign in to add local shops and start earning contribution points.</p>
              <Link to="/login"><Button className="rounded-full">Sign In</Button></Link>
            </div>
          )}

          {/* Leaderboard */}
          <div className="border border-border bg-card p-6" data-testid="leaderboard">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-accent" />
              <h3 className="font-display font-bold text-lg text-primary">{t(lang, 'leaderboard')}</h3>
            </div>
            {board.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contributors yet. Be the first!</p>
            ) : (
              <ul className="space-y-2">
                {board.map((u) => (
                  <li key={u.rank} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                    <span className="flex items-center gap-2"><span className="w-6 text-muted-foreground tabular-nums">#{u.rank}</span>{u.name}</span>
                    <span className="flex items-center gap-1 font-bold text-accent tabular-nums"><Coins size={13} /> {u.points}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: directory */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-xl text-primary">Community Directory <span className="text-muted-foreground font-normal">({shops.length})</span></h3>
          </div>
          {shops.length === 0 ? (
            <div className="border border-border border-dashed p-16 text-center bg-card text-muted-foreground" data-testid="empty-shops">No shops added yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {shops.map((s) => (
                <div key={s.id} className="group border border-border bg-card overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-accent/50" data-testid={`shop-card-${s.id}`}>
                  {s.photo ? (
                    <img src={s.photo} alt={s.shop_name} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="h-36 w-full bg-muted/50 flex items-center justify-center text-muted-foreground"><Camera size={26} /></div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{s.category}</div>
                    <h4 className="font-display font-bold text-lg text-primary mt-0.5">{s.shop_name}</h4>
                    {s.supplies && <p className="text-sm text-muted-foreground mt-1">{s.supplies}</p>}
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {s.price_info && <div className="tabular-nums">💰 {s.price_info}</div>}
                      {s.contact && <div className="flex items-center gap-1"><Phone size={11} /> {s.contact}</div>}
                      {(s.village || s.district) && <div className="flex items-center gap-1"><MapPin size={11} /> {[s.village, s.block, s.district].filter(Boolean).join(', ')}</div>}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">by {s.contributor_name}</span>
                      <Button
                        size="sm"
                        variant={s.upvoted_by_me ? 'default' : 'outline'}
                        onClick={() => (user ? upvote(s) : toast.error('Sign in to upvote'))}
                        className="gap-1 rounded-full h-8"
                        data-testid={`upvote-${s.id}`}
                      >
                        <ChevronUp size={15} /> {s.upvotes}
                      </Button>
                    </div>
                    {s.points_credited ? (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-secondary font-semibold" data-testid={`unlocked-${s.id}`}><Coins size={12} /> +{s.points_potential} points unlocked for contributor</div>
                    ) : (
                      <div className="mt-2 text-[11px] text-muted-foreground" data-testid={`pending-${s.id}`}>🔒 {Math.max(0, 2 - (s.upvotes || 0))} more upvote{2 - (s.upvotes || 0) === 1 ? '' : 's'} to unlock +{s.points_potential} pts</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
