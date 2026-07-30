'use client';

import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';
import { CONSENT_KEY, type ConsentValue } from '@/lib/monetization';

/**
 * Google Consent Mode v2 varsayilanlari.
 *
 * `app/layout.tsx` icinde, AdSense betiginden ONCE <head> e basilir. Ziyaretci
 * karar verene kadar kisisellestirme `denied` baslar; secim yapildiginda
 * asagidaki `decide()` fonksiyonu `consent update` gonderir.
 */
export const consentDefaults = `(function(){
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
window.gtag=window.gtag||gtag;
var stored=null;try{stored=localStorage.getItem('${CONSENT_KEY}');}catch(e){}
var granted=stored==='all'?'granted':'denied';
gtag('consent','default',{ad_storage:granted,ad_user_data:granted,ad_personalization:granted,analytics_storage:granted,wait_for_update:500});
})();`;

/** Google'in sertifikali CMP'si sayfaya bu API'yi ekler. */
type TcfApi = (
  command: string,
  version: number,
  callback: (data: { gdprApplies?: boolean } | null, success: boolean) => void,
) => void;

/**
 * Cerez onay bandi. Betikler <head> de oldugu icin burada yalnizca arayuz var.
 *
 * AEA / Birlesik Krallik / Isvicre ziyaretcileri icin Google'in IAB TCF
 * sertifikali CMP'si devreye girer. O bolgelerde bu bant GOSTERILMEZ:
 * iki onay penceresi hem kafa karistirir hem de celisen onay sinyali uretir.
 * Geri kalan ziyaretciler (Turkiye dahil) icin KVKK geregi bu bant calisir.
 */
export function Monetization() {
  const [choice, setChoice] = useState<ConsentValue | null>(null);
  const [ready, setReady] = useState(false);
  const [cmpOwnsConsent, setCmpOwnsConsent] = useState(false);

  useEffect(() => {
    try {
      setChoice(localStorage.getItem(CONSENT_KEY) as ConsentValue | null);
    } catch {
      // Depolama engelli — karar verilmemis kabul edilir.
    }

    const w = window as unknown as { __tcfapi?: TcfApi };
    let cancelled = false;

    /**
     * CMP betigi async yuklendigi icin API hemen hazir olmayabilir; kisa bir
     * sure yoklariz. Bulunamazsa (Google CMP kapali ya da bolge disi) kendi
     * bandimizi gosteririz.
     */
    const started = Date.now();
    const poll = window.setInterval(() => {
      if (cancelled) return;

      if (typeof w.__tcfapi === 'function') {
        window.clearInterval(poll);
        w.__tcfapi('addEventListener', 2, (data, success) => {
          if (!cancelled && success && data?.gdprApplies) {
            setCmpOwnsConsent(true);
          }
          setReady(true);
        });
        return;
      }

      if (Date.now() - started > 1500) {
        window.clearInterval(poll);
        setReady(true);
      }
    }, 100);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, []);

  function decide(value: ConsentValue) {
    setChoice(value);
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* kritik degil */
    }
    const granted = value === 'all' ? 'granted' : 'denied';
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.('consent', 'update', {
      ad_storage: granted,
      ad_user_data: granted,
      ad_personalization: granted,
      analytics_storage: granted,
    });
  }

  // Google CMP bu ziyaretci icin yetkiliyse kendi bandimizi hic gostermeyiz.
  if (!ready || cmpOwnsConsent || choice !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez tercihi"
      className="glass animate-rise fixed inset-x-3 bottom-3 z-[80] rounded-2xl p-4 shadow-2xl sm:inset-x-auto sm:right-4 sm:max-w-md"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-500">
          <Cookie className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Çerez tercihiniz</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Araçların çalışması için gerekli çerezleri kullanıyoruz. İzin verirseniz reklamları
            ilgi alanlarınıza göre kişiselleştirmek için de çerez kullanılır.{' '}
            <Link href="/privacy" className="text-brand-500 underline">
              Ayrıntılar
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => decide('all')}
              className="rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Tümünü kabul et
            </button>
            <button
              onClick={() => decide('necessary')}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold"
            >
              Sadece gerekli
            </button>
          </div>
        </div>
        <button
          onClick={() => decide('necessary')}
          aria-label="Kapat"
          className="shrink-0 text-muted hover:text-[var(--fg)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
