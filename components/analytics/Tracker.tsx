'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { startRecording, type Replay } from './Recorder';

/**
 * Kendi sunucumuzdaki PHP uçlarına davranış olayları gönderir.
 *
 * Toplananlar: hangi sayfa, ne kadar süre kalındı, içeriğin ne kadarı görüldü,
 * hangi araç çalıştırıldı, fare yolu ve hangi düğme/bağlantıya tıklanıp
 * üzerinde beklendiği (bkz. `Recorder.ts`).
 *
 * Gizlilik sınırı — bilinçli olarak toplanmayanlar:
 *  · Araçlara girilen metin, dosya içeriği veya tuş vuruşları
 *  · Girdi alanlarının değerleri; sonuç panellerindeki metin
 *  · Kalıcı çerez veya kimlik
 *
 * Ziyaretçi kimliği sunucu tarafında günlük değişen bir tuzla hashlenir.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_URL ?? '';
/** Etkileşim kaydı ayrı uca gider: gövdesi büyük, hız sınırı farklı. */
const REPLAY_ENDPOINT = ENDPOINT ? ENDPOINT.replace(/collect\.php$/, 'replay.php') : '';

/** Kaydı sunucuya gönderir. Başarısız olması kullanıcıyı etkilemez. */
function sendReplay(replay: Replay, path: string, durationMs: number) {
  if (!REPLAY_ENDPOINT) return;
  const body = JSON.stringify({ path, duration: durationMs, ...replay });
  // 60 KB üzeri gövdeyi göndermeyelim; sunucu da reddediyor.
  if (body.length > 60000) return;
  if (navigator.sendBeacon) {
    navigator.sendBeacon(REPLAY_ENDPOINT, new Blob([body], { type: 'application/json' }));
    return;
  }
  fetch(REPLAY_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

type EventType =
  | 'pageview'
  | 'page_leave'
  | 'tool_run'
  | 'tool_result'
  | 'tool_error'
  | 'affiliate_click'
  | 'outbound';

interface Payload {
  tool?: string;
  label?: string;
  duration?: number;
  scroll?: number;
}

export function track(type: EventType, data: Payload = {}) {
  if (!ENDPOINT || typeof window === 'undefined') return;

  const body = JSON.stringify({
    type,
    path: window.location.pathname,
    referrer: document.referrer,
    vw: window.innerWidth,
    ...data,
  });

  // sendBeacon sayfa kapanırken bile teslim eder ve render'ı bloklamaz.
  if (navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    return;
  }
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Analitik hatası kullanıcıyı hiçbir şekilde etkilememeli.
  });
}

export function Tracker() {
  const pathname = usePathname();
  const last = useRef('');
  const enteredAt = useRef(0);
  const maxScroll = useRef(0);
  const sent = useRef(false);
  const recorder = useRef<{ stop: () => Replay | null } | null>(null);

  useEffect(() => {
    if (!ENDPOINT || pathname === last.current) return;

    // Önceki sayfa için ayrılma olayını gönder (tek sayfa uygulaması gezinmesi).
    if (last.current !== '') flush();

    last.current = pathname;
    enteredAt.current = Date.now();
    maxScroll.current = 0;
    sent.current = false;
    track('pageview');
    recorder.current = startRecording();

    /** En derin kaydırma yüzdesi: içeriğin ne kadarı gerçekten görüldü. */
    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct =
        scrollable <= 0 ? 100 : Math.round(((window.scrollY || 0) / scrollable) * 100);
      if (pct > maxScroll.current) maxScroll.current = Math.min(pct, 100);
    }

    function flush() {
      if (sent.current) return;
      sent.current = true;
      const gecen = Date.now() - enteredAt.current;
      track('page_leave', { duration: gecen, scroll: maxScroll.current });

      const kayit = recorder.current?.stop() ?? null;
      recorder.current = null;
      if (kayit) sendReplay(kayit, window.location.pathname, gecen);
    }

    /**
     * `pagehide` mobilde `beforeunload`dan güvenilirdir; `visibilitychange`
     * sekme değiştirmeyi de yakalar. İkisi birlikte kullanılır, `sent` bayrağı
     * çift gönderimi engeller.
     */
    function onHide() {
      if (document.visibilityState === 'hidden') flush();
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [pathname]);

  return null;
}
