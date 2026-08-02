'use client';

/**
 * Meslek araçları: muhasebe, ticaret, hukuk, eğitim ve inşaat tarafında
 * sık tekrarlanan hesaplar.
 *
 * Mevzuata bağlı katsayılar (kıdem tazminatı tavanı, faiz oranları, KDV
 * oranları) yıl içinde değişir. Bu yüzden hiçbiri koda gömülü sabit değil —
 * hepsi ekranda düzenlenebilir alan olarak durur ve varsayılanın hangi tarihe
 * ait olduğu yazar. Kullanıcı güncel değeri kendisi girebilir.
 */

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { CopyButton, Field, ResultPanel, Select, Stat, TextInput, ToolShell } from './shared';
import { useToolTracking } from './ToolContext';

/* ──────────────────────────── yardımcılar ──────────────────────────── */

const sayi = (s: string) => {
  // Türkçe girişte binlik ayıracı nokta, ondalık virgül olabilir: "1.250,50"
  const temiz = s.replace(/\./g, '').replace(',', '.');
  const n = Number(temiz);
  return s.trim() === '' || !Number.isFinite(n) ? NaN : n;
};

const TL = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const num = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 flex gap-2.5 rounded-xl border border-[var(--border)] bg-black/[0.02] px-3.5 py-3 text-xs leading-relaxed text-muted dark:bg-white/[0.03]">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
      <span>{children}</span>
    </p>
  );
}

/* ─────────────────────────── KDV hesaplama ─────────────────────────── */

