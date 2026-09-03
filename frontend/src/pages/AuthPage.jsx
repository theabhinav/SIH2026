import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Sprout } from 'lucide-react';

export default function AuthPage({ mode }) {
  const { login, register, lang } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      toast.success(mode === 'login' ? 'Welcome back' : 'Account created');
      nav('/advisory');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md border border-border bg-card p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center">
            <Sprout size={20} strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-display font-black text-xl tracking-tight">{t(lang, 'brand')}</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{mode === 'login' ? t(lang, 'signIn') : t(lang, 'signUp')}</div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-5" data-testid={`${mode}-form`}>
          {mode === 'register' && (
            <div className="space-y-2">
              <Label className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground">{t(lang, 'name')}</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12" data-testid="input-name" />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground">{t(lang, 'email')}</Label>
            <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12" data-testid="input-email" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground">{t(lang, 'password')}</Label>
            <Input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-12" data-testid="input-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full" data-testid="submit-auth">
            {loading ? '…' : mode === 'login' ? t(lang, 'signIn') : t(lang, 'signUp')}
          </Button>
        </form>
        <div className="mt-6 text-sm text-center text-muted-foreground">
          {mode === 'login' ? t(lang, 'noAccount') : t(lang, 'haveAccount')}{' '}
          <Link to={mode === 'login' ? '/register' : '/login'} className="text-accent font-semibold underline underline-offset-4">
            {mode === 'login' ? t(lang, 'signUp') : t(lang, 'signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
