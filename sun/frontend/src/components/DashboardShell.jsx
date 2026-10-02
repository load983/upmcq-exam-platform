// ================== components/DashboardShell.jsx ==================
// অ্যাডমিন / শিক্ষক / শিক্ষার্থীর পেজের কমন ফ্রেম: বাঁদিকে সাইডবার (সার্চ + ভাঁজ করা যায় এমন গ্রুপ),
// উপরে টপবার (কুইক নেভ, ভাষা, থিম, লগআউট)। মোবাইলে সাইডবার ড্রয়ার হয়ে খোলে।
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import BrandLogo from './BrandLogo';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useLanguage } from '../context/LanguageContext';
import ThemeSwitcher from './ThemeSwitcher';
import NotificationBell from './NotificationBell';
import { Icon } from '../pages/admin/adminUi';
import { buildNav, isItemActive } from './shellNav';

// ---------- সাইডবারের ব্যাজ (যেমন পেন্ডিং পেমেন্ট) — পেজ থেকে সেট হয় ----------
const BadgeCtx = createContext({ setBadges: () => {} });

export function useShellBadges(next) {
  const { setBadges } = useContext(BadgeCtx);
  const sig = JSON.stringify(next);
  useEffect(() => {
    setBadges((prev) => ({ ...prev, ...JSON.parse(sig) }));
  }, [sig, setBadges]);
}

function CountBadge({ n }) {
  return n ? (
    <span className="ml-auto inline-flex min-w-[1.25rem] justify-center rounded-full bg-primary-500 px-1.5 text-xs font-semibold text-white">{n}</span>
  ) : null;
}

