'use client';

import { ArrowUpRight } from 'lucide-react';
import type { Offer } from '@/lib/monetization';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/components/analytics/Tracker';

/**
 * Affiliate yerlesimi. Her zaman gorunur sekilde "Sponsorlu" etiketlenir ve
 * rel="sponsored nofollow" tasir — ikisi de Google'in baglanti politikasi ve
 * Ticari Reklam Yonetmeligi geregi zorunludur.
 *
 * Tiklamalar yonetim panelinde raporlanmak uzere sayilir (kisisel veri yok).
 */
export function OfferCard({ offer, compact = false }: { offer: Offer; compact?: boolean }) {
  return (
    <a
      href={offer.url}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      onClick={() => track('affiliate_click', { label: offer.id })}
      className="surface group relative flex items-start gap-4 overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-brand-400/50 hover:shadow-lg"
    >
      <span className="absolute right-4 top-3 text-[10px] uppercase tracking-widest text-muted">
        Sponsorlu
      </span>

      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
        <Icon name={offer.icon} className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold">{offer.title}</span>
          {offer.badge && (
            <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {offer.badge}
            </span>
          )}
        </span>
        {!compact && (
          <span className="mt-1.5 block text-[13px] leading-relaxed text-muted">
            {offer.description}
          </span>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500">
          {offer.cta}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </span>
    </a>
  );
}
