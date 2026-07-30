'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Zap } from 'lucide-react';
import { searchTools, toolCount } from '@/lib/tools';
import { categories, categoryMap } from '@/lib/categories';
import { Icon } from '@/components/ui/Icon';

const quickLinks = ['PDF Birleştir', 'Görsel Sıkıştır', 'QR Kod', 'JSON Formatla', 'Parola Üret'];

export function Hero() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => searchTools(q, 6), [q]);
  const showResults = focused && q.trim().length > 0;

  return (
    <section className="relative overflow-hidden">
      <div className="aurora" />
      <div className="absolute inset-0 grid-bg" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8">
        <span className="glass animate-rise inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold">
          <Zap className="h-3.5 w-3.5 text-brand-500" />
          {toolCount}+ araç · Üyelik yok · Tarayıcıda çalışır
        </span>

        <h1 className="animate-rise mx-auto mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
          İhtiyacınız olan her araç{' '}
          <span className="bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            tek bir yerde
          </span>
        </h1>

        <p className="animate-rise mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          PDF, görsel, yapay zekâ, SEO ve geliştirici araçları. Dosya yüklemeden, beklemeden,
          saniyeler içinde sonuç alın.
        </p>

        {/* Search */}
        <div className="animate-rise relative z-20 mx-auto mt-9 max-w-2xl">
          <div
            className={`glass flex items-center gap-3 rounded-2xl px-4 shadow-xl transition-all duration-300 ${
              focused ? 'ring-brand' : ''
            }`}
          >
            <Search className="h-5 w-5 shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (results[0]) router.push(`/tools/${results[0].slug}`);
                  else router.push(`/tools?q=${encodeURIComponent(q)}`);
                }
              }}
              placeholder="Ne yapmak istiyorsunuz? Örn: pdf birleştir"
              aria-label="Araç ara"
              className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
            />
            <Link
              href={`/tools${q ? `?q=${encodeURIComponent(q)}` : ''}`}
              className="hidden h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-4 text-sm font-semibold text-white sm:flex"
            >
              Ara <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {showResults && (
            <div className="glass absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl p-2 text-left shadow-2xl">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">Sonuç bulunamadı.</p>
              ) : (
                results.map((tool) => {
                  const cat = categoryMap.get(tool.category)!;
                  return (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${cat.gradient} text-white`}
                      >
                        <Icon name={tool.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{tool.name}</span>
                        <span className="block truncate text-xs text-muted">{tool.description}</span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {quickLinks.map((t) => (
              <button
                key={t}
                onClick={() => setQ(t)}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand-400 hover:text-brand-500"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Category strip */}
        <div className="no-scrollbar mt-12 flex snap-x gap-3 overflow-x-auto pb-2 sm:justify-center sm:flex-wrap">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="surface group flex shrink-0 snap-start items-center gap-2.5 rounded-xl px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${c.gradient} text-white transition-transform group-hover:scale-110`}
              >
                <Icon name={c.icon} className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">{c.short}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
