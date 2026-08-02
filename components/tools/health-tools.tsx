'use client';

/**
 * Klinik hesaplayıcılar.
 *
 * Bu dosyadaki her skor, yayımlanmış ve sabit bir formüle dayanır; puan
 * ağırlıkları ve eşik değerleri tek yerde, `SCORES` içinde bildirimsel olarak
 * durur ki denetlenebilsinler. Hesaplama tamamen tarayıcıda yapılır — girilen
 * hiçbir hasta verisi sunucuya gitmez, saklanmaz.
 *
 * Bilinçli sınır: ilaç dozu, prospektüs ve etkileşim hesabı YOKTUR. Bunlar
 * lisanslı ve sürekli güncellenen veri tabanı gerektirir; eksik bir etkileşim
 * listesi hiç olmamasından daha tehlikelidir.
 */

import { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { CopyButton, Field, ResultPanel, Select, TextInput, ToolShell } from './shared';
import { useToolTracking } from './ToolContext';

/* ─────────────────────────── ortak parçalar ─────────────────────────── */

/** Her hesaplayıcının altında görünür. Klinik sorumluluk sınırını çizer. */
function Disclaimer() {
  return (
    <p className="mt-4 flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3.5 py-3 text-xs leading-relaxed text-muted">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <span>
        Bu araç sağlık profesyonelleri için bir <strong>hesaplama yardımcısıdır</strong>. Tanı
        koymaz, tedavi önermez ve klinik değerlendirmenin yerine geçmez. Kararlar hastanın
        bütünüyle değerlendirilmesine dayanmalıdır. Girdiğiniz veriler cihazınızdan çıkmaz.
      </span>
    </p>
  );
}

/** Sonucun ağırlığına göre renk: bilgilendirici, dikkat, yüksek risk. */
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

/* ──────────────────────── bildirimsel skor motoru ──────────────────────── */

/**
 * Seçim tabanlı skorlar (CHA₂DS₂-VASc, Wells, GKS, APGAR, Child-Pugh,
 * CURB-65, TIMI) aynı iskeleti paylaşır: her madde bir seçenek listesidir ve
 * toplam puan yorumlanır. Ağırlıkları tek yerde tutmak, bir eşiğin yanlışlıkla
 * iki farklı yerde farklı yazılmasını imkânsız kılar.
 */
interface ScoreItem {
  id: string;
  label: string;
  hint?: string;
  options: Array<{ label: string; value: number }>;
}

interface ScoreSpec {
  items: ScoreItem[];
  /** Toplam puanı yorumlar. */
  read: (total: number) => { title: string; detail: string; tone: Tone };
  /** Hesaplamanın dayandığı kaynak. */
  source: string;
}

const EVET_HAYIR = [
  { label: 'Hayır', value: 0 },
  { label: 'Evet', value: 1 },
];

const EVET_HAYIR_2 = [
  { label: 'Hayır', value: 0 },
  { label: 'Evet', value: 2 },
];

const SCORES: Record<string, ScoreSpec> = {
  /* ───────────────── CHA₂DS₂-VASc ───────────────── */
  chads: {
    source:
      'Lip GYH ve ark., Chest 2010; ESC 2024 Atriyal Fibrilasyon Kılavuzu. Yıllık inme riskleri Friberg ve ark., Eur Heart J 2012 kohortundan.',
    items: [
      {
        id: 'chf',
        label: 'Konjestif kalp yetmezliği / sol ventrikül disfonksiyonu',
        options: EVET_HAYIR,
      },
      { id: 'htn', label: 'Hipertansiyon', options: EVET_HAYIR },
      {
        id: 'age',
        label: 'Yaş',
        options: [
          { label: '65 yaş altı', value: 0 },
          { label: '65–74 yaş', value: 1 },
          { label: '75 yaş ve üzeri', value: 2 },
        ],
      },
      { id: 'dm', label: 'Diyabet', options: EVET_HAYIR },
      {
        id: 'stroke',
        label: 'İnme / GİA / tromboemboli öyküsü',
        hint: '2 puan',
        options: EVET_HAYIR_2,
      },
      {
        id: 'vasc',
        label: 'Vasküler hastalık',
        hint: 'MI, peiferik arter hastalığı veya aortik plak',
        options: EVET_HAYIR,
      },
      {
        id: 'sex',
        label: 'Cinsiyet',
        options: [
          { label: 'Erkek', value: 0 },
          { label: 'Kadın', value: 1 },
        ],
      },
    ],
    read: (t) => {
      // Friberg 2012: düzeltilmemiş yıllık iskemik inme oranları.
      const yillik = ['%0,2', '%0,6', '%2,2', '%3,2', '%4,8', '%7,2', '%9,7', '%11,2', '%10,8', '%12,2'];
      const oran = yillik[Math.min(t, 9)];
      if (t === 0) {
        return {
          title: 'Çok düşük risk',
          detail: `Tahmini yıllık inme riski ${oran}. Kılavuzlar bu grupta antikoagülasyon önermez.`,
          tone: 'ok',
        };
      }
      if (t === 1) {
        return {
          title: 'Düşük–orta risk',
          detail: `Tahmini yıllık inme riski ${oran}. Erkekte 1 puan sınır değerdir; kadında cinsiyet puanı tek başına antikoagülasyon gerekçesi sayılmaz.`,
          tone: 'warn',
        };
      }
      return {
        title: 'Yüksek risk',
        detail: `Tahmini yıllık inme riski ${oran}. ESC kılavuzu erkekte ≥2, kadında ≥3 puanda oral antikoagülasyon önerir; kanama riski (HAS-BLED) ayrıca değerlendirilmelidir.`,
        tone: 'risk',
      };
    },
  },

  /* ───────────────── Wells — Pulmoner Emboli ───────────────── */
  'wells-pe': {
    source: 'Wells PS ve ark., Thromb Haemost 2000. İki ve üç kademeli yorum birlikte verilir.',
    items: [
      {
        id: 'dvt',
        label: 'DVT klinik bulguları',
        hint: '3 puan',
        options: [
          { label: 'Hayır', value: 0 },
          { label: 'Evet', value: 3 },
        ],
      },
      {
        id: 'alt',
        label: 'PE, alternatif tanılardan daha olası',
        hint: '3 puan',
        options: [
          { label: 'Hayır', value: 0 },
          { label: 'Evet', value: 3 },
        ],
      },
      {
        id: 'hr',
        label: 'Kalp hızı > 100/dk',
        hint: '1,5 puan',
        options: [
          { label: 'Hayır', value: 0 },
          { label: 'Evet', value: 1.5 },
        ],
      },
      {
        id: 'immob',
        label: 'Son 4 haftada immobilizasyon veya cerrahi',
        hint: '1,5 puan',
        options: [
          { label: 'Hayır', value: 0 },
          { label: 'Evet', value: 1.5 },
        ],
      },
      {
        id: 'prev',
        label: 'Önceki DVT veya PE',
        hint: '1,5 puan',
        options: [
          { label: 'Hayır', value: 0 },
          { label: 'Evet', value: 1.5 },
        ],
      },
      { id: 'hemo', label: 'Hemoptizi', options: EVET_HAYIR },
      { id: 'ca', label: 'Aktif malignite', options: EVET_HAYIR },
    ],
    read: (t) => {
      const ikili = t > 4 ? 'PE olası' : 'PE olası değil';
      if (t < 2) {
        return {
          title: `Düşük olasılık — ${ikili}`,
          detail:
            'Üç kademeli yorumda düşük olasılık (<2). D-dimer negatifse PE büyük ölçüde dışlanabilir.',
          tone: 'ok',
        };
      }
      if (t <= 6) {
        return {
          title: `Orta olasılık — ${ikili}`,
          detail:
            'Üç kademeli yorumda orta olasılık (2–6). Yüksek duyarlıklı D-dimer ile ilerlemek yaygın yaklaşımdır.',
          tone: 'warn',
        };
      }
      return {
        title: `Yüksek olasılık — ${ikili}`,
        detail:
          'Üç kademeli yorumda yüksek olasılık (>6). D-dimer ile dışlama önerilmez; doğrudan görüntüleme (BT pulmoner anjiyografi) düşünülür.',
        tone: 'risk',
      };
    },
  },

  /* ───────────────── Wells — Derin Ven Trombozu ───────────────── */
  'wells-dvt': {
    source: 'Wells PS ve ark., Lancet 1997 / N Engl J Med 2003 (revize model).',
    items: [
      { id: 'ca', label: 'Aktif kanser', hint: 'tedavi görüyor veya son 6 ay', options: EVET_HAYIR },
      { id: 'paralysis', label: 'Alt ekstremitede parezi, paralizi veya alçı', options: EVET_HAYIR },
      {
        id: 'bed',
        label: '3 günden uzun yatak istirahati veya son 12 haftada majör cerrahi',
        options: EVET_HAYIR,
      },
      { id: 'tender', label: 'Derin ven trasesi boyunca lokalize hassasiyet', options: EVET_HAYIR },
      { id: 'swollen', label: 'Tüm bacakta şişlik', options: EVET_HAYIR },
      {
        id: 'calf',
        label: 'Baldır çevresi karşı tarafa göre > 3 cm fazla',
        options: EVET_HAYIR,
      },
      { id: 'edema', label: 'Semptomatik bacakta gode bırakan ödem', options: EVET_HAYIR },
      { id: 'collateral', label: 'Yüzeyel kollateral venler (varis dışı)', options: EVET_HAYIR },
      { id: 'prev', label: 'Daha önce belgelenmiş DVT', options: EVET_HAYIR },
      {
        id: 'alt',
        label: 'Alternatif tanı en az DVT kadar olası',
        hint: '−2 puan',
        options: [
          { label: 'Hayır', value: 0 },
          { label: 'Evet', value: -2 },
        ],
      },
    ],
    read: (t) => {
      if (t >= 3) {
        return {
          title: 'Yüksek olasılık',
          detail:
            'DVT olasılığı yüksek (≥3). Doğrudan kompresyon ultrasonografi önerilir; D-dimer ile dışlama güvenli değildir.',
          tone: 'risk',
        };
      }
      if (t >= 1) {
        return {
          title: 'Orta olasılık',
          detail: 'Orta olasılık (1–2). D-dimer ve/veya ultrasonografi ile ilerlenir.',
          tone: 'warn',
        };
      }
      return {
        title: 'Düşük olasılık',
        detail:
          'Düşük olasılık (≤0). Yüksek duyarlıklı D-dimer negatifse DVT büyük ölçüde dışlanır.',
        tone: 'ok',
      };
    },
  },

  /* ───────────────── APGAR ───────────────── */
  apgar: {
    source: 'Apgar V., Curr Res Anesth Analg 1953. Skor 1. ve 5. dakikada ayrı ayrı hesaplanır.',
    items: [
      {
        id: 'appearance',
        label: 'Görünüm (cilt rengi)',
        options: [
          { label: 'Tümüyle soluk veya siyanotik', value: 0 },
          { label: 'Gövde pembe, ekstremiteler siyanotik', value: 1 },
          { label: 'Tümüyle pembe', value: 2 },
        ],
      },
      {
        id: 'pulse',
        label: 'Nabız',
        options: [
          { label: 'Yok', value: 0 },
          { label: '100/dk altında', value: 1 },
          { label: '100/dk ve üzeri', value: 2 },
        ],
      },
      {
        id: 'grimace',
        label: 'Refleks irritabilite (uyarana yanıt)',
        options: [
          { label: 'Yanıt yok', value: 0 },
          { label: 'Yüz buruşturma', value: 1 },
          { label: 'Ağlama, öksürme veya aksırma', value: 2 },
        ],
      },
      {
        id: 'activity',
        label: 'Aktivite (kas tonusu)',
        options: [
          { label: 'Gevşek', value: 0 },
          { label: 'Ekstremitelerde hafif fleksiyon', value: 1 },
          { label: 'Aktif hareket', value: 2 },
        ],
      },
      {
        id: 'respiration',
        label: 'Solunum',
        options: [
          { label: 'Yok', value: 0 },
          { label: 'Yavaş, düzensiz, zayıf ağlama', value: 1 },
          { label: 'Güçlü ağlama', value: 2 },
        ],
      },
    ],
    read: (t) => {
      if (t >= 7) {
        return {
          title: 'Normal',
          detail: '7–10 arası normal kabul edilir. Rutin bakım sürdürülür.',
          tone: 'ok',
        };
      }
      if (t >= 4) {
        return {
          title: 'Orta derecede düşük',
          detail:
            '4–6 arası solunum desteği gerektirebilir. 5. dakika skoru düşük kalırsa 10. dakikada tekrar değerlendirilir.',
          tone: 'warn',
        };
      }
      return {
        title: 'Ciddi düzeyde düşük',
        detail: '0–3 arası acil resüsitasyon gerektirir.',
        tone: 'risk',
      };
    },
  },

  /* ───────────────── Child-Pugh ───────────────── */
  'child-pugh': {
    source: 'Pugh RNH ve ark., Br J Surg 1973. Kronik karaciğer hastalığında prognoz sınıflaması.',
    items: [
      {
        id: 'bil',
        label: 'Total bilirubin',
        options: [
          { label: '2 mg/dL altında', value: 1 },
          { label: '2–3 mg/dL', value: 2 },
          { label: '3 mg/dL üzerinde', value: 3 },
        ],
      },
      {
        id: 'alb',
        label: 'Serum albümin',
        options: [
          { label: '3,5 g/dL üzerinde', value: 1 },
          { label: '2,8–3,5 g/dL', value: 2 },
          { label: '2,8 g/dL altında', value: 3 },
        ],
      },
      {
        id: 'inr',
        label: 'INR',
        options: [
          { label: '1,7 altında', value: 1 },
          { label: '1,7–2,3', value: 2 },
          { label: '2,3 üzerinde', value: 3 },
        ],
      },
      {
        id: 'asit',
        label: 'Asit',
        options: [
          { label: 'Yok', value: 1 },
          { label: 'Hafif / diüretikle kontrol altında', value: 2 },
          { label: 'Orta–şiddetli / dirençli', value: 3 },
        ],
      },
      {
        id: 'ense',
        label: 'Hepatik ensefalopati',
        options: [
          { label: 'Yok', value: 1 },
          { label: 'Evre 1–2', value: 2 },
          { label: 'Evre 3–4', value: 3 },
        ],
      },
    ],
    read: (t) => {
      if (t <= 6) {
        return {
          title: 'Sınıf A (5–6 puan)',
          detail: 'İyi kompanse hastalık. Bildirilen 1 yıllık sağkalım yaklaşık %100, 2 yıllık %85.',
          tone: 'ok',
        };
      }
      if (t <= 9) {
        return {
          title: 'Sınıf B (7–9 puan)',
          detail:
            'Fonksiyonel bozulma anlamlı. 1 yıllık sağkalım yaklaşık %81, 2 yıllık %57. Transplantasyon değerlendirmesi gündeme gelir.',
          tone: 'warn',
        };
      }
      return {
        title: 'Sınıf C (10–15 puan)',
        detail:
          'Dekompanse hastalık. 1 yıllık sağkalım yaklaşık %45, 2 yıllık %35. Elektif cerrahi riski çok yüksektir.',
        tone: 'risk',
      };
    },
  },

  /* ───────────────── Glasgow Koma Skalası ───────────────── */
  gks: {
    source: 'Teasdale G, Jennett B., Lancet 1974.',
    items: [
      {
        id: 'eye',
        label: 'Göz açma yanıtı',
        options: [
          { label: 'Yok', value: 1 },
          { label: 'Ağrılı uyaranla', value: 2 },
          { label: 'Sesli uyaranla', value: 3 },
          { label: 'Spontan', value: 4 },
        ],
      },
      {
        id: 'verbal',
        label: 'Sözel yanıt',
        options: [
          { label: 'Yok', value: 1 },
          { label: 'Anlaşılmaz sesler', value: 2 },
          { label: 'Uygunsuz kelimeler', value: 3 },
          { label: 'Konfüze konuşma', value: 4 },
          { label: 'Oryante', value: 5 },
        ],
      },
      {
        id: 'motor',
        label: 'Motor yanıt',
        options: [
          { label: 'Yok', value: 1 },
          { label: 'Ağrıya ekstansör yanıt (deserebre)', value: 2 },
          { label: 'Ağrıya fleksör yanıt (dekortike)', value: 3 },
          { label: 'Ağrıdan çekme', value: 4 },
          { label: 'Ağrıyı lokalize etme', value: 5 },
          { label: 'Emirlere uyma', value: 6 },
        ],
      },
    ],
    read: (t) => {
      if (t >= 13) {
        return {
          title: 'Hafif bilinç değişikliği (13–15)',
          detail: 'Hafif kafa travması aralığı. Gözlem ve seri değerlendirme önerilir.',
          tone: 'ok',
        };
      }
      if (t >= 9) {
        return {
          title: 'Orta düzeyde bilinç bozukluğu (9–12)',
          detail: 'Yakın izlem ve görüntüleme gerekir.',
          tone: 'warn',
        };
      }
      return {
        title: 'Ağır bilinç bozukluğu (3–8)',
        detail:
          '8 ve altı koma kabul edilir; hava yolu güvenliği için entübasyon endikasyonu değerlendirilir.',
        tone: 'risk',
      };
    },
  },

  /* ───────────────── CURB-65 ───────────────── */
  'curb-65': {
    source:
      'Lim WS ve ark., Thorax 2003. Toplum kökenli pnömonide 30 günlük mortalite tahmini.',
    items: [
      { id: 'c', label: 'Konfüzyon (yeni başlangıçlı)', options: EVET_HAYIR },
      {
        id: 'u',
        label: 'Üre > 7 mmol/L (BUN > 19 mg/dL)',
        options: EVET_HAYIR,
      },
      { id: 'r', label: 'Solunum sayısı ≥ 30/dk', options: EVET_HAYIR },
      {
        id: 'b',
        label: 'Kan basıncı: sistolik < 90 mmHg veya diyastolik ≤ 60 mmHg',
        options: EVET_HAYIR,
      },
      { id: 'age', label: 'Yaş ≥ 65', options: EVET_HAYIR },
    ],
    read: (t) => {
      const mortalite = ['%0,6', '%2,7', '%6,8', '%14,0', '%27,8', '%27,8'][Math.min(t, 5)];
      if (t <= 1) {
        return {
          title: 'Düşük risk',
          detail: `30 günlük mortalite yaklaşık ${mortalite}. Ayaktan tedavi genellikle uygundur.`,
          tone: 'ok',
        };
      }
      if (t === 2) {
        return {
          title: 'Orta risk',
          detail: `30 günlük mortalite yaklaşık ${mortalite}. Kısa süreli yatış veya yakın gözlem düşünülür.`,
          tone: 'warn',
        };
      }
      return {
        title: 'Yüksek risk',
        detail: `30 günlük mortalite yaklaşık ${mortalite}. Hastaneye yatış; 4–5 puanda yoğun bakım değerlendirmesi gerekir.`,
        tone: 'risk',
      };
    },
  },

  /* ───────────────── TIMI (UA/NSTEMI) ───────────────── */
  timi: {
    source:
      'Antman EM ve ark., JAMA 2000. Kararsız angina / NSTEMI için 14 günlük olay riski.',
    items: [
      { id: 'age', label: 'Yaş ≥ 65', options: EVET_HAYIR },
      {
        id: 'risk',
        label: 'En az 3 koroner arter hastalığı risk faktörü',
        hint: 'aile öyküsü, HT, DM, hiperlipidemi, sigara',
        options: EVET_HAYIR,
      },
      { id: 'cad', label: 'Bilinen koroner stenoz ≥ %50', options: EVET_HAYIR },
      { id: 'asa', label: 'Son 7 günde aspirin kullanımı', options: EVET_HAYIR },
      { id: 'angina', label: 'Son 24 saatte ≥ 2 ciddi angina atağı', options: EVET_HAYIR },
      { id: 'st', label: 'EKG’de ST değişikliği ≥ 0,5 mm', options: EVET_HAYIR },
      { id: 'marker', label: 'Kardiyak belirteç yüksekliği', options: EVET_HAYIR },
    ],
    read: (t) => {
      const risk = ['%4,7', '%4,7', '%8,3', '%13,2', '%19,9', '%26,2', '%40,9', '%40,9'][
        Math.min(t, 7)
      ];
      if (t <= 2) {
        return {
          title: 'Düşük risk',
          detail: `14 günlük ölüm, MI veya acil revaskülarizasyon riski yaklaşık ${risk}.`,
          tone: 'ok',
        };
      }
      if (t <= 4) {
        return {
          title: 'Orta risk',
          detail: `14 günlük olay riski yaklaşık ${risk}. Erken invaziv strateji değerlendirilir.`,
          tone: 'warn',
        };
      }
      return {
        title: 'Yüksek risk',
        detail: `14 günlük olay riski yaklaşık ${risk}. Erken invaziv strateji önerilir.`,
        tone: 'risk',
      };
    },
  },
};

/** Seçim tabanlı skorlar için ortak arayüz. */
function ScoreTool({ id }: { id: keyof typeof SCORES }) {
  const spec = SCORES[id];
  const { trackRun } = useToolTracking();
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(spec.items.map((i) => [i.id, i.options[0].value])),
  );

  const total = useMemo(
    () => spec.items.reduce((sum, i) => sum + (values[i.id] ?? 0), 0),
    [spec.items, values],
  );
  const verdict = spec.read(total);
  // Ondalıklı ağırlıklar yalnızca Wells'te var; tam sayıysa virgül gösterme.
  const gosterim = Number.isInteger(total) ? String(total) : total.toFixed(1).replace('.', ',');

  const ozet = `${gosterim} puan — ${verdict.title}\n${verdict.detail}`;

  return (
    <ToolShell>
      <div className="grid gap-3.5">
        {spec.items.map((item) => (
          <Field key={item.id} label={item.label} hint={item.hint}>
            <Select
              value={String(values[item.id])}
              onChange={(e) => {
                setValues((v) => ({ ...v, [item.id]: Number(e.target.value) }));
                trackRun();
              }}
            >
              {item.options.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        ))}
      </div>

      <ResultPanel actions={<CopyButton value={ozet} label="Sonucu kopyala" />}>
        <Verdict
          score={gosterim}
          unit="puan"
          title={verdict.title}
          detail={verdict.detail}
          tone={verdict.tone}
        />
        <p className="mt-3 text-xs leading-relaxed text-muted">
          <strong>Kaynak:</strong> {spec.source}
        </p>
      </ResultPanel>
      <Disclaimer />
    </ToolShell>
  );
}

export const ChadsVasc = () => <ScoreTool id="chads" />;
export const WellsPe = () => <ScoreTool id="wells-pe" />;
export const WellsDvt = () => <ScoreTool id="wells-dvt" />;
export const Apgar = () => <ScoreTool id="apgar" />;
export const ChildPugh = () => <ScoreTool id="child-pugh" />;
export const Gks = () => <ScoreTool id="gks" />;
export const Curb65 = () => <ScoreTool id="curb-65" />;
export const Timi = () => <ScoreTool id="timi" />;

/* ─────────────────────── sayısal hesaplayıcılar ─────────────────────── */

/** Boş veya geçersiz girdide NaN döner; çağıran taraf sonucu gizler. */
const sayi = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return s.trim() === '' || !Number.isFinite(n) ? NaN : n;
};

