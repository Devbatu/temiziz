'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, X } from 'lucide-react';
import { searchTools, popularTools } from '@/lib/tools';
import { categoryMap } from '@/lib/categories';
import { Icon } from '@/components/ui/Icon';

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => (q.trim() ? searchTools(q, 8) : popularTools.slice(0, 6)),
    [q],
  );

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  function go(slug: string) {
    onClose();
    router.push(`/tools/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(results.length, 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % Math.max(results.length, 1));
    }
    if (e.key === 'Enter' && results[active]) go(results[active].slug);
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Araç ara"
    >
      <div
        className="glass w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl animate-rise"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Araç ara — örn. pdf birleştir, json, qr kod…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          <button onClick={onClose} aria-label="Kapat" className="text-muted hover:text-[var(--fg)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {!q.trim() && (
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Popüler araçlar
            </p>
          )}
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted">
              “{q}” için sonuç bulunamadı. Farklı bir kelime deneyin.
            </p>
          )}
          {results.map((tool, i) => {
            const cat = categoryMap.get(tool.category)!;
            return (
              <button
                key={tool.slug}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(tool.slug)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === active ? 'bg-black/5 dark:bg-white/10' : ''
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${cat.gradient} text-white`}
                >
                  <Icon name={tool.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{tool.name}</span>
                  <span className="block truncate text-xs text-muted">{tool.description}</span>
                </span>
                {i === active && <CornerDownLeft className="h-4 w-4 shrink-0 text-muted" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