export function KdvHesaplama() {
  const { trackRun } = useToolTracking();
  const [tutar, setTutar] = useState('');
  const [oran, setOran] = useState('20');
  const [yon, setYon] = useState<'haric' | 'dahil'>('haric');

  const t = sayi(tutar);
  const r = sayi(oran) / 100;
  const sonuc = useMemo(() => {
    if (!(t > 0) || !(r >= 0)) return null;
    // "hariç": girilen tutar matrah. "dahil": girilen tutar KDV'li toplam.
    const matrah = yon === 'haric' ? t : t / (1 + r);
    const kdv = matrah * r;
    return { matrah, kdv, toplam: matrah + kdv };
  }, [t, r, yon]);

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Field label="Tutar" hint="TL">
          <TextInput
            inputMode="decimal"
            placeholder="1.000"
            value={tutar}
            onChange={(e) => {
              setTutar(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="KDV oranı" hint="%">
          <Select value={oran} onChange={(e) => setOran(e.target.value)}>
            <option value="1">%1</option>
            <option value="10">%10</option>
            <option value="20">%20</option>
          </Select>
        </Field>
        <Field label="Girilen tutar">
          <Select value={yon} onChange={(e) => setYon(e.target.value as 'haric' | 'dahil')}>
            <option value="haric">KDV hariç</option>
            <option value="dahil">KDV dahil</option>
          </Select>
        </Field>
      </div>

      {sonuc && (
        <ResultPanel
          actions={
            <CopyButton
              value={`Matrah: ${TL.format(sonuc.matrah)} | KDV: ${TL.format(sonuc.kdv)} | Toplam: ${TL.format(sonuc.toplam)}`}
              label="Kopyala"
            />
          }
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Matrah (KDV hariç)" value={TL.format(sonuc.matrah)} />
            <Stat label="KDV tutarı" value={TL.format(sonuc.kdv)} />
            <Stat label="Genel toplam" value={TL.format(sonuc.toplam)} />
          </div>
        </ResultPanel>
      )}
      <Note>
        Türkiye’de geçerli KDV oranları %1, %10 ve %20’dir. Hangi malın hangi orana girdiği
        Cumhurbaşkanı kararıyla değişebilir; tereddüt halinde güncel KDV Genel Tebliği’ne bakın.
      </Note>
    </ToolShell>
  );
}

/* ───────────────────────── kâr marjı & iskonto ───────────────────────── */

export function KarMarji() {
  const { trackRun } = useToolTracking();
  const [maliyet, setMaliyet] = useState('');
  const [satis, setSatis] = useState('');
  const [hedef, setHedef] = useState('');

  const m = sayi(maliyet);
  const s = sayi(satis);
  const h = sayi(hedef);

  const mevcut = useMemo(() => {
    if (!(m > 0) || !(s > 0)) return null;
    const kar = s - m;
    return {
      kar,
      // Marj satış fiyatı üzerinden, kârlılık (markup) maliyet üzerinden hesaplanır.
      marj: (kar / s) * 100,
      markup: (kar / m) * 100,
    };
  }, [m, s]);

  // Hedef marja ulaşmak için gereken satış fiyatı: maliyet / (1 − marj)
  const hedefFiyat = m > 0 && h > 0 && h < 100 ? m / (1 - h / 100) : NaN;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Field label="Maliyet" hint="TL">
          <TextInput
            inputMode="decimal"
            placeholder="750"
            value={maliyet}
            onChange={(e) => {
              setMaliyet(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Satış fiyatı" hint="TL">
          <TextInput
            inputMode="decimal"
            placeholder="1.000"
            value={satis}
            onChange={(e) => {
              setSatis(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Hedef kâr marjı" hint="% — isteğe bağlı">
          <TextInput
            inputMode="decimal"
            placeholder="35"
            value={hedef}
            onChange={(e) => {
              setHedef(e.target.value);
              trackRun();
            }}
          />
        </Field>
      </div>

      {(mevcut || Number.isFinite(hedefFiyat)) && (
        <ResultPanel
          actions={
            mevcut ? (
              <CopyButton
                value={`Kâr: ${TL.format(mevcut.kar)} | Marj: %${num.format(mevcut.marj)} | Maliyet üzerine: %${num.format(mevcut.markup)}`}
                label="Kopyala"
              />
            ) : undefined
          }
        >
          {mevcut && (
            <div className="grid gap-2 sm:grid-cols-3">
              <Stat label="Kâr" value={TL.format(mevcut.kar)} />
              <Stat label="Kâr marjı (satış üzerinden)" value={`%${num.format(mevcut.marj)}`} />
              <Stat label="Kârlılık (maliyet üzerine)" value={`%${num.format(mevcut.markup)}`} />
            </div>
          )}
          {Number.isFinite(hedefFiyat) && (
            <div className="mt-2">
              <Stat
                label={`%${num.format(h)} marj için gereken satış fiyatı`}
                value={TL.format(hedefFiyat)}
              />
            </div>
          )}
        </ResultPanel>
      )}
      <Note>
        Marj ile kârlılık karıştırılan iki ayrı orandır: <strong>marj</strong> kârı satış fiyatına,{' '}
        <strong>kârlılık</strong> maliyete böler. Maliyetin üzerine %50 eklemek %33 marj demektir.
      </Note>
    </ToolShell>
  );
}

/* ──────────────────────── kredi taksit hesaplama ──────────────────────── */

export function KrediTaksit() {
  const { trackRun } = useToolTracking();
  const [anapara, setAnapara] = useState('');
  const [oran, setOran] = useState('');
  const [vade, setVade] = useState('');

  const p = sayi(anapara);
  const i = sayi(oran) / 100;
  const n = Math.round(sayi(vade));

  const sonuc = useMemo(() => {
    if (!(p > 0) || !(n > 0) || !(i >= 0)) return null;
    // Eşit taksitli (anüite) kredi: A = P·i·(1+i)^n / ((1+i)^n − 1)
    const taksit = i === 0 ? p / n : (p * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    const toplam = taksit * n;
    return { taksit, toplam, faiz: toplam - p };
  }, [p, i, n]);

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Field label="Kredi tutarı" hint="TL">
          <TextInput
            inputMode="decimal"
            placeholder="250.000"
            value={anapara}
            onChange={(e) => {
              setAnapara(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Aylık faiz oranı" hint="%">
          <TextInput
            inputMode="decimal"
            placeholder="3,29"
            value={oran}
            onChange={(e) => {
              setOran(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Vade" hint="ay">
          <TextInput
            inputMode="numeric"
            placeholder="36"
            value={vade}
            onChange={(e) => {
              setVade(e.target.value);
              trackRun();
            }}
          />
        </Field>
      </div>

      {sonuc && (
        <ResultPanel
          actions={
            <CopyButton
              value={`Aylık taksit: ${TL.format(sonuc.taksit)} | Toplam geri ödeme: ${TL.format(sonuc.toplam)} | Toplam faiz: ${TL.format(sonuc.faiz)}`}
              label="Kopyala"
            />
          }
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Aylık taksit" value={TL.format(sonuc.taksit)} />
            <Stat label="Toplam geri ödeme" value={TL.format(sonuc.toplam)} />
            <Stat label="Toplam faiz" value={TL.format(sonuc.faiz)} />
          </div>
        </ResultPanel>
      )}
      <Note>
        Bu hesap yalnızca anapara ve faizi kapsar. Bankaların uyguladığı <strong>BSMV</strong> ve{' '}
        <strong>KKDF</strong> (ihtiyaç kredilerinde toplam %20 civarı), dosya masrafı ve sigorta
        dahil değildir; gerçek ödemeniz burada çıkandan yüksek olur. Bağlayıcı tutar için bankanın
        vereceği ödeme planına bakın.
      </Note>
    </ToolShell>
  );
}

/* ───────────────── kıdem ve ihbar tazminatı ───────────────── */

export function KidemTazminati() {
  const { trackRun } = useToolTracking();
  const [ucret, setUcret] = useState('');
  const [yil, setYil] = useState('');
  const [ay, setAy] = useState('');
  const [gun, setGun] = useState('');
  const [tavan, setTavan] = useState('53919.68');

  const u = sayi(ucret);
  const toplamGun = (Math.max(sayi(yil) || 0, 0) * 365) +
    (Math.max(sayi(ay) || 0, 0) * 30) +
    Math.max(sayi(gun) || 0, 0);
  const tv = sayi(tavan);

  const sonuc = useMemo(() => {
    if (!(u > 0) || !(toplamGun > 0)) return null;
    // Kıdem: her tam yıl için 30 günlük giydirilmiş brüt ücret, artan süre oranlanır.
    // Ücret, yasal kıdem tazminatı tavanını aşamaz.
    const esas = Number.isFinite(tv) && tv > 0 ? Math.min(u, tv) : u;
    const kidemBrut = esas * (toplamGun / 365);
    // Kıdem tazminatından yalnızca damga vergisi kesilir (binde 7,59).
    const damga = kidemBrut * 0.00759;

    // İhbar süresi 4857 sayılı İş Kanunu md.17'ye göre kıdeme bağlıdır.
    const hafta =
      toplamGun < 180 ? 2 : toplamGun < 545 ? 4 : toplamGun < 1095 ? 6 : 8;
    // İhbar tazminatında tavan uygulanmaz, gerçek ücret esas alınır.
    const ihbarBrut = (u / 30) * 7 * hafta;

    return {
      kidemBrut,
      kidemNet: kidemBrut - damga,
      damga,
      hafta,
      ihbarBrut,
      tavanAsildi: Number.isFinite(tv) && tv > 0 && u > tv,
    };
  }, [u, toplamGun, tv]);

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Aylık giydirilmiş brüt ücret" hint="TL">
          <TextInput
            inputMode="decimal"
            placeholder="45.000"
            value={ucret}
            onChange={(e) => {
              setUcret(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Kıdem tazminatı tavanı" hint="TL — güncel değeri girin">
          <TextInput
            inputMode="decimal"
            value={tavan}
            onChange={(e) => setTavan(e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-3">
        <Field label="Çalışma süresi — yıl">
          <TextInput
            inputMode="numeric"
            placeholder="5"
            value={yil}
            onChange={(e) => {
              setYil(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Ay">
          <TextInput inputMode="numeric" placeholder="4" value={ay} onChange={(e) => setAy(e.target.value)} />
        </Field>
        <Field label="Gün">
          <TextInput inputMode="numeric" placeholder="12" value={gun} onChange={(e) => setGun(e.target.value)} />
        </Field>
      </div>

      {sonuc && (
        <ResultPanel
          actions={
            <CopyButton
              value={`Kıdem (brüt): ${TL.format(sonuc.kidemBrut)} | Damga vergisi: ${TL.format(sonuc.damga)} | Kıdem (net): ${TL.format(sonuc.kidemNet)} | İhbar (${sonuc.hafta} hafta, brüt): ${TL.format(sonuc.ihbarBrut)}`}
              label="Kopyala"
            />
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Kıdem tazminatı (brüt)" value={TL.format(sonuc.kidemBrut)} />
            <Stat label="Damga vergisi (‰7,59)" value={TL.format(sonuc.damga)} />
            <Stat label="Kıdem tazminatı (net)" value={TL.format(sonuc.kidemNet)} />
            <Stat
              label={`İhbar tazminatı — ${sonuc.hafta} hafta (brüt)`}
              value={TL.format(sonuc.ihbarBrut)}
            />
          </div>
          {sonuc.tavanAsildi && (
            <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-400">
              Ücretiniz kıdem tazminatı tavanının üzerinde. Kıdem hesabında tavan tutarı esas
              alındı; ihbar tazminatında tavan uygulanmaz, gerçek ücret kullanıldı.
            </p>
          )}
        </ResultPanel>
      )}
      <Note>
        Kıdem tazminatı tavanı <strong>her yıl ocak ve temmuz aylarında değişir</strong>; yukarıdaki
        varsayılan güncel olmayabilir, kendi döneminizin tutarını girin. İhbar süreleri 4857 sayılı
        İş Kanunu md.17’ye göredir. İhbar tazminatından gelir ve damga vergisi kesilir, bu hesapta
        brüt gösterilmiştir. Hak kazanma koşulları (istifa, haklı fesih vb.) ayrı bir hukuki
        değerlendirme gerektirir.
      </Note>
    </ToolShell>
  );
}

/* ───────────────────────── not ortalaması (AGNO) ───────────────────────── */

const HARF: Record<string, number> = {
  AA: 4, BA: 3.5, BB: 3, CB: 2.5, CC: 2, DC: 1.5, DD: 1, FD: 0.5, FF: 0,
};

interface Ders {
  ad: string;
  kredi: string;
  harf: string;
}

export function NotOrtalamasi() {
  const { trackRun } = useToolTracking();
  const [dersler, setDersler] = useState<Ders[]>([
    { ad: '', kredi: '', harf: 'AA' },
    { ad: '', kredi: '', harf: 'AA' },
    { ad: '', kredi: '', harf: 'AA' },
  ]);

  const guncelle = (i: number, alan: keyof Ders, deger: string) => {
    setDersler((d) => d.map((x, j) => (j === i ? { ...x, [alan]: deger } : x)));
    trackRun();
  };

  const sonuc = useMemo(() => {
    let krediToplam = 0;
    let puanToplam = 0;
    for (const d of dersler) {
      const k = sayi(d.kredi);
      if (!(k > 0)) continue;
      krediToplam += k;
      puanToplam += k * (HARF[d.harf] ?? 0);
    }
    if (krediToplam === 0) return null;
    return { ortalama: puanToplam / krediToplam, krediToplam, puanToplam };
  }, [dersler]);

  return (
    <ToolShell>
      <div className="grid gap-2.5">
        {dersler.map((d, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_110px_110px]">
            <TextInput
              placeholder={`Ders ${i + 1} (isteğe bağlı)`}
              value={d.ad}
              onChange={(e) => guncelle(i, 'ad', e.target.value)}
            />
            <TextInput
              inputMode="decimal"
              placeholder="Kredi"
              value={d.kredi}
              onChange={(e) => guncelle(i, 'kredi', e.target.value)}
            />
            <Select value={d.harf} onChange={(e) => guncelle(i, 'harf', e.target.value)}>
              {Object.keys(HARF).map((h) => (
                <option key={h} value={h}>
                  {h} ({num.format(HARF[h])})
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setDersler((d) => [...d, { ad: '', kredi: '', harf: 'AA' }])}
        className="mt-3 rounded-xl border border-[var(--border)] px-3.5 py-2 text-sm font-semibold transition-colors hover-surface"
      >
        + Ders ekle
      </button>

      {sonuc && (
        <ResultPanel
          actions={
            <CopyButton
              value={`Ortalama: ${sonuc.ortalama.toFixed(2).replace('.', ',')} | Toplam kredi: ${num.format(sonuc.krediToplam)}`}
              label="Kopyala"
            />
          }
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Ortalama (4’lük)" value={sonuc.ortalama.toFixed(2).replace('.', ',')} />
            <Stat label="Toplam kredi" value={num.format(sonuc.krediToplam)} />
            <Stat label="Toplam puan" value={num.format(sonuc.puanToplam)} />
          </div>
        </ResultPanel>
      )}
      <Note>
        Hesap, kredi ağırlıklı ortalama yöntemiyle yapılır: her dersin katsayısı kredisiyle
        çarpılır, toplam krediye bölünür. <strong>Harf notu katsayıları üniversiteden üniversiteye
        değişebilir</strong> — burada yaygın kullanılan YÖK ölçeği esas alınmıştır. Kendi
        yönetmeliğinizdeki katsayılar farklıysa sonuç da farklı çıkar.
      </Note>
    </ToolShell>
  );
}

/* ───────────────────────── inşaat: demir ağırlığı ───────────────────────── */

export function DemirAgirlik() {
  const { trackRun } = useToolTracking();
  const [cap, setCap] = useState('12');
  const [uzunluk, setUzunluk] = useState('');
  const [adet, setAdet] = useState('1');

  const d = sayi(cap);
  const l = sayi(uzunluk);
  const n = sayi(adet);

  const sonuc = useMemo(() => {
    if (!(d > 0) || !(l > 0) || !(n > 0)) return null;
    // Nervürlü inşaat çeliği: birim ağırlık (kg/m) = çap² / 162,28
    // (çelik yoğunluğu 7850 kg/m³ kabulüyle türetilir)
    const kgPerM = (d * d) / 162.28;
    return { kgPerM, toplamMetre: l * n, toplam: kgPerM * l * n };
  }, [d, l, n]);

  const caplar = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 26, 28, 32];

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Field label="Çap" hint="mm">
          <Select
            value={cap}
            onChange={(e) => {
              setCap(e.target.value);
              trackRun();
            }}
          >
            {caplar.map((c) => (
              <option key={c} value={c}>
                Ø{c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Boy" hint="metre">
          <TextInput
            inputMode="decimal"
            placeholder="12"
            value={uzunluk}
            onChange={(e) => {
              setUzunluk(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Adet">
          <TextInput
            inputMode="numeric"
            value={adet}
            onChange={(e) => {
              setAdet(e.target.value);
              trackRun();
            }}
          />
        </Field>
      </div>

      {sonuc && (
        <ResultPanel
          actions={
            <CopyButton
              value={`Ø${num.format(d)} — ${num.format(sonuc.kgPerM)} kg/m — toplam ${num.format(sonuc.toplam)} kg`}
              label="Kopyala"
            />
          }
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Birim ağırlık" value={`${num.format(sonuc.kgPerM)} kg/m`} />
            <Stat label="Toplam uzunluk" value={`${num.format(sonuc.toplamMetre)} m`} />
            <Stat label="Toplam ağırlık" value={`${num.format(sonuc.toplam)} kg`} />
          </div>
        </ResultPanel>
      )}
      <Note>
        Birim ağırlık <strong>çap² ÷ 162,28</strong> formülüyle bulunur; çeliğin 7850 kg/m³
        yoğunluğundan türetilmiştir. Nervürlü inşaat çeliği (B420C/B500C) için geçerlidir. Gerçek
        ağırlık, TS 708’in izin verdiği tolerans kadar (±%4,5 ile ±%6) sapabilir.
      </Note>
    </ToolShell>
  );
}

/* ───────────────────────── inşaat: beton harcı ───────────────────────── */

/** Yaklaşık dozajlar (kg çimento / m³ beton). */
const BETON: Record<string, { dozaj: number; su: number }> = {
  'C16/20': { dozaj: 275, su: 175 },
  'C20/25': { dozaj: 300, su: 175 },
  'C25/30': { dozaj: 350, su: 175 },
  'C30/37': { dozaj: 400, su: 180 },
};

export function BetonHesaplama() {
  const { trackRun } = useToolTracking();
  const [en, setEn] = useState('');
  const [boy, setBoy] = useState('');
  const [kalinlik, setKalinlik] = useState('');
  const [sinif, setSinif] = useState('C25/30');

  const hacim = useMemo(() => {
    const e = sayi(en);
    const b = sayi(boy);
    const k = sayi(kalinlik);
    return e > 0 && b > 0 && k > 0 ? e * b * (k / 100) : NaN;
  }, [en, boy, kalinlik]);

  const sonuc = useMemo(() => {
    if (!(hacim > 0)) return null;
    const { dozaj, su } = BETON[sinif];
    // Kalan hacim agregaya ayrılır; kaba/ince agrega yaklaşık 60/40 dağıtılır.
    const cimento = dozaj * hacim;
    return {
      cimento,
      torba: cimento / 50, // 50 kg'lık torba
      kum: 0.42 * hacim, // m³ ince agrega
      cakil: 0.63 * hacim, // m³ kaba agrega
      su: su * hacim, // litre
    };
  }, [hacim, sinif]);

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="En" hint="metre">
          <TextInput
            inputMode="decimal"
            placeholder="8"
            value={en}
            onChange={(e) => {
              setEn(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Boy" hint="metre">
          <TextInput
            inputMode="decimal"
            placeholder="12"
            value={boy}
            onChange={(e) => {
              setBoy(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Kalınlık" hint="cm">
          <TextInput
            inputMode="decimal"
            placeholder="15"
            value={kalinlik}
            onChange={(e) => {
              setKalinlik(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Beton sınıfı">
          <Select value={sinif} onChange={(e) => setSinif(e.target.value)}>
            {Object.keys(BETON).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {sonuc && (
        <ResultPanel
          actions={
            <CopyButton
              value={`${num.format(hacim)} m³ ${sinif} — çimento ${num.format(sonuc.cimento)} kg (${num.format(sonuc.torba)} torba), kum ${num.format(sonuc.kum)} m³, çakıl ${num.format(sonuc.cakil)} m³, su ${num.format(sonuc.su)} L`}
              label="Kopyala"
            />
          }
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Beton hacmi" value={`${num.format(hacim)} m³`} />
            <Stat label="Çimento" value={`${num.format(sonuc.cimento)} kg`} />
            <Stat label="Çimento (50 kg torba)" value={`${num.format(sonuc.torba)} torba`} />
            <Stat label="Kum (ince agrega)" value={`${num.format(sonuc.kum)} m³`} />
            <Stat label="Çakıl (kaba agrega)" value={`${num.format(sonuc.cakil)} m³`} />
            <Stat label="Su" value={`${num.format(sonuc.su)} litre`} />
          </div>
        </ResultPanel>
      )}
      <Note>
        Bu değerler <strong>yaklaşık keşif ve malzeme siparişi</strong> içindir. Gerçek karışım
        oranı agreganın granülometrisine, nemine ve katkı maddelerine göre değişir; taşıyıcı
        elemanlarda mutlaka hazır beton santralinin TS EN 206’ya uygun reçetesi kullanılmalıdır.
        Fire payı olarak %5–10 ekleyin.
      </Note>
    </ToolShell>
  );
}

/* ───────────────────────── gecikme faizi / vade farkı ───────────────────────── */

export function GecikmeFaizi() {
  const { trackRun } = useToolTracking();
  const [anapara, setAnapara] = useState('');
  const [oran, setOran] = useState('');
  const [gun, setGun] = useState('');
  const [tip, setTip] = useState<'basit' | 'bilesik'>('basit');

  const p = sayi(anapara);
  const r = sayi(oran) / 100;
  const g = sayi(gun);

  const sonuc = useMemo(() => {
    if (!(p > 0) || !(r >= 0) || !(g > 0)) return null;
    const faiz =
      tip === 'basit'
        ? p * r * (g / 365)
        : p * (Math.pow(1 + r, g / 365) - 1); // yıllık bileşik
    return { faiz, toplam: p + faiz, gunluk: faiz / g };
  }, [p, r, g, tip]);

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Anapara" hint="TL">
          <TextInput
            inputMode="decimal"
            placeholder="50.000"
            value={anapara}
            onChange={(e) => {
              setAnapara(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Yıllık faiz oranı" hint="%">
          <TextInput
            inputMode="decimal"
            placeholder="48"
            value={oran}
            onChange={(e) => {
              setOran(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Gecikme süresi" hint="gün">
          <TextInput
            inputMode="numeric"
            placeholder="90"
            value={gun}
            onChange={(e) => {
              setGun(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Faiz türü">
          <Select value={tip} onChange={(e) => setTip(e.target.value as 'basit' | 'bilesik')}>
            <option value="basit">Basit faiz</option>
            <option value="bilesik">Bileşik faiz</option>
          </Select>
        </Field>
      </div>

      {sonuc && (
        <ResultPanel
          actions={
            <CopyButton
              value={`Faiz: ${TL.format(sonuc.faiz)} | Toplam: ${TL.format(sonuc.toplam)} | Günlük: ${TL.format(sonuc.gunluk)}`}
              label="Kopyala"
            />
          }
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="İşleyen faiz" value={TL.format(sonuc.faiz)} />
            <Stat label="Günlük faiz" value={TL.format(sonuc.gunluk)} />
            <Stat label="Toplam borç" value={TL.format(sonuc.toplam)} />
          </div>
        </ResultPanel>
      )}
      <Note>
        Hangi oranın uygulanacağı alacağın türüne göre değişir: adi işlerde <strong>yasal faiz</strong>,
        ticari işlerde <strong>avans faizi</strong>, kamu alacaklarında <strong>gecikme zammı</strong>.
        Oranlar Merkez Bankası ve Hazine tarafından dönemsel olarak belirlenir; yukarıya güncel
        oranı kendiniz girmelisiniz. Yıl 365 gün kabul edilmiştir.
      </Note>
    </ToolShell>
  );
}