export function Bmi() {
  const { trackRun } = useToolTracking();
  const [kilo, setKilo] = useState('');
  const [boy, setBoy] = useState('');

  const k = sayi(kilo);
  const b = sayi(boy) / 100;
  const gecerli = k > 0 && b > 0.5 && b < 2.7;
  const bmi = gecerli ? k / (b * b) : NaN;

  // Dünya Sağlık Örgütü yetişkin sınıflaması.
  const yorum = (v: number): { title: string; detail: string; tone: Tone } => {
    if (v < 18.5) {
      return {
        title: 'Zayıf',
        detail: 'BKİ 18,5 altında. Beslenme değerlendirmesi düşünülebilir.',
        tone: 'warn',
      };
    }
    if (v < 25) {
      return { title: 'Normal kilolu', detail: 'BKİ 18,5–24,9 aralığında.', tone: 'ok' };
    }
    if (v < 30) {
      return {
        title: 'Fazla kilolu',
        detail: 'BKİ 25–29,9 aralığında. Kardiyometabolik risk artışı başlar.',
        tone: 'warn',
      };
    }
    if (v < 35) {
      return { title: 'Obezite — sınıf I', detail: 'BKİ 30–34,9 aralığında.', tone: 'risk' };
    }
    if (v < 40) {
      return { title: 'Obezite — sınıf II', detail: 'BKİ 35–39,9 aralığında.', tone: 'risk' };
    }
    return {
      title: 'Obezite — sınıf III (morbid)',
      detail: 'BKİ 40 ve üzerinde.',
      tone: 'risk',
    };
  };

  const v = gecerli ? yorum(bmi) : null;
  // İdeal aralık, aynı boy için BKİ 18,5–24,9 karşılığı.
  const idealAlt = gecerli ? 18.5 * b * b : 0;
  const idealUst = gecerli ? 24.9 * b * b : 0;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Kilo" hint="kg">
          <TextInput
            inputMode="decimal"
            placeholder="72"
            value={kilo}
            onChange={(e) => {
              setKilo(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Boy" hint="cm">
          <TextInput
            inputMode="decimal"
            placeholder="176"
            value={boy}
            onChange={(e) => {
              setBoy(e.target.value);
              trackRun();
            }}
          />
        </Field>
      </div>

      {v && (
        <ResultPanel
          actions={
            <CopyButton
              value={`BKİ ${bmi.toFixed(1).replace('.', ',')} kg/m² — ${v.title}`}
              label="Kopyala"
            />
          }
        >
          <Verdict
            score={bmi.toFixed(1).replace('.', ',')}
            unit="kg/m²"
            title={v.title}
            detail={v.detail}
            tone={v.tone}
          />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Bu boy için normal aralık{' '}
            <strong>
              {idealAlt.toFixed(1).replace('.', ',')}–{idealUst.toFixed(1).replace('.', ',')} kg
            </strong>
            . BKİ kas kütlesini yağdan ayırt etmez; sporcularda ve yaşlılarda yanıltıcı olabilir.
          </p>
        </ResultPanel>
      )}
      <Disclaimer />
    </ToolShell>
  );
}

export function Egfr() {
  const { trackRun } = useToolTracking();
  const [kreatinin, setKreatinin] = useState('');
  const [yas, setYas] = useState('');
  const [cinsiyet, setCinsiyet] = useState<'e' | 'k'>('e');
  const [birim, setBirim] = useState<'mgdl' | 'umol'>('mgdl');

  const yasN = sayi(yas);
  let scr = sayi(kreatinin);
  // µmol/L → mg/dL dönüşümü (1 mg/dL = 88,4 µmol/L)
  if (birim === 'umol') scr = scr / 88.4;
  const gecerli = scr > 0 && yasN >= 18 && yasN <= 120;

  /**
   * CKD-EPI 2021 — ırk katsayısı içermeyen sürüm. NKF-ASN Ortak Görev Gücü
   * (2021) ırk değişkeninin kaldırılmasını önerdiği için bu sürüm kullanılır.
   */
  const egfr = useMemo(() => {
    if (!gecerli) return NaN;
    const kadin = cinsiyet === 'k';
    const kappa = kadin ? 0.7 : 0.9;
    const alpha = kadin ? -0.241 : -0.302;
    return (
      142 *
      Math.pow(Math.min(scr / kappa, 1), alpha) *
      Math.pow(Math.max(scr / kappa, 1), -1.2) *
      Math.pow(0.9938, yasN) *
      (kadin ? 1.012 : 1)
    );
  }, [gecerli, scr, yasN, cinsiyet]);

  const evre = (v: number): { title: string; detail: string; tone: Tone } => {
    if (v >= 90) {
      return {
        title: 'G1 — normal veya yüksek',
        detail: 'eGFR ≥ 90. Böbrek hasarı kanıtı (albüminüri vb.) yoksa KBH tanısı konmaz.',
        tone: 'ok',
      };
    }
    if (v >= 60) {
      return {
        title: 'G2 — hafif azalmış',
        detail: 'eGFR 60–89. Tek başına KBH tanısı için yeterli değildir.',
        tone: 'ok',
      };
    }
    if (v >= 45) {
      return { title: 'G3a — hafif–orta azalmış', detail: 'eGFR 45–59.', tone: 'warn' };
    }
    if (v >= 30) {
      return { title: 'G3b — orta–ileri azalmış', detail: 'eGFR 30–44.', tone: 'warn' };
    }
    if (v >= 15) {
      return {
        title: 'G4 — ileri azalmış',
        detail: 'eGFR 15–29. Nefroloji takibi ve renal replasman hazırlığı gündeme gelir.',
        tone: 'risk',
      };
    }
    return {
      title: 'G5 — böbrek yetmezliği',
      detail: 'eGFR < 15. Renal replasman tedavisi değerlendirilir.',
      tone: 'risk',
    };
  };

  const v = gecerli ? evre(egfr) : null;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Serum kreatinin">
          <TextInput
            inputMode="decimal"
            placeholder={birim === 'mgdl' ? '0,9' : '80'}
            value={kreatinin}
            onChange={(e) => {
              setKreatinin(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Kreatinin birimi">
          <Select value={birim} onChange={(e) => setBirim(e.target.value as 'mgdl' | 'umol')}>
            <option value="mgdl">mg/dL</option>
            <option value="umol">µmol/L</option>
          </Select>
        </Field>
        <Field label="Yaş" hint="yıl">
          <TextInput
            inputMode="numeric"
            placeholder="54"
            value={yas}
            onChange={(e) => {
              setYas(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Cinsiyet">
          <Select value={cinsiyet} onChange={(e) => setCinsiyet(e.target.value as 'e' | 'k')}>
            <option value="e">Erkek</option>
            <option value="k">Kadın</option>
          </Select>
        </Field>
      </div>

      {v && (
        <ResultPanel
          actions={
            <CopyButton
              value={`eGFR ${egfr.toFixed(0)} mL/dk/1,73 m² — ${v.title} (CKD-EPI 2021)`}
              label="Kopyala"
            />
          }
        >
          <Verdict
            score={egfr.toFixed(0)}
            unit="mL/dk/1,73 m²"
            title={v.title}
            detail={v.detail}
            tone={v.tone}
          />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> CKD-EPI 2021 (kreatinin, ırk katsayısı içermez). Yalnızca 18
            yaş ve üzeri için geçerlidir; çocuklarda Schwartz formülü kullanılır. Akut böbrek
            hasarında, gebelikte ve aşırı kas kütlesi uçlarında güvenilir değildir.
          </p>
        </ResultPanel>
      )}
      <Disclaimer />
    </ToolShell>
  );
}

export function Meld() {
  const { trackRun } = useToolTracking();
  const [bil, setBil] = useState('');
  const [inr, setInr] = useState('');
  const [krea, setKrea] = useState('');
  const [na, setNa] = useState('');
  const [diyaliz, setDiyaliz] = useState(false);

  const hesap = useMemo(() => {
    let b = sayi(bil);
    let i = sayi(inr);
    let c = sayi(krea);
    if (![b, i, c].every((x) => Number.isFinite(x) && x > 0)) return null;

    // UNOS kuralları: 1'in altındaki değerler 1'e yuvarlanır (ln 0 tanımsız).
    b = Math.max(b, 1);
    i = Math.max(i, 1);
    c = Math.max(c, 1);
    // Haftada 2+ diyaliz veya 24 saatlik CVVHD varsa kreatinin 4,0 kabul edilir.
    if (diyaliz) c = 4;
    c = Math.min(c, 4);

    const ham = 3.78 * Math.log(b) + 11.2 * Math.log(i) + 9.57 * Math.log(c) + 6.43;
    const meld = Math.min(40, Math.max(6, Math.round(ham)));

    // MELD-Na (OPTN 2016): yalnızca MELD > 11 iken uygulanır, Na 125–137'ye kırpılır.
    const n = sayi(na);
    let meldNa: number | null = null;
    if (Number.isFinite(n) && n > 0) {
      const nk = Math.min(137, Math.max(125, n));
      meldNa =
        meld > 11
          ? Math.min(40, Math.max(6, Math.round(meld + 1.32 * (137 - nk) - 0.033 * meld * (137 - nk))))
          : meld;
    }
    return { meld, meldNa };
  }, [bil, inr, krea, na, diyaliz]);

  /** Bildirilen 3 aylık mortalite aralıkları (Wiesner ve ark., Gastroenterology 2003). */
  const yorum = (v: number): { title: string; detail: string; tone: Tone } => {
    if (v <= 9) {
      return { title: 'Düşük', detail: '3 aylık mortalite yaklaşık %1,9.', tone: 'ok' };
    }
    if (v <= 19) {
      return { title: 'Orta', detail: '3 aylık mortalite yaklaşık %6,0.', tone: 'warn' };
    }
    if (v <= 29) {
      return { title: 'Yüksek', detail: '3 aylık mortalite yaklaşık %19,6.', tone: 'risk' };
    }
    if (v <= 39) {
      return { title: 'Çok yüksek', detail: '3 aylık mortalite yaklaşık %52,6.', tone: 'risk' };
    }
    return { title: 'Aşırı yüksek', detail: '3 aylık mortalite yaklaşık %71,3.', tone: 'risk' };
  };

  const gosterilen = hesap ? (hesap.meldNa ?? hesap.meld) : 0;
  const v = hesap ? yorum(gosterilen) : null;

  return (
    <ToolShell>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Total bilirubin" hint="mg/dL">
          <TextInput
            inputMode="decimal"
            placeholder="2,4"
            value={bil}
            onChange={(e) => {
              setBil(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="INR">
          <TextInput
            inputMode="decimal"
            placeholder="1,6"
            value={inr}
            onChange={(e) => {
              setInr(e.target.value);
              trackRun();
            }}
          />
        </Field>
        <Field label="Serum kreatinin" hint="mg/dL">
          <TextInput
            inputMode="decimal"
            placeholder="1,2"
            value={krea}
            onChange={(e) => {
              setKrea(e.target.value);
              trackRun();
            }}
            disabled={diyaliz}
          />
        </Field>
        <Field label="Serum sodyum" hint="mEq/L — MELD-Na için">
          <TextInput
            inputMode="decimal"
            placeholder="132"
            value={na}
            onChange={(e) => {
              setNa(e.target.value);
              trackRun();
            }}
          />
        </Field>
      </div>

      <label className="mt-3.5 flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={diyaliz}
          onChange={(e) => setDiyaliz(e.target.checked)}
          className="h-4 w-4 accent-brand-600"
        />
        <span>
          Son hafta içinde ≥ 2 kez hemodiyaliz veya 24 saat CVVHD
          <span className="text-muted"> — kreatinin 4,0 mg/dL kabul edilir</span>
        </span>
      </label>

      {hesap && v && (
        <ResultPanel
          actions={
            <CopyButton
              value={`MELD ${hesap.meld}${hesap.meldNa !== null ? ` — MELD-Na ${hesap.meldNa}` : ''} — ${v.title}`}
              label="Kopyala"
            />
          }
        >
          <Verdict
            score={String(gosterilen)}
            unit={hesap.meldNa !== null ? 'MELD-Na' : 'MELD'}
            title={v.title}
            detail={v.detail}
            tone={v.tone}
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] px-3.5 py-2.5">
              <div className="text-xs text-muted">MELD (orijinal)</div>
              <div className="mt-0.5 text-sm font-bold tabular-nums">{hesap.meld}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] px-3.5 py-2.5">
              <div className="text-xs text-muted">MELD-Na</div>
              <div className="mt-0.5 text-sm font-bold tabular-nums">
                {hesap.meldNa !== null ? hesap.meldNa : 'sodyum girilmedi'}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            <strong>Formül:</strong> MELD = 3,78·ln(bilirubin) + 11,2·ln(INR) + 9,57·ln(kreatinin)
            + 6,43. 1’in altındaki değerler 1’e, kreatinin en fazla 4,0’a yuvarlanır; skor 6–40
            aralığına kırpılır. MELD-Na yalnızca MELD &gt; 11 iken uygulanır (OPTN 2016), sodyum
            125–137 aralığına kırpılır. 12 yaş altı için MELD değil PELD kullanılır.
          </p>
        </ResultPanel>
      )}
      <Disclaimer />
    </ToolShell>
  );
}
