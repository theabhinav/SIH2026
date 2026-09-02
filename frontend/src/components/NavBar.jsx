import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { t, LANGS } from '@/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Sprout, Languages, LogOut, User } from 'lucide-react';

export default function NavBar() {
  const { user, logout, lang, setLang } = useApp();
  const nav = useNavigate();

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40" data-testid="main-nav">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" data-testid="brand-link">
          <div className="w-9 h-9 bg-primary text-primary-foreground flex items-center justify-center rounded-sm">
            <Sprout size={20} strokeWidth={1.75} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-black tracking-tight text-lg">{t(lang, 'brand')}</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">AI Advisory</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="lang-switcher" className="gap-2">
                <Languages size={16} />
                <span className="hidden sm:inline">{LANGS.find(l => l.code === lang)?.native}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGS.map((l) => (
                <DropdownMenuItem key={l.code} onSelect={() => setLang(l.code)} data-testid={`lang-${l.code}`}>
                  <span className="font-medium mr-2">{l.native}</span>
                  <span className="text-xs text-muted-foreground">{l.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => nav('/reports')} data-testid="my-reports-link">
                {t(lang, 'dashboard')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="user-menu" className="gap-2">
                    <User size={14} /> {user.name?.split(' ')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={logout} data-testid="logout-btn">
                    <LogOut size={14} className="mr-2" /> {t(lang, 'signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => nav('/login')} data-testid="signin-btn">
                {t(lang, 'signIn')}
              </Button>
              <Button size="sm" onClick={() => nav('/register')} data-testid="signup-btn" className="rounded-full px-5">
                {t(lang, 'signUp')}
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
