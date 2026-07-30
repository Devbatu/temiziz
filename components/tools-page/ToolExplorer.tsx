'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { tools, searchTools } from '@/lib/tools';
import { categories } from '@/lib/categories';
import { ToolCard } from '@/components/ui/ToolCard';
import { Icon } from '@/components/ui/Icon';
import { AdUnit } from '@/components/ads/AdUnit';

type Sort = 'popular' | 'new' | 'az';

function Explorer() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [cat, setCat] = useState<string>(params.get('category') ?? 'all');
  const [sort, setSort] = useState<Sort>('popular');

  const results = useMemo(() => {
    let list = q.trim() ? searchTools(q, 500) : [...tools];
    if (cat !== 'all') list = list.filter((t) => t.category === cat);
    if (!q.trim()) {
      if (sort === 'popular') list.sort((a, b) => b.popularity - a.popularity);
      if (sort === 'new') list.sort((a, b) => (a.added < b.added ? 1 : -1));
      if (sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    }
    return list;
  }, [q, cat, sort]);

  return (
    <>
      <div className="surface sticky top-[72px] z-30 mb-8 rounded-2xl p-4">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Araç adı veya anahtar kelime…"
            aria-label="Araçlarda ara"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCat('all')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              cat === 'all'
                ? 'bg-brand-600 text-white'
                : 'border border-[var(--border)] text-muted hover:text-[var(--fg)]'
            }`}
          >
            Tümü
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                cat === c.id
                  ? 'bg-brand-600 text-white'
                  : 'border border-[var(--border)] text-muted hover:text-[var(--fg)]'
              }`}
            >
              <Icon name={c.icon} className="h-3.5 w-3.5" />
              {c.short}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sıralama"
              className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs font-medium outline-none"
            >
              <option value="popular">En popüler</option>
              <option value="new">En yeni</option>
              <option value="az">A → Z</option>
            </select>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted">
        <strong className="text-[var(--fg)]">{results.length}</strong> araç listeleniyor
      </p>

      {results.length === 0 ? (
        <div className="surface rounded-2xl py-20 text-center">
          <p className="font-semibold">Aradığınız araç bulunamadı</p>
          <p className="mt-1 text-sm text-muted">
            Farklı bir kelime deneyin veya kategori filtresini kaldırın.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.slice(0, 12).map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>

          {/* In-feed unit after the first two rows, where scroll depth is highest. */}
          {results.length > 12 && (
            <div className="my-6">
              <AdUnit slot="tools-grid" format="leaderboard" />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.slice(12).map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function ToolExplorer() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <Explorer />
    </Suspense>
  );
}
