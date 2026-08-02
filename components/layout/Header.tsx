'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, Search, Sparkles, X } from 'lucide-react';
import { categories } from '@/lib/categories';
import { ThemeToggle } from './ThemeToggle';
import { SearchDialog } from '@/components/search/SearchDialog';
import { Icon } from '@/components/ui/Icon';

export function Header() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass shadow-sm' : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-500/25">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-[17px]">
              Multi<span className="text-brand-500">Tools</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted hover-surface transition-colors hover:text-[var(--fg)]"
              >
                <Icon name={c.icon} className="h-4 w-4" />
                {c.short}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="flex h-9 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm text-muted transition-colors hover-surface"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Araç ara…</span>
              <kbd className="ml-2 hidden rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] md:inline">
                ⌘K
              </kbd>
            </button>
            <ThemeToggle />
            <Link
              href="/pricing"
              className="hidden h-9 items-center rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-transform hover:-translate-y-0.5 sm:flex"
            >
              Premium
            </Link>
            <button
              onClick={() => setMenu((m) => !m)}
              aria-label="Menü"
              className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] lg:hidden"
            >
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menu && (
          <div className="glass border-t border-[var(--border)] px-4 py-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  onClick={() => setMenu(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover-surface"
                >
                  <Icon name={c.icon} className="h-4 w-4 text-brand-500" />
                  {c.short}
                </Link>
              ))}
            </div>
            <Link
              href="/tools"
              onClick={() => setMenu(false)}
              className="mt-2 block rounded-xl bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              Tüm araçlar
            </Link>
          </div>
        )}
      </header>

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
