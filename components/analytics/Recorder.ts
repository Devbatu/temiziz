/**
 * Hafif etkileşim kaydedicisi.
 *
 * NE KAYDEDİLİR
 *  · Fare yolu (250 ms örnekleme, yalnızca hareket varsa)
 *  · Tıklamalar — konum + tıklanan öğenin etiketi
 *  · Hover — bir öğe üzerinde 400 ms'den uzun bekleme
 *  · Kaydırma konumu
 *
 * NE KAYDEDİLMEZ (bilinçli sınır)
 *  · Girdi alanlarına yazılan hiçbir şey — `value` hiçbir dalda okunmaz
 *  · Sonuç panellerindeki çıktı (çözülmüş JWT, üretilen parola, biçimlendirilmiş
 *    JSON). Metin yalnızca HEDEF listesindeki arayüz öğelerinden alınır.
 *  · Dosya adları, pano içeriği, form değerleri
 *
 * Form alanlarında yalnızca ALANIN ADI kaydedilir ("E-posta", "Kalite"),
 * içine yazılan değer değil. Böylece ziyaretçinin hangi alanla uğraştığı
 * görülür ama ne yazdığı görülmez.
 *
 * Boyut sınırı: bir sayfa görüntülemesi için en faz MAX_EVENTS olay. Sınır
 * dolduğunda kayıt sessizce durur; analitik hiçbir zaman sayfayı yavaşlatmaz.
 */

const SAMPLE_MS = 250;
const HOVER_MIN_MS = 400;
const MAX_EVENTS = 400;

/** Kompakt biçim: [tür, ms, ...veri] — JSON boyutunu küçük tutmak için dizi. */
type Frame =
  | [0, number, number, number] // fare: t, x‰, y‰
  | [1, number, number, number, string] // tıklama: t, x‰, y‰, etiket
  | [2, number, string, number] // hover: t, etiket, süre
  | [3, number, number]; // kaydırma: t, y‰

export interface Replay {
  vw: number;
  vh: number;
  dh: number;
  frames: Frame[];
}

/** Etiket alınabilecek öğeler. Metin yalnızca bunlardan okunur. */
const HEDEF = 'button, a, input, select, textarea, label, summary, [role="button"]';

/**
 * Bir öğenin SABİT arayüz etiketini döndürür.
 *
 * Düğme ve bağlantılarda görünen metin kullanılır — bunlar sabit arayüz
 * yazılarıdır. Form alanlarında ise DEĞER ASLA OKUNMAZ; yalnızca alanı
 * tanımlayan etiket, yer tutucu, aria-label veya `name` özniteliği alınır.
 * Böylece "hangi alana tıkladı" görünür ama "ne yazdı" görünmez.
 */
function label(el: Element | null): string | null {
  const target = el?.closest(HEDEF);
  if (!target) return null;

  let text = target.getAttribute('aria-label') ?? '';

  if (text === '' && (target instanceof HTMLInputElement
    || target instanceof HTMLSelectElement
    || target instanceof HTMLTextAreaElement)) {
    // Sırayla: bağlı <label> metni, yer tutucu, name özniteliği.
    // `value` hiçbir dalda okunmaz.
    const id = target.getAttribute('id');
    const bagli = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    const saran = target.closest('label');
    text =
      bagli?.textContent
      ?? saran?.textContent
      ?? target.getAttribute('placeholder')
      ?? target.getAttribute('name')
      ?? '';

    const tur = target.getAttribute('type');
    if (tur === 'file') text = `${text || 'Dosya'} (dosya seçimi)`.trim();
  }

  if (text === '') text = target.textContent ?? '';

  const clean = text.replace(/\s+/g, ' ').trim();
  return clean === '' ? null : clean.slice(0, 40);
}

export function startRecording(): { stop: () => Replay | null } {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { stop: () => null };
  }

  const t0 = Date.now();
  const frames: Frame[] = [];
  const now = () => Date.now() - t0;
  const full = () => frames.length >= MAX_EVENTS;

  const permil = (v: number, total: number) =>
    total <= 0 ? 0 : Math.max(0, Math.min(1000, Math.round((v / total) * 1000)));

  let lastMouse = 0;
  let mx = -1;
  let my = -1;

  function onMove(e: MouseEvent) {
    if (full()) return;
    const t = now();
    if (t - lastMouse < SAMPLE_MS) return;
    const x = permil(e.clientX, window.innerWidth);
    const y = permil(e.clientY + window.scrollY, document.documentElement.scrollHeight);
    if (x === mx && y === my) return;
    lastMouse = t;
    mx = x;
    my = y;
    frames.push([0, t, x, y]);
  }

  function onClick(e: MouseEvent) {
    if (full()) return;
    frames.push([
      1,
      now(),
      permil(e.clientX, window.innerWidth),
      permil(e.clientY + window.scrollY, document.documentElement.scrollHeight),
      label(e.target as Element) ?? '',
    ]);
  }

  // Hover: düğme/bağlantıya girip yeterince bekleyince kaydedilir.
  let hoverEl: Element | null = null;
  let hoverAt = 0;

  function onOver(e: MouseEvent) {
    const el = (e.target as Element)?.closest(HEDEF);
    if (el === hoverEl) return;
    flushHover();
    hoverEl = el;
    hoverAt = Date.now();
  }

  function flushHover() {
    if (!hoverEl || full()) {
      hoverEl = null;
      return;
    }
    const sure = Date.now() - hoverAt;
    const ad = label(hoverEl);
    if (sure >= HOVER_MIN_MS && ad) {
      frames.push([2, hoverAt - t0, ad, Math.min(sure, 60000)]);
    }
    hoverEl = null;
  }

  let lastScroll = 0;
  let sy = -1;

  function onScroll() {
    if (full()) return;
    const t = now();
    if (t - lastScroll < SAMPLE_MS) return;
    const y = permil(window.scrollY, document.documentElement.scrollHeight - window.innerHeight);
    if (y === sy) return;
    lastScroll = t;
    sy = y;
    frames.push([3, t, y]);
  }

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('click', onClick, { passive: true, capture: true });
  window.addEventListener('mouseover', onOver, { passive: true, capture: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  return {
    stop() {
      flushHover();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick, { capture: true } as EventListenerOptions);
      window.removeEventListener('mouseover', onOver, { capture: true } as EventListenerOptions);
      window.removeEventListener('scroll', onScroll);

      // Anlamsız kayıtları göndermeyelim: en az bir etkileşim olsun.
      if (frames.length < 4) return null;

      return {
        vw: window.innerWidth,
        vh: window.innerHeight,
        dh: document.documentElement.scrollHeight,
        frames,
      };
    },
  };
}