function LangMenu() {
  const { lang, setLang, languages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const out = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, []);
  const cur = languages.find((l) => l.code === lang) || languages[0];
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="shell-topbtn" aria-haspopup="menu" aria-expanded={open} aria-label={t('lang.select')} onClick={() => setOpen((v) => !v)}>
        <Icon name="globe" className="h-4 w-4" />
        <span className="font-semibold">{cur.short}</span>
        <Icon name="chevron" className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="animate-fade-in absolute right-0 z-50 mt-2 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-gray-800">
          {languages.map((l) => (
            <button
              key={l.code}
              role="menuitem"
              type="button"
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/5 ${l.code === lang ? 'font-semibold text-primary-600 dark:text-primary-300' : 'dark:text-gray-200'}`}
            >
              {l.label}
              {l.code === lang && <Icon name="check" className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Ctrl+K — কুইক নেভ
function Palette({ items, onClose, onGo }) {
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const list = items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase()));
  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && list[idx]) onGo(list[idx].to);
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className="card w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 dark:border-white/10">
          <Icon name="search" className="h-4 w-4 text-gray-400" />
          <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }} onKeyDown={onKey} placeholder={t('shell.quickNav')} className="h-12 w-full bg-transparent text-sm outline-none dark:text-white" />
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-500">{t('shell.noMatch')}</li>}
          {list.map((i, n) => (
            <li key={i.to}>
              <button type="button" onMouseEnter={() => setIdx(n)} onClick={() => onGo(i.to)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm dark:text-gray-200 ${n === idx ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200' : ''}`}>
                <Icon name={i.icon} />
                {i.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function DashboardShell({ role, children }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [badges, setBadgesState] = useState({});
  const setBadges = useCallback((fn) => setBadgesState(fn), []);
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState('');
  const [palette, setPalette] = useState(false);
  const [open, setOpen] = useState({});

  const nav = useMemo(() => buildNav(role, t, badges), [role, t, badges]);
  const all = useMemo(() => [nav.pinned, ...nav.groups.flatMap((g) => g.items)], [nav]);
  const active = (it) => isItemActive(it, location);
  const current = all.find(active) || nav.pinned;

  useEffect(() => { setDrawer(false); setQ(''); }, [location.pathname, location.search]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate(role === 'admin' ? '/admin/login' : role === 'teacher' ? '/teacher/login' : '/exams');
  };

  const filtered = q.trim() ? all.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase())) : null;

  const renderItem = (it, extraCls = '') => (
    <Link key={it.key} to={it.to} aria-current={active(it) ? 'page' : undefined} className={`shell-item ${extraCls}`}>
      <Icon name={it.icon} />
      <span className="truncate">{it.label}</span>
      <CountBadge n={it.badge} />
    </Link>
  );

  const sidebar = (
    <aside className="shell-sidebar" aria-label={nav.roleLabel}>
      <Link to="/" className="flex items-center gap-3 px-4 pb-3 pt-5">
        <BrandLogo size="h-10 w-10" radius="rounded-lg" fallback={<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-500 text-white"><Icon name="logo" className="h-5 w-5" /></span>} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold dark:text-white">{t('brand.name')}</span>
          <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">{nav.roleLabel}</span>
        </span>
      </Link>

      <div className="px-3">
        <label className="relative block">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('shell.search')} aria-label={t('shell.search')} className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-primary-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-gray-500" />
        </label>
      </div>

      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {filtered ? (
          filtered.length ? filtered.map((i) => renderItem(i)) : <p className="px-3 py-4 text-sm text-gray-500">{t('shell.noMatch')}</p>
        ) : (
          <>
            <Link to={nav.pinned.to} aria-current={active(nav.pinned) ? 'page' : undefined} className="shell-item !items-start !py-2.5 border border-transparent aria-[current=page]:border-primary-500/20">
              <Icon name={nav.pinned.icon} className="mt-0.5 h-5 w-5" />
              <span className="min-w-0">
                <span className="block truncate">{nav.pinned.label}</span>
                <span className="block truncate text-xs font-normal opacity-70">{nav.pinned.sub}</span>
              </span>
            </Link>
            {nav.groups.map((g) => {
              const isOpen = open[g.key] ?? g.items.some(active);
              const groupBadge = g.items.reduce((n, i) => n + (Number(i.badge) || 0), 0);
              return (
                <div key={g.key} className="pt-1">
                  <button type="button" className="shell-group-btn" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [g.key]: !isOpen }))}>
                    <span className="flex items-center gap-2">{g.label}{!isOpen && groupBadge ? <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> : null}</span>
                    <Icon name="chevron" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <div className="animate-fade-in space-y-0.5 pb-1">{g.items.map((i) => renderItem(i))}</div>}
                </div>
              );
            })}
          </>
        )}
      </nav>

      <div className="space-y-3 border-t border-gray-200 p-3 dark:border-white/[0.07]">
        <div className="flex items-center gap-2.5 px-1 text-sm text-gray-600 dark:text-gray-300">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-500/15 text-xs font-bold text-primary-600 dark:text-primary-300">
            {[...(user?.name || '?').trim()][0]?.toUpperCase()}
          </span>
          <span className="truncate">{user?.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/" className="btn !gap-1.5 !rounded-lg border border-amber-500/40 !px-2 !py-2 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400">
            <Icon name="external" className="h-4 w-4" />{t('shell.website')}
          </Link>
          <button type="button" onClick={handleLogout} className="btn !gap-1.5 !rounded-lg border border-red-500/40 !px-2 !py-2 text-red-600 hover:bg-red-500/10 dark:text-red-400">
            <Icon name="power" className="h-4 w-4" />{t('common.logout')}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <BadgeCtx.Provider value={{ setBadges }}>
      <div className="flex h-[100dvh] overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div className="hidden lg:block">{sidebar}</div>

        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
            <div className="animate-fade-in absolute inset-y-0 left-0 max-w-[85vw]">{sidebar}</div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur dark:border-white/[0.07] dark:bg-gray-950/90 md:px-6">
            <button type="button" className="shell-topbtn !px-2.5 lg:hidden" aria-label={t('nav.openMenu')} onClick={() => setDrawer(true)}>
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-500/15 text-primary-600 dark:text-primary-300 sm:grid">
              <Icon name={current.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold leading-tight dark:text-white">{current.label}</div>
              <div className="truncate text-xs text-gray-500 dark:text-gray-400">{t('shell.welcome', { name: user?.name || '' })}</div>
            </div>
            <button type="button" onClick={() => setPalette(true)} className="shell-topbtn hidden w-56 justify-between md:inline-flex">
              <span className="flex items-center gap-2"><Icon name="search" className="h-4 w-4" />{t('shell.quickNavShort')}</span>
              <kbd className="rounded border border-gray-300 px-1.5 text-[10px] dark:border-white/15">Ctrl+K</kbd>
            </button>
            {role === 'student' && <NotificationBell />}
            <LangMenu />
            <ThemeSwitcher />
            <button type="button" onClick={handleLogout} className="shell-topbtn !px-2.5" aria-label={t('common.logout')} title={t('common.logout')}>
              <Icon name="logout" className="h-[18px] w-[18px]" />
            </button>
          </header>

          <main className="shell-main min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
      {palette && <Palette items={all} onClose={() => setPalette(false)} onGo={(to) => { setPalette(false); navigate(to); }} />}
    </BadgeCtx.Provider>
  );
}
