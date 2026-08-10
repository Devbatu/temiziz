'use client';

/**
 * İkinci parti meslek araçları: ek klinik hesaplayıcılar ve mühendislik
 * araçları. Hepsi yayımlanmış, sabit formüllere dayanır ve tamamen tarayıcıda
 * çalışır — girilen hiçbir veri sunucuya gitmez.
 *
 * Bu araçlar ayrı dosyada çünkü health-tools.tsx zaten büyük; buradaki
 * yardımcılar (sayi, Verdict, Not) küçük olduğu için tekrar tanımlanıyor.
 */

import { useMemo, useState } from 'react';
import { Info, ShieldAlert } from 'lucide-react';
import { CopyButton, Field, ResultPanel, Select, Stat, TextInput, ToolShell } from './shared';
import { useToolTracking } from './ToolContext';

/* ─────────────────────────── ortak parçalar ─────────────────────────── */

/** Boş/geçersiz girdide NaN döner; çağıran sonucu gizler. */
const sayi = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return s.trim() === '' || !Number.isFinite(n) ? NaN : n;
};

const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
const vir = (n: number, basamak = 2) =>
  Number.isFinite(n) ? n.toFixed(basamak).replace('.', ',') : '—';

type Tone = 'ok' | 'warn' | 'risk';
const TONE: Record<Tone, string> = {
  ok: 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400',
  warn: 'border-amber-500/40 bg-amber-500/[0.08] text-amber-600 dark:text-amber-400',
  risk: 'border-rose-500/40 bg-rose-500/[0.08] text-rose-600 dark:text-rose-400',
};

