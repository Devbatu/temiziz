'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { adSlots, adsense } from '@/lib/monetization';

type Format = 'leaderboard' | 'rectangle' | 'sidebar' | 'in-article';

/** Fixed heights keep the slot reserved so ads never cause layout shift (CLS). */
const SIZES: Record<Format, { minHeight: number; className: string }> = {
  leaderboard: { minHeight: 90, className: 'min-h-[90px] sm:min-h-[90px]' },
  rectangle: { minHeight: 250, className: 'min-h-[250px]' },
  sidebar: { minHeight: 600, className: 'min-h-[600px]' },
  'in-article': { minHeight: 200, className: 'min-h-[200px]' },
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One AdSense unit. Renders a labelled placeholder of the same height when
 * AdSense isn't configured yet, so layout and spacing are identical either way.
 */
export function AdUnit({
  slot,
  format = 'leaderboard',
  className = '',
  label = true,
}: {
  slot: keyof typeof adSlots;
  format?: Format;
  className?: string;
  label?: boolean;
}) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [visible, setVisible] = useState(false);
  const slotId = adSlots[slot];
  /*
   * Kayit oynaticinin iframe'i icinde reklam GOSTERILMEZ. Aksi halde site
   * sahibinin kendi izlemeleri gosterim uretir ve AdSense bunu gecersiz
   * trafik sayar. Bayrak: oynatici sayfayi ?mtreplay=1 ile aciyor.
   */
  const replayIcinde =
    typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('mtreplay') === '1';
  const live = adsense.enabled && Boolean(slotId) && !replayIcinde;
  const size = SIZES[format];

  // Only initialise the unit once it is near the viewport — keeps the initial
  // page render free of ad work.
  useEffect(() => {
    if (!live || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [live]);

  useEffect(() => {
    if (!visible || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // AdSense script blocked (ad blocker) — the reserved space just stays empty.
    }
  }, [visible]);

  return (
    <aside
      aria-label="Reklam alanı"
      className={`relative w-full overflow-hidden rounded-2xl ${className}`}
      style={{ minHeight: size.minHeight }}
    >
      {label && (
        <span className="pointer-events-none absolute left-3 top-2 z-10 text-[10px] uppercase tracking-widest text-muted">
          Reklam
        </span>
      )}

      {live ? (
        <ins
          ref={ref}
          className="adsbygoogle block w-full"
          style={{ display: 'block', minHeight: size.minHeight }}
          data-ad-client={adsense.client}
          data-ad-slot={slotId}
          data-ad-format={format === 'in-article' ? 'fluid' : 'auto'}
          data-ad-layout={format === 'in-article' ? 'in-article' : undefined}
          data-full-width-responsive="true"
        />
      ) : (
        <PlaceholderPromo format={format} />
      )}
    </aside>
  );
}

/**
 * Shown where an ad would go before AdSense is configured. Rather than an empty
 * grey box, it promotes Premium — so the space earns from day one.
 */
function PlaceholderPromo({ format }: { format: Format }) {
  const compact = format === 'leaderboard' || format === 'in-article';
  return (
    <div
      className={`flex h-full w-full items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border)] px-5 ${
        compact ? 'flex-row py-4' : 'flex-col py-8 text-center'
      }`}
      style={{ minHeight: SIZES[format].minHeight }}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
        <Sparkles className="h-5 w-5" />
      </span>
      <div className={compact ? 'min-w-0 flex-1' : ''}>
        <p className="text-sm font-bold">Reklamsız kullanmak ister misiniz?</p>
        <p className="mt-0.5 text-xs text-muted">
          Premium ile reklamlar kalkar, dosya limitleri yükselir.
        </p>
      </div>
      <Link
        href="/pricing"
        className="shrink-0 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white"
      >
        Premium’a bak
      </Link>
    </div>
  );
}