function Verdict({
  score,
  unit,
  title,
  detail,
  tone,
}: {
  score: string;
  unit?: string;
  title: string;
  detail?: string;
  tone: Tone;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-4 ${TONE[tone]}`}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black tabular-nums">{score}</span>
        {unit && <span className="text-sm font-semibold opacity-80">{unit}</span>}
      </div>
      <div className="mt-1 text-sm font-bold">{title}</div>
      {detail && <p className="mt-1.5 text-xs leading-relaxed opacity-90">{detail}</p>}
    </div>
  );
}

/** Klinik araçların altındaki sorumluluk sınırı. */
function Klinik() {
  return (
    <p className="mt-4 flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3.5 py-3 text-xs leading-relaxed text-muted">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <span>
        Bu araç sağlık profesyonelleri için bir <strong>hesaplama yardımcısıdır</strong>. Tanı
        koymaz, tedavi önermez ve klinik değerlendirmenin yerine geçmez. Girdiğiniz veriler
        cihazınızdan çıkmaz.
      </span>
    </p>
  );
}

/** Mühendislik araçlarının altındaki bilgilendirme. */
function Not({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 flex gap-2.5 rounded-xl border border-[var(--border)] bg-black/[0.02] px-3.5 py-3 text-xs leading-relaxed text-muted dark:bg-white/[0.03]">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
      <span>{children}</span>
    </p>
  );
}

/** Tek satırlık sayısal alan. */
function Num({
  label,
  hint,
  value,
  set,
  ph,
  track,
}: {
  label: string;
  hint?: string;
  value: string;
  set: (v: string) => void;
  ph?: string;
  track?: () => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <TextInput
        inputMode="decimal"
        placeholder={ph}
        value={value}
        onChange={(e) => {
          set(e.target.value);
          track?.();
        }}
      />
    </Field>
  );
}

/* ═══════════════════════════ TIBBİ HESAPLAYICILAR ═══════════════════════════ */

/** Düzeltilmiş kalsiyum: albümin düşükse ölçülen kalsiyum yanıltıcıdır. */
export function DuzeltilmisKalsiyum() {
  const { trackRun } = useToolTracking();
  const [ca, setCa] = useState('');
  const [alb, setAlb] = useState('');

  const c = sayi(ca);
  const a = sayi(alb);
  const gecerli = c > 0 && a > 0;
  const duz = gecerli ? c + 0.8 * (4 - a) : NaN;

  const yorum = (v: number): { t: string; d: string; tone: Tone } => {
    if (v < 8.5) return { t: 'Düşük (hipokalsemi)', d: 'Düzeltilmiş kalsiyum 8,5 mg/dL altında.', tone: 'warn' };
    if (v > 10.5) return { t: 'Yüksek (hiperkalsemi)', d: 'Düzeltilmiş kalsiyum 10,5 mg/dL üzerinde.', tone: 'risk' };
    return { t: 'Normal aralıkta', d: 'Düzeltilmiş kalsiyum 8,5–10,5 mg/dL arasında.', tone: 'ok' };
  };
  const v = gecerli ? yorum(duz) : null;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Num label="Ölçülen kalsiyum" hint="mg/dL" value={ca} set={setCa} ph="8,2" track={trackRun} />
        <Num label="Serum albümin" hint="g/dL" value={alb} set={setAlb} ph="3,0" track={trackRun} />
      </div>
      {v && (
        <ResultPanel actions={<CopyButton value={`Düzeltilmiş kalsiyum: ${vir(duz)} mg/dL — ${v.t}`} label="Kopyala" />}>
          <Verdict score={vir(duz)} unit="mg/dL" title={v.t} detail={v.d} tone={v.tone} />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> Düzeltilmiş Ca = Ölçülen Ca + 0,8 × (4,0 − albümin). Albümin
            düştüğünde toplam kalsiyum düşük görünür ama iyonize kalsiyum normal olabilir; bu
            düzeltme onu telafi eder. Kesin değerlendirme için iyonize kalsiyum ölçümü tercih edilir.
          </p>
        </ResultPanel>
      )}
      <Klinik />
    </ToolShell>
  );
}

/** Anyon açığı: metabolik asidoz ayırıcı tanısında ilk adım. */
export function AnyonAcigi() {
  const { trackRun } = useToolTracking();
  const [na, setNa] = useState('');
  const [cl, setCl] = useState('');
  const [hco3, setHco3] = useState('');
  const [alb, setAlb] = useState('');

  const n = sayi(na);
  const c = sayi(cl);
  const h = sayi(hco3);
  const a = sayi(alb);
  const gecerli = n > 0 && c > 0 && h > 0;
  const ag = gecerli ? n - (c + h) : NaN;
  // Hipoalbüminemi anyon açığını maskeler; her 1 g/dL düşüş için ~2,5 eklenir.
  const agDuz = gecerli && a > 0 ? ag + 2.5 * (4 - a) : NaN;

  const yorum = (v: number): { t: string; d: string; tone: Tone } => {
    if (v > 12) return { t: 'Yüksek anyon açığı', d: '12 mEq/L üzeri. Yüksek anyon açıklı metabolik asidoz düşünülür (laktat, ketoasidoz, toksinler, üremi).', tone: 'risk' };
    if (v < 8) return { t: 'Düşük anyon açığı', d: '8 mEq/L altında. Hipoalbüminemi veya laboratuvar hatası düşünülmeli.', tone: 'warn' };
    return { t: 'Normal aralıkta', d: 'Anyon açığı 8–12 mEq/L arasında.', tone: 'ok' };
  };
  const v = gecerli ? yorum(Number.isFinite(agDuz) ? agDuz : ag) : null;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Num label="Sodyum (Na⁺)" hint="mEq/L" value={na} set={setNa} ph="140" track={trackRun} />
        <Num label="Klor (Cl⁻)" hint="mEq/L" value={cl} set={setCl} ph="104" track={trackRun} />
        <Num label="Bikarbonat (HCO₃⁻)" hint="mEq/L" value={hco3} set={setHco3} ph="24" track={trackRun} />
        <Num label="Albümin" hint="g/dL — isteğe bağlı" value={alb} set={setAlb} ph="4,0" track={trackRun} />
      </div>
      {v && (
        <ResultPanel actions={<CopyButton value={`Anyon açığı: ${vir(ag, 1)}${Number.isFinite(agDuz) ? ` (albümin düzeltmeli: ${vir(agDuz, 1)})` : ''} mEq/L — ${v.t}`} label="Kopyala" />}>
          <Verdict score={vir(Number.isFinite(agDuz) ? agDuz : ag, 1)} unit="mEq/L" title={v.t} detail={v.d} tone={v.tone} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Stat label="Anyon açığı" value={`${vir(ag, 1)} mEq/L`} />
            <Stat label="Albümin düzeltmeli" value={Number.isFinite(agDuz) ? `${vir(agDuz, 1)} mEq/L` : 'albümin girilmedi'} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> Anyon açığı = Na − (Cl + HCO₃). Potasyum genellikle dahil
            edilmez. Hipoalbüminemi açığı düşük gösterir; albümin girilirse her 1 g/dL düşüş için
            2,5 eklenir.
          </p>
        </ResultPanel>
      )}
      <Klinik />
    </ToolShell>
  );
}

/** Ortalama arter basıncı (MAP). */
export function Map() {
  const { trackRun } = useToolTracking();
  const [sis, setSis] = useState('');
  const [dia, setDia] = useState('');

  const s = sayi(sis);
  const d = sayi(dia);
  const gecerli = s > 0 && d > 0 && s > d;
  const map = gecerli ? (s + 2 * d) / 3 : NaN;

  const yorum = (v: number): { t: string; d: string; tone: Tone } => {
    if (v < 65) return { t: 'Düşük — perfüzyon riski', d: 'MAP 65 mmHg altında. Organ perfüzyonu için genel eşik 65 mmHg kabul edilir.', tone: 'risk' };
    if (v > 100) return { t: 'Yüksek', d: 'MAP 100 mmHg üzerinde.', tone: 'warn' };
    return { t: 'Normal aralıkta', d: 'MAP 70–100 mmHg arasında.', tone: 'ok' };
  };
  const v = gecerli ? yorum(map) : null;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Num label="Sistolik" hint="mmHg" value={sis} set={setSis} ph="120" track={trackRun} />
        <Num label="Diyastolik" hint="mmHg" value={dia} set={setDia} ph="80" track={trackRun} />
      </div>
      {v && (
        <ResultPanel actions={<CopyButton value={`MAP: ${vir(map, 0)} mmHg — ${v.t}`} label="Kopyala" />}>
          <Verdict score={vir(map, 0)} unit="mmHg" title={v.t} detail={v.d} tone={v.tone} />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> MAP = (Sistolik + 2 × Diyastolik) / 3. Diyastolik iki kez
            sayılır çünkü kalp döngüsünün üçte ikisi diyastoldedir.
          </p>
        </ResultPanel>
      )}
      <Klinik />
    </ToolShell>
  );
}

/** Vücut yüzey alanı — Mosteller formülü. */
export function Bsa() {
  const { trackRun } = useToolTracking();
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');

  const b = sayi(boy);
  const k = sayi(kilo);
  const gecerli = b > 0 && k > 0;
  const bsa = gecerli ? Math.sqrt((b * k) / 3600) : NaN;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Num label="Boy" hint="cm" value={boy} set={setBoy} ph="170" track={trackRun} />
        <Num label="Kilo" hint="kg" value={kilo} set={setKilo} ph="70" track={trackRun} />
      </div>
      {gecerli && (
        <ResultPanel actions={<CopyButton value={`Vücut yüzey alanı: ${vir(bsa)} m² (Mosteller)`} label="Kopyala" />}>
          <Verdict score={vir(bsa)} unit="m²" title="Vücut yüzey alanı" detail="Mosteller formülü" tone="ok" />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> BSA = √(boy[cm] × kilo[kg] / 3600). Kemoterapi doz hesabı ve
            kardiyak indeks gibi alanlarda kullanılır. Yetişkin ortalaması yaklaşık 1,7 m²’dir.
          </p>
        </ResultPanel>
      )}
      <Klinik />
    </ToolShell>
  );
}

/** İdeal vücut ağırlığı — Devine formülü. */
export function IdealKilo() {
  const { trackRun } = useToolTracking();
  const [boy, setBoy] = useState('');
  const [cins, setCins] = useState<'e' | 'k'>('e');

  const b = sayi(boy);
  const gecerli = b >= 130 && b <= 230;
  // Devine: 152,4 cm (60 inç) üzerindeki her 2,54 cm için 2,3 kg eklenir.
  const inchUstu = gecerli ? b / 2.54 - 60 : NaN;
  const ideal = gecerli ? (cins === 'e' ? 50 : 45.5) + 2.3 * inchUstu : NaN;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Num label="Boy" hint="cm" value={boy} set={setBoy} ph="175" track={trackRun} />
        <Field label="Cinsiyet">
          <Select value={cins} onChange={(e) => setCins(e.target.value as 'e' | 'k')}>
            <option value="e">Erkek</option>
            <option value="k">Kadın</option>
          </Select>
        </Field>
      </div>
      {gecerli && ideal > 0 && (
        <ResultPanel actions={<CopyButton value={`İdeal vücut ağırlığı: ${vir(ideal, 1)} kg (Devine)`} label="Kopyala" />}>
          <Verdict score={vir(ideal, 1)} unit="kg" title="İdeal vücut ağırlığı" detail="Devine formülü" tone="ok" />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> Erkek 50 + 2,3 × (inç − 60), kadın 45,5 + 2,3 × (inç − 60);
            boy 152,4 cm’in üzerindeki kısım inç cinsinden alınır. İlaç dozlaması ve mekanik
            ventilasyon tidal hacmi gibi hesaplarda kullanılır; bir sağlık hedefi değildir.
          </p>
        </ResultPanel>
      )}
      <Klinik />
    </ToolShell>
  );
}

/** IV infüzyon / damla hızı. */
export function IvDamla() {
  const { trackRun } = useToolTracking();
  const [hacim, setHacim] = useState('');
  const [sure, setSure] = useState('');
  const [faktor, setFaktor] = useState('20');

  const h = sayi(hacim);
  const dk = sayi(sure);
  const f = sayi(faktor);
  const gecerli = h > 0 && dk > 0 && f > 0;
  const gtt = gecerli ? (h * f) / dk : NaN;
  const mlSaat = gecerli ? h / (dk / 60) : NaN;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Num label="Toplam hacim" hint="mL" value={hacim} set={setHacim} ph="500" track={trackRun} />
        <Num label="Süre" hint="dakika" value={sure} set={setSure} ph="240" track={trackRun} />
        <Field label="Set damla faktörü" hint="gtt/mL">
          <Select value={faktor} onChange={(e) => setFaktor(e.target.value)}>
            <option value="20">20 (makro set)</option>
            <option value="15">15 (makro set)</option>
            <option value="10">10 (makro set)</option>
            <option value="60">60 (mikro set)</option>
          </Select>
        </Field>
      </div>
      {gecerli && (
        <ResultPanel actions={<CopyButton value={`${vir(gtt, 0)} damla/dk — ${vir(mlSaat, 0)} mL/saat`} label="Kopyala" />}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Damla hızı" value={`${vir(gtt, 0)} damla/dk`} />
            <Stat label="İnfüzyon pompası" value={`${vir(mlSaat, 0)} mL/saat`} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> Damla/dk = (hacim × damla faktörü) / süre[dk]. Damla faktörü
            infüzyon setinin ambalajında yazar; makro setler 10–20, mikro (pediatrik) setler 60
            gtt/mL’dir.
          </p>
        </ResultPanel>
      )}
      <Klinik />
    </ToolShell>
  );
}

/** Gebelik haftası ve tahmini doğum tarihi — Naegele kuralı. */
export function Gebelik() {
  const { trackRun } = useToolTracking();
  const [sat, setSat] = useState(''); // son adet tarihi

  const sonuc = useMemo(() => {
    if (!sat) return null;
    const lmp = new Date(sat + 'T00:00:00');
    if (Number.isNaN(lmp.getTime())) return null;
    const bugun = new Date();
    const gun = Math.floor((bugun.getTime() - lmp.getTime()) / 86400000);
    if (gun < 0 || gun > 320) return { gecersiz: true } as const;
    const edd = new Date(lmp.getTime() + 280 * 86400000);
    return {
      gecersiz: false as const,
      hafta: Math.floor(gun / 7),
      artikGun: gun % 7,
      edd,
      kalan: Math.ceil((edd.getTime() - bugun.getTime()) / 86400000),
    };
  }, [sat]);

  const trFmt = (d: Date) =>
    d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Son adet tarihi (SAT)">
          <TextInput
            type="date"
            value={sat}
            onChange={(e) => {
              setSat(e.target.value);
              trackRun();
            }}
          />
        </Field>
      </div>
      {sonuc && !sonuc.gecersiz && (
        <ResultPanel
          actions={<CopyButton value={`Gebelik: ${sonuc.hafta} hafta ${sonuc.artikGun} gün — Tahmini doğum: ${trFmt(sonuc.edd)}`} label="Kopyala" />}
        >
          <Verdict
            score={`${sonuc.hafta}h ${sonuc.artikGun}g`}
            title="Gebelik haftası"
            detail={`Tahmini doğum tarihi: ${trFmt(sonuc.edd)} · ${sonuc.kalan > 0 ? `${sonuc.kalan} gün kaldı` : 'tahmini tarih geçti'}`}
            tone="ok"
          />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Naegele kuralı:</strong> tahmini doğum = son adet tarihi + 280 gün (40 hafta).
            28 günlük düzenli döngü varsayar; döngü farklıysa ve ultrasonografi ölçümü varsa o esas
            alınmalıdır.
          </p>
        </ResultPanel>
      )}
      {sonuc && sonuc.gecersiz && (
        <ResultPanel><p className="text-sm text-muted">Tarih geçerli bir gebelik aralığında değil. Son adet tarihini kontrol edin.</p></ResultPanel>
      )}
      <Klinik />
    </ToolShell>
  );
}

/** Düzeltilmiş QT (QTc) — Bazett ve Fridericia. */
export function Qtc() {
  const { trackRun } = useToolTracking();
  const [qt, setQt] = useState('');
  const [hiz, setHiz] = useState('');
  const [cins, setCins] = useState<'e' | 'k'>('e');

  const q = sayi(qt);
  const hr = sayi(hiz);
  const gecerli = q > 0 && hr > 0;
  const rr = gecerli ? 60 / hr : NaN; // saniye
  const bazett = gecerli ? q / Math.sqrt(rr) : NaN;
  const frid = gecerli ? q / Math.cbrt(rr) : NaN;

  const esik = cins === 'e' ? 450 : 460;
  const yorum = (v: number): { t: string; d: string; tone: Tone } => {
    if (v >= 500) return { t: 'Belirgin uzun QT', d: '500 ms ve üzeri; torsades de pointes riski belirgin artar.', tone: 'risk' };
    if (v > esik) return { t: 'Uzun QT', d: `${esik} ms eşiğinin üzerinde.`, tone: 'warn' };
    return { t: 'Normal aralıkta', d: `${esik} ms eşiğinin altında.`, tone: 'ok' };
  };
  const v = gecerli ? yorum(bazett) : null;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Num label="QT aralığı" hint="ms" value={qt} set={setQt} ph="400" track={trackRun} />
        <Num label="Kalp hızı" hint="atım/dk" value={hiz} set={setHiz} ph="75" track={trackRun} />
        <Field label="Cinsiyet">
          <Select value={cins} onChange={(e) => setCins(e.target.value as 'e' | 'k')}>
            <option value="e">Erkek (eşik 450 ms)</option>
            <option value="k">Kadın (eşik 460 ms)</option>
          </Select>
        </Field>
      </div>
      {v && (
        <ResultPanel actions={<CopyButton value={`QTc (Bazett): ${vir(bazett, 0)} ms — ${v.t} | Fridericia: ${vir(frid, 0)} ms`} label="Kopyala" />}>
          <Verdict score={vir(bazett, 0)} unit="ms" title={`${v.t} (Bazett)`} detail={v.d} tone={v.tone} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Stat label="QTc — Bazett" value={`${vir(bazett, 0)} ms`} />
            <Stat label="QTc — Fridericia" value={`${vir(frid, 0)} ms`} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> Bazett QTc = QT / √RR, Fridericia QTc = QT / ∛RR (RR = 60 /
            kalp hızı, saniye). Bazett çok yüksek ve çok düşük hızlarda sapar; Fridericia bu
            uçlarda daha güvenilirdir.
          </p>
        </ResultPanel>
      )}
      <Klinik />
    </ToolShell>
  );
}

/* ═══════════════════════════ MÜHENDİSLİK ═══════════════════════════ */

/** Ohm yasası: V, I, R, P değerlerinden ikisi girilince kalanı bulur. */
export function OhmYasasi() {
  const { trackRun } = useToolTracking();
  const [v, setV] = useState('');
  const [i, setI] = useState('');
  const [r, setR] = useState('');
  const [p, setP] = useState('');

  const sonuc = useMemo(() => {
    const V = sayi(v), I = sayi(i), R = sayi(r), P = sayi(p);
    const dolu = [V, I, R, P].filter((x) => Number.isFinite(x) && x > 0).length;
    if (dolu < 2) return null;

    let vv = V, ii = I, rr = R, pp = P;
    // İki bilinenden diğer ikisini türet.
    if (Number.isFinite(V) && Number.isFinite(I)) { rr = V / I; pp = V * I; }
    else if (Number.isFinite(V) && Number.isFinite(R)) { ii = V / R; pp = (V * V) / R; }
    else if (Number.isFinite(V) && Number.isFinite(P)) { ii = P / V; rr = (V * V) / P; }
    else if (Number.isFinite(I) && Number.isFinite(R)) { vv = I * R; pp = I * I * R; }
    else if (Number.isFinite(I) && Number.isFinite(P)) { vv = P / I; rr = P / (I * I); }
    else if (Number.isFinite(R) && Number.isFinite(P)) { ii = Math.sqrt(P / R); vv = Math.sqrt(P * R); }
    return { V: vv, I: ii, R: rr, P: pp };
  }, [v, i, r, p]);

  return (
    <ToolShell>
      <p className="mb-3 text-sm text-muted">Bildiğiniz iki değeri girin; kalan ikisi hesaplanır.</p>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Num label="Gerilim (V)" hint="volt" value={v} set={setV} ph="12" track={trackRun} />
        <Num label="Akım (I)" hint="amper" value={i} set={setI} ph="0,5" track={trackRun} />
        <Num label="Direnç (R)" hint="ohm" value={r} set={setR} ph="24" track={trackRun} />
        <Num label="Güç (P)" hint="watt" value={p} set={setP} ph="6" track={trackRun} />
      </div>
      {sonuc && (
        <ResultPanel actions={<CopyButton value={`V=${vir(sonuc.V)} V | I=${vir(sonuc.I, 3)} A | R=${vir(sonuc.R)} Ω | P=${vir(sonuc.P)} W`} label="Kopyala" />}>
          <div className="grid gap-2 sm:grid-cols-4">
            <Stat label="Gerilim" value={`${vir(sonuc.V)} V`} />
            <Stat label="Akım" value={`${vir(sonuc.I, 3)} A`} />
            <Stat label="Direnç" value={`${vir(sonuc.R)} Ω`} />
            <Stat label="Güç" value={`${vir(sonuc.P)} W`} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Ohm yasası:</strong> V = I × R, P = V × I. Bu ilişkilerden ikisi bilindiğinde
            diğer tüm değerler türetilir. Yalnızca doğru akım (DC) veya dirençsel yükler için
            geçerlidir; endüktif/kapasitif yüklerde güç faktörü devreye girer.
          </p>
        </ResultPanel>
      )}
      <Not>
        Hesaplama dirençsel (omik) yük ve DC varsayar. Alternatif akımda motor, trafo gibi
        yüklerde görünür güç ve güç faktörü ayrıca hesaplanmalıdır.
      </Not>
    </ToolShell>
  );
}

/** Üç fazlı güç: hat gerilimi, akım ve güç faktöründen. */
export function UcFazGuc() {
  const { trackRun } = useToolTracking();
  const [v, setV] = useState('400');
  const [i, setI] = useState('');
  const [pf, setPf] = useState('0,85');

  const V = sayi(v), I = sayi(i), PF = sayi(pf);
  const gecerli = V > 0 && I > 0 && PF > 0 && PF <= 1;
  const kva = gecerli ? (Math.sqrt(3) * V * I) / 1000 : NaN;
  const kw = gecerli ? kva * PF : NaN;
  const kvar = gecerli ? kva * Math.sqrt(1 - PF * PF) : NaN;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Num label="Hat gerilimi" hint="V (fazlar arası)" value={v} set={setV} ph="400" track={trackRun} />
        <Num label="Hat akımı" hint="A" value={i} set={setI} ph="20" track={trackRun} />
        <Num label="Güç faktörü" hint="0–1" value={pf} set={setPf} ph="0,85" track={trackRun} />
      </div>
      {gecerli && (
        <ResultPanel actions={<CopyButton value={`Aktif: ${vir(kw)} kW | Görünür: ${vir(kva)} kVA | Reaktif: ${vir(kvar)} kVAR`} label="Kopyala" />}>
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Aktif güç" value={`${vir(kw)} kW`} />
            <Stat label="Görünür güç" value={`${vir(kva)} kVA`} />
            <Stat label="Reaktif güç" value={`${vir(kvar)} kVAR`} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> S = √3 × V × I (kVA), P = S × cosφ (kW). Gerilim fazlar arası
            (hat) değeridir; Türkiye’de üç fazlı şebeke 400 V’tur. Güç faktörü düşükse aynı iş için
            daha yüksek akım çekilir.
          </p>
        </ResultPanel>
      )}
      <Not>
        Kablo ve şalt seçiminde bu değerlere ek olarak eş zamanlılık, kalkış akımı ve gerilim
        düşümü de değerlendirilmelidir. Proje hesabı için yetkili bir elektrik mühendisine danışın.
      </Not>
    </ToolShell>
  );
}

/** Direnç renk kodu: 4 bant → değer. */
const RENK = [
  { ad: 'Siyah', hex: '#000', d: 0, carp: 1 },
  { ad: 'Kahverengi', hex: '#7a4a1e', d: 1, carp: 10 },
  { ad: 'Kırmızı', hex: '#d33', d: 2, carp: 100 },
  { ad: 'Turuncu', hex: '#e8820c', d: 3, carp: 1e3 },
  { ad: 'Sarı', hex: '#f2c200', d: 4, carp: 1e4 },
  { ad: 'Yeşil', hex: '#2a9d34', d: 5, carp: 1e5 },
  { ad: 'Mavi', hex: '#2b6cd4', d: 6, carp: 1e6 },
  { ad: 'Mor', hex: '#8b3fd4', d: 7, carp: 1e7 },
  { ad: 'Gri', hex: '#888', d: 8, carp: 1e8 },
  { ad: 'Beyaz', hex: '#eee', d: 9, carp: 1e9 },
];
const TOLERANS = [
  { ad: 'Kahverengi ±%1', hex: '#7a4a1e', t: 1 },
  { ad: 'Kırmızı ±%2', hex: '#d33', t: 2 },
  { ad: 'Altın ±%5', hex: '#c9a227', t: 5 },
  { ad: 'Gümüş ±%10', hex: '#b8b8b8', t: 10 },
];

function omFormat(ohm: number): string {
  if (ohm >= 1e6) return `${nf.format(ohm / 1e6)} MΩ`;
  if (ohm >= 1e3) return `${nf.format(ohm / 1e3)} kΩ`;
  return `${nf.format(ohm)} Ω`;
}

export function DirencRenkKodu() {
  const { trackRun } = useToolTracking();
  const [b1, setB1] = useState(1); // kahverengi
  const [b2, setB2] = useState(0); // siyah
  const [carp, setCarp] = useState(2); // kırmızı ×100
  const [tol, setTol] = useState(2); // altın ±%5

  const deger = (RENK[b1].d * 10 + RENK[b2].d) * RENK[carp].carp;

  const bantSec = (
    label: string,
    val: number,
    set: (n: number) => void,
    liste: { ad: string; hex: string }[],
  ) => (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 shrink-0 rounded border border-[var(--border)]" style={{ background: liste[val].hex }} />
        <Select
          value={val}
          onChange={(e) => {
            set(Number(e.target.value));
            trackRun();
          }}
        >
          {liste.map((r, idx) => (
            <option key={r.ad} value={idx}>
              {r.ad}
            </option>
          ))}
        </Select>
      </div>
    </Field>
  );

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        {bantSec('1. bant', b1, setB1, RENK)}
        {bantSec('2. bant', b2, setB2, RENK)}
        {bantSec('Çarpan', carp, setCarp, RENK)}
        {bantSec('Tolerans', tol, setTol, TOLERANS)}
      </div>
      <ResultPanel actions={<CopyButton value={`${omFormat(deger)} ±%${TOLERANS[tol].t}`} label="Kopyala" />}>
        <Verdict score={omFormat(deger)} title={`Tolerans ±%${TOLERANS[tol].t}`} detail={`${nf.format(deger)} ohm`} tone="ok" />
        <p className="mt-3 text-xs leading-relaxed text-muted">
          <strong>4 bantlı direnç:</strong> ilk iki bant rakam, üçüncü bant çarpan, dördüncü bant
          toleranstır. Örneğin kahverengi-siyah-kırmızı-altın = 10 × 100 = 1 kΩ ±%5.
        </p>
      </ResultPanel>
      <Not>
        Bu araç 4 bantlı standart dirençler içindir. 5 ve 6 bantlı hassas dirençlerde üç rakam
        bandı ve ayrı bir sıcaklık katsayısı bandı bulunur.
      </Not>
    </ToolShell>
  );
}

/** Kablo gerilim düşümü. */
export function KabloGerilimDusumu() {
  const { trackRun } = useToolTracking();
  const [uz, setUz] = useState('');
  const [akim, setAkim] = useState('');
  const [kesit, setKesit] = useState('2.5');
  const [malzeme, setMalzeme] = useState<'cu' | 'al'>('cu');
  const [faz, setFaz] = useState<'1' | '3'>('1');
  const [gerilim, setGerilim] = useState('230');

  // Özdirenç (Ω·mm²/m): bakır 0,0175, alüminyum 0,0282.
  const rho = malzeme === 'cu' ? 0.0175 : 0.0282;
  const L = sayi(uz), I = sayi(akim), A = sayi(kesit), V = sayi(gerilim);
  const gecerli = L > 0 && I > 0 && A > 0 && V > 0;

  // Tek faz: gidiş-dönüş 2L. Üç faz: √3 × L.
  const dusum = gecerli ? (faz === '1' ? 2 * L * I * rho / A : Math.sqrt(3) * L * I * rho / A) : NaN;
  const yuzde = gecerli ? (dusum / V) * 100 : NaN;

  const yorum = (p: number): Tone => (p > 5 ? 'risk' : p > 3 ? 'warn' : 'ok');

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Num label="Hat uzunluğu" hint="metre" value={uz} set={setUz} ph="40" track={trackRun} />
        <Num label="Akım" hint="A" value={akim} set={setAkim} ph="16" track={trackRun} />
        <Field label="Kesit" hint="mm²">
          <Select value={kesit} onChange={(e) => setKesit(e.target.value)}>
            {['1.5', '2.5', '4', '6', '10', '16', '25', '35', '50', '70', '95'].map((s) => (
              <option key={s} value={s}>{s.replace('.', ',')} mm²</option>
            ))}
          </Select>
        </Field>
        <Field label="İletken">
          <Select value={malzeme} onChange={(e) => setMalzeme(e.target.value as 'cu' | 'al')}>
            <option value="cu">Bakır</option>
            <option value="al">Alüminyum</option>
          </Select>
        </Field>
        <Field label="Sistem">
          <Select value={faz} onChange={(e) => setFaz(e.target.value as '1' | '3')}>
            <option value="1">Tek faz</option>
            <option value="3">Üç faz</option>
          </Select>
        </Field>
        <Num label="Gerilim" hint="V" value={gerilim} set={setGerilim} ph="230" track={trackRun} />
      </div>
      {gecerli && (
        <ResultPanel actions={<CopyButton value={`Gerilim düşümü: ${vir(dusum)} V (%${vir(yuzde)})`} label="Kopyala" />}>
          <Verdict
            score={`%${vir(yuzde)}`}
            title={`${vir(dusum)} V düşüm`}
            detail={yuzde > 5 ? 'Sınırın üzerinde: kesiti büyütün.' : yuzde > 3 ? 'Aydınlatma için sınırda; priz devrelerinde kabul edilebilir.' : 'Kabul edilebilir aralıkta.'}
            tone={yorum(yuzde)}
          />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> Tek fazda ΔV = 2 × L × I × ρ / A, üç fazda ΔV = √3 × L × I ×
            ρ / A. Özdirenç bakır için 0,0175, alüminyum için 0,0282 Ω·mm²/m. Yaygın kural:
            aydınlatmada %3, güç devrelerinde %5 üst sınır.
          </p>
        </ResultPanel>
      )}
      <Not>
        Bu hesap yaklaşık gerilim düşümü içindir; sıcaklık, döşeme biçimi ve güç faktörü sonucu
        etkiler. Proje hesabı TS HD 60364 ve yetkili mühendis onayı gerektirir.
      </Not>
    </ToolShell>
  );
}

/** dBm ↔ Watt dönüştürücü. */
export function DbmWatt() {
  const { trackRun } = useToolTracking();
  const [dbm, setDbm] = useState('');

  const d = sayi(dbm);
  const gecerli = Number.isFinite(d);
  const mw = gecerli ? Math.pow(10, d / 10) : NaN;
  const w = mw / 1000;

  const wFormat = (watt: number) => {
    if (watt >= 1) return `${nf.format(watt)} W`;
    if (watt >= 0.001) return `${nf.format(watt * 1000)} mW`;
    if (watt >= 1e-6) return `${nf.format(watt * 1e6)} µW`;
    return `${watt.toExponential(2)} W`;
  };

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Num label="Güç" hint="dBm" value={dbm} set={setDbm} ph="30" track={trackRun} />
      </div>
      {gecerli && (
        <ResultPanel actions={<CopyButton value={`${vir(d, 1)} dBm = ${wFormat(w)} (${nf.format(mw)} mW)`} label="Kopyala" />}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Miliwatt" value={`${nf.format(mw)} mW`} />
            <Stat label="Watt" value={wFormat(w)} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> P(mW) = 10^(dBm / 10). Referans noktaları: 0 dBm = 1 mW,
            30 dBm = 1 W, 20 dBm = 100 mW. RF ve telekomünikasyonda sinyal gücü için kullanılır.
          </p>
        </ResultPanel>
      )}
      <Not>
        dBm mutlak güçtür (referansı 1 mW); dB ise iki güç arasındaki orandır. İkisini
        karıştırmamak gerekir.
      </Not>
    </ToolShell>
  );
}
