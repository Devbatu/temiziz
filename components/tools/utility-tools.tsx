'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Pause, Play, RotateCcw, Flag } from 'lucide-react';
import {
  Button,
  CopyButton,
  DownloadButton,
  ErrorNote,
  Field,
  ResultPanel,
  Select,
  Slider,
  Stat,
  TextArea,
  TextInput,
  ToolShell,
} from './shared';

/* ══════════════════════════════ QR code ══════════════════════════════ */

export function QrCodeGenerator() {
  const [text, setText] = useState('https://multitools.app');
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [dark, setDark] = useState('#0b1020');
  const [light, setLight] = useState('#ffffff');
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!text.trim()) {
      setUrl('');
      return;
    }
    QRCode.toDataURL(text, {
      width: size,
      margin,
      errorCorrectionLevel: level,
      color: { dark, light },
    })
      .then((d) => !cancelled && (setUrl(d), setError('')))
      .catch(() => !cancelled && setError('Metin QR kod için fazla uzun. Kısaltmayı deneyin.'));
    return () => {
      cancelled = true;
    };
  }, [text, size, margin, dark, light, level]);

  return (
    <ToolShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <Field label="İçerik" hint="URL, metin, telefon, e-posta…">
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] font-sans text-sm"
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Slider label="Boyut" value={size} onChange={setSize} min={128} max={1024} step={32} suffix=" px" />
            <Slider label="Kenar boşluğu" value={margin} onChange={setMargin} min={0} max={8} />
            <Field label="Ön plan rengi">
              <input
                type="color"
                value={dark}
                onChange={(e) => setDark(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-[var(--border)] bg-transparent"
              />
            </Field>
            <Field label="Arka plan rengi">
              <input
                type="color"
                value={light}
                onChange={(e) => setLight(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-[var(--border)] bg-transparent"
              />
            </Field>
            <Field label="Hata düzeltme" hint="Logo ekleyecekseniz H">
              <Select value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
                <option value="L">L — %7</option>
                <option value="M">M — %15</option>
                <option value="Q">Q — %25</option>
                <option value="H">H — %30</option>
              </Select>
            </Field>
          </div>
          {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="grid aspect-square w-full max-w-[280px] place-items-center rounded-2xl border border-[var(--border)] p-4">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="Oluşturulan QR kod" className="h-full w-full object-contain" />
            ) : (
              <span className="text-sm text-muted">İçerik girin</span>
            )}
          </div>
          {url && (
            <Button
              onClick={() => {
                const a = document.createElement('a');
                a.href = url;
                a.download = `qr-${size}.png`;
                a.click();
              }}
              className="w-full"
            >
              PNG olarak indir
            </Button>
          )}
        </div>
      </div>
    </ToolShell>
  );
}

/* ═══════════════════════════ password ═══════════════════════════ */

const SETS = {
  lower: 'abcdefghijkmnopqrstuvwxyz',
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digits: '23456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
  ambiguous: 'il1Lo0O',
};

export function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({ upper: true, lower: true, digits: true, symbols: true });
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(true);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    let pool = '';
    if (opts.lower) pool += SETS.lower;
    if (opts.upper) pool += SETS.upper;
    if (opts.digits) pool += SETS.digits;
    if (opts.symbols) pool += SETS.symbols;
    if (!avoidAmbiguous) pool += SETS.ambiguous;
    if (!pool) {
      setPassword('');
      return;
    }
    // Rejection sampling keeps every character equally likely.
    const bytes = crypto.getRandomValues(new Uint32Array(length * 2));
    const limit = Math.floor(0xffffffff / pool.length) * pool.length;
    let out = '';
    for (let i = 0; out.length < length; i++) {
      const v = bytes[i % bytes.length];
      if (v >= limit) continue;
      out += pool[v % pool.length];
    }
    setPassword(out);
  }, [length, opts, avoidAmbiguous]);

  useEffect(() => {
    generate();
  }, [generate]);

  const entropy = useMemo(() => {
    let poolSize = 0;
    if (opts.lower) poolSize += SETS.lower.length;
    if (opts.upper) poolSize += SETS.upper.length;
    if (opts.digits) poolSize += SETS.digits.length;
    if (opts.symbols) poolSize += SETS.symbols.length;
    if (!avoidAmbiguous) poolSize += SETS.ambiguous.length;
    return poolSize ? Math.round(length * Math.log2(poolSize)) : 0;
  }, [length, opts, avoidAmbiguous]);

  const strength =
    entropy >= 128 ? { label: 'Mükemmel', color: 'bg-emerald-500', pct: 100 }
    : entropy >= 90 ? { label: 'Çok güçlü', color: 'bg-emerald-500', pct: 80 }
    : entropy >= 60 ? { label: 'Güçlü', color: 'bg-amber-500', pct: 60 }
    : entropy >= 40 ? { label: 'Orta', color: 'bg-orange-500', pct: 40 }
    : { label: 'Zayıf', color: 'bg-rose-500', pct: 20 };

  async function copy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <ToolShell>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-black/[0.02] p-4 dark:bg-white/[0.03]">
        <code className="min-w-0 flex-1 break-all font-mono text-lg font-semibold">
          {password || '—'}
        </code>
        <button
          onClick={copy}
          aria-label="Parolayı kopyala"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--border)]"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
        <button
          onClick={generate}
          aria-label="Yeni parola üret"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--border)]"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">{strength.label}</span>
          <span className="text-muted">~{entropy} bit entropi</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
            style={{ width: `${strength.pct}%` }}
          />
        </div>
      </div>

      <div className="mt-6">
        <Slider label="Uzunluk" value={length} onChange={setLength} min={6} max={64} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(
          [
            ['lower', 'Küçük harf (a-z)'],
            ['upper', 'Büyük harf (A-Z)'],
            ['digits', 'Rakam (0-9)'],
            ['symbols', 'Sembol (!@#$)'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={opts[key]}
              onChange={(e) => setOpts({ ...opts, [key]: e.target.checked })}
              className="h-4 w-4 accent-[#3163ff]"
            />
            {label}
          </label>
        ))}
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={avoidAmbiguous}
            onChange={(e) => setAvoidAmbiguous(e.target.checked)}
            className="h-4 w-4 accent-[#3163ff]"
          />
          Karışan karakterleri hariç tut (l, 1, O, 0)
        </label>
      </div>

      <p className="mt-5 text-xs text-muted">
        Parola tamamen tarayıcınızda, kriptografik rastgelelik kaynağıyla üretilir ve hiçbir yere
        gönderilmez.
      </p>
    </ToolShell>
  );
}

/* ═══════════════════════════ lorem ipsum ═══════════════════════════ */

const LOREM_WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(
    ' ',
  );

export function LoremIpsumGenerator() {
  const [count, setCount] = useState(3);
  const [unit, setUnit] = useState<'paragraph' | 'sentence' | 'word'>('paragraph');
  const [startClassic, setStartClassic] = useState(true);
  const [seed, setSeed] = useState(0);

  const text = useMemo(() => {
    void seed;
    const word = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
    const sentence = () => {
      const n = 8 + Math.floor(Math.random() * 10);
      const words = Array.from({ length: n }, word);
      return words[0][0].toUpperCase() + words[0].slice(1) + ' ' + words.slice(1).join(' ') + '.';
    };
    if (unit === 'word') return Array.from({ length: count }, word).join(' ');
    if (unit === 'sentence') return Array.from({ length: count }, sentence).join(' ');
    const paras = Array.from({ length: count }, () =>
      Array.from({ length: 3 + Math.floor(Math.random() * 3) }, sentence).join(' '),
    );
    if (startClassic) {
      paras[0] = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${paras[0]}`;
    }
    return paras.join('\n\n');
  }, [count, unit, startClassic, seed]);

  return (
    <ToolShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Adet" value={count} onChange={setCount} min={1} max={50} />
        <Field label="Birim">
          <Select value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)}>
            <option value="paragraph">Paragraf</option>
            <option value="sentence">Cümle</option>
            <option value="word">Kelime</option>
          </Select>
        </Field>
      </div>
      <label className="mt-3 flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={startClassic}
          onChange={(e) => setStartClassic(e.target.checked)}
          className="h-4 w-4 accent-[#3163ff]"
        />
        “Lorem ipsum dolor sit amet…” ile başlat
      </label>
      <div className="mt-4">
        <Button onClick={() => setSeed((s) => s + 1)}>Yeniden üret</Button>
      </div>
      <ResultPanel
        title={`${text.split(/\s+/).length} kelime`}
        actions={
          <>
            <CopyButton value={text} />
            <DownloadButton data={text} filename="lorem-ipsum.txt" />
          </>
        }
      >
        <p className="max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
      </ResultPanel>
    </ToolShell>
  );
}

/* ═══════════════════════════ random ═══════════════════════════ */

export function RandomNumberGenerator() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [unique, setUnique] = useState(false);
  const [result, setResult] = useState<number[]>([]);
  const [error, setError] = useState('');

  function generate() {
    setError('');
    if (max <= min) {
      setError('Üst sınır, alt sınırdan büyük olmalıdır.');
      return;
    }
    const range = max - min + 1;
    if (unique && count > range) {
      setError(`Aralıkta yalnızca ${range} farklı sayı var; tekrarsız olarak daha fazlası üretilemez.`);
      return;
    }
    const pick = () => min + Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * range);
    if (unique) {
      const set = new Set<number>();
      while (set.size < count) set.add(pick());
      setResult([...set]);
    } else {
      setResult(Array.from({ length: count }, pick));
    }
  }

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Alt sınır">
          <TextInput type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
        </Field>
        <Field label="Üst sınır">
          <TextInput type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
        </Field>
        <Field label="Kaç adet">
          <TextInput
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
          />
        </Field>
      </div>
      <label className="mt-3 flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={unique}
          onChange={(e) => setUnique(e.target.checked)}
          className="h-4 w-4 accent-[#3163ff]"
        />
        Tekrarsız (çekiliş modu)
      </label>
      <div className="mt-4">
        <Button onClick={generate}>Üret</Button>
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {result.length > 0 && (
        <ResultPanel title="Sonuç" actions={<CopyButton value={result.join(', ')} />}>
          <div className="flex flex-wrap gap-2">
            {result.map((n, i) => (
              <span
                key={i}
                className="rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 px-3 py-1.5 font-mono text-sm font-bold text-white"
              >
                {n}
              </span>
            ))}
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

const FIRST = ['Aras', 'Deniz', 'Ela', 'Kaan', 'Mira', 'Nil', 'Poyraz', 'Sena', 'Toprak', 'Zeynep', 'Ada', 'Berk'];
const LAST = ['Aydın', 'Çelik', 'Demir', 'Erdem', 'Güneş', 'Kaya', 'Öztürk', 'Şahin', 'Tunç', 'Yılmaz'];
const BRAND_A = ['Nova', 'Lumen', 'Vertex', 'Aura', 'Pixel', 'Orbit', 'Kinet', 'Zenit'];
const BRAND_B = ['ly', 'io', 'labs', 'works', 'hub', 'wave', 'forge', 'craft'];

export function RandomNameGenerator() {
  const [mode, setMode] = useState<'person' | 'brand' | 'username'>('person');
  const [count, setCount] = useState(8);
  const [names, setNames] = useState<string[]>([]);

  const generate = useCallback(() => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const out = Array.from({ length: count }, () => {
      if (mode === 'person') return `${pick(FIRST)} ${pick(LAST)}`;
      if (mode === 'brand') return `${pick(BRAND_A)}${pick(BRAND_B)}`;
      return `${pick(FIRST).toLowerCase()}${pick(BRAND_B)}${Math.floor(Math.random() * 90 + 10)}`;
    });
    setNames([...new Set(out)]);
  }, [mode, count]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tür">
          <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="person">Kişi adı</option>
            <option value="brand">Marka adı</option>
            <option value="username">Kullanıcı adı</option>
          </Select>
        </Field>
        <Slider label="Adet" value={count} onChange={setCount} min={1} max={40} />
      </div>
      <div className="mt-4">
        <Button onClick={generate}>Yeniden üret</Button>
      </div>
      <ResultPanel title={`${names.length} sonuç`} actions={<CopyButton value={names.join('\n')} />}>
        <div className="flex flex-wrap gap-2">
          {names.map((n) => (
            <span key={n} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm">
              {n}
            </span>
          ))}
        </div>
      </ResultPanel>
    </ToolShell>
  );
}

/* ═══════════════════════════ calculators ═══════════════════════════ */

export function AgeCalculator() {
  const [birth, setBirth] = useState('');
  const [target, setTarget] = useState(new Date().toISOString().slice(0, 10));

  const result = useMemo(() => {
    if (!birth) return null;
    const b = new Date(birth);
    const t = new Date(target);
    if (Number.isNaN(b.getTime()) || Number.isNaN(t.getTime()) || b > t) return null;

    let years = t.getFullYear() - b.getFullYear();
    let months = t.getMonth() - b.getMonth();
    let days = t.getDate() - b.getDate();
    if (days < 0) {
      months--;
      days += new Date(t.getFullYear(), t.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    const totalDays = Math.floor((t.getTime() - b.getTime()) / 86400000);

    // Next birthday
    const next = new Date(t.getFullYear(), b.getMonth(), b.getDate());
    if (next < t) next.setFullYear(next.getFullYear() + 1);
    const toBirthday = Math.ceil((next.getTime() - t.getTime()) / 86400000);

    return { years, months, days, totalDays, toBirthday };
  }, [birth, target]);

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Doğum tarihi">
          <TextInput type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
        </Field>
        <Field label="Hesaplama tarihi">
          <TextInput type="date" value={target} onChange={(e) => setTarget(e.target.value)} />
        </Field>
      </div>
      {birth && !result && (
        <div className="mt-4">
          <ErrorNote>Doğum tarihi, hesaplama tarihinden sonra olamaz.</ErrorNote>
        </div>
      )}
      {result && (
        <ResultPanel title="Yaşınız">
          <p className="text-3xl font-extrabold">
            {result.years} <span className="text-base font-medium text-muted">yıl</span> {result.months}{' '}
            <span className="text-base font-medium text-muted">ay</span> {result.days}{' '}
            <span className="text-base font-medium text-muted">gün</span>
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Stat label="Toplam gün" value={result.totalDays.toLocaleString('tr-TR')} />
            <Stat label="Toplam saat" value={(result.totalDays * 24).toLocaleString('tr-TR')} />
            <Stat label="Doğum gününe" value={`${result.toBirthday} gün`} />
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

export function BmiCalculator() {
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);

  const bmi = useMemo(() => (height > 0 ? weight / (height / 100) ** 2 : 0), [height, weight]);
  const category =
    bmi < 18.5 ? { label: 'Zayıf', color: 'text-sky-500' }
    : bmi < 25 ? { label: 'Normal', color: 'text-emerald-500' }
    : bmi < 30 ? { label: 'Fazla kilolu', color: 'text-amber-500' }
    : { label: 'Obez', color: 'text-rose-500' };

  const ideal = height > 0 ? [18.5 * (height / 100) ** 2, 24.9 * (height / 100) ** 2] : [0, 0];

  return (
    <ToolShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Boy" value={height} onChange={setHeight} min={100} max={230} suffix=" cm" />
        <Slider label="Kilo" value={weight} onChange={setWeight} min={30} max={200} suffix=" kg" />
      </div>
      <ResultPanel title="Vücut kitle indeksi">
        <p className="text-4xl font-extrabold">
          {bmi.toFixed(1)} <span className={`text-lg font-bold ${category.color}`}>{category.label}</span>
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 via-60% to-rose-500">
          <div
            className="h-full w-1 bg-[var(--fg)]"
            style={{ marginLeft: `${Math.min(Math.max((bmi - 15) / 25, 0), 1) * 100}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Stat label="İdeal kilo aralığı" value={`${ideal[0].toFixed(1)} – ${ideal[1].toFixed(1)} kg`} />
          <Stat label="Normal BMI aralığı" value="18.5 – 24.9" />
        </div>
        <p className="mt-4 text-xs text-muted">
          BMI genel bir göstergedir; kas kütlesi, yaş ve vücut kompozisyonunu dikkate almaz. Sağlık
          kararları için hekiminize danışın.
        </p>
      </ResultPanel>
    </ToolShell>
  );
}

/* ═══════════════════════════ converters ═══════════════════════════ */

const UNIT_GROUPS: Record<string, Record<string, number>> = {
  Uzunluk: { Milimetre: 0.001, Santimetre: 0.01, Metre: 1, Kilometre: 1000, İnç: 0.0254, Fit: 0.3048, Yarda: 0.9144, Mil: 1609.344 },
  Ağırlık: { Miligram: 1e-6, Gram: 0.001, Kilogram: 1, Ton: 1000, Ons: 0.0283495, Libre: 0.453592 },
  Alan: { 'Metrekare': 1, 'Kilometrekare': 1e6, Hektar: 10000, Dönüm: 1000, 'Ayakkare': 0.092903, Akre: 4046.86 },
  Hacim: { Mililitre: 0.001, Litre: 1, 'Metreküp': 1000, Galon: 3.78541, 'Su bardağı': 0.2 },
  Veri: { Bayt: 1, Kilobayt: 1024, Megabayt: 1024 ** 2, Gigabayt: 1024 ** 3, Terabayt: 1024 ** 4 },
  Süre: { Saniye: 1, Dakika: 60, Saat: 3600, Gün: 86400, Hafta: 604800, Yıl: 31536000 },
};

export function UnitConverter() {
  const [group, setGroup] = useState('Uzunluk');
  const [from, setFrom] = useState('Metre');
  const [to, setTo] = useState('Kilometre');
  const [value, setValue] = useState('1');
  const [tempMode, setTempMode] = useState(false);
  const [tFrom, setTFrom] = useState('Celsius');
  const [tTo, setTTo] = useState('Fahrenheit');

  const units = Object.keys(UNIT_GROUPS[group] ?? {});

  useEffect(() => {
    const u = Object.keys(UNIT_GROUPS[group]);
    setFrom(u[0]);
    setTo(u[1] ?? u[0]);
  }, [group]);

  const result = useMemo(() => {
    const n = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(n)) return '';
    if (tempMode) return convertTemp(n, tFrom, tTo).toFixed(2);
    const table = UNIT_GROUPS[group];
    if (!table?.[from] || !table?.[to]) return '';
    const out = (n * table[from]) / table[to];
    return Number.isInteger(out) ? String(out) : out.toPrecision(8).replace(/\.?0+$/, '');
  }, [value, group, from, to, tempMode, tFrom, tTo]);

  return (
    <ToolShell>
      <div className="flex flex-wrap gap-2">
        {[...Object.keys(UNIT_GROUPS), 'Sıcaklık'].map((g) => {
          const active = g === 'Sıcaklık' ? tempMode : !tempMode && group === g;
          return (
            <button
              key={g}
              onClick={() => {
                if (g === 'Sıcaklık') setTempMode(true);
                else {
                  setTempMode(false);
                  setGroup(g);
                }
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active ? 'bg-brand-600 text-white' : 'border border-[var(--border)] text-muted'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid items-end gap-3 sm:grid-cols-[1fr_1fr]">
        <Field label="Değer">
          <TextInput value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Birim">
          {tempMode ? (
            <Select value={tFrom} onChange={(e) => setTFrom(e.target.value)}>
              {['Celsius', 'Fahrenheit', 'Kelvin'].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
          ) : (
            <Select value={from} onChange={(e) => setFrom(e.target.value)}>
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Sonuç">
          <TextInput value={result} readOnly className="font-mono font-semibold" />
        </Field>
        <Field label="Hedef birim">
          {tempMode ? (
            <Select value={tTo} onChange={(e) => setTTo(e.target.value)}>
              {['Celsius', 'Fahrenheit', 'Kelvin'].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
          ) : (
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      {result && (
        <ResultPanel title="Dönüşüm" actions={<CopyButton value={result} />}>
          <p className="text-2xl font-extrabold">
            {value} {tempMode ? tFrom : from} = {result} {tempMode ? tTo : to}
          </p>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

function convertTemp(v: number, from: string, to: string) {
  const c = from === 'Celsius' ? v : from === 'Fahrenheit' ? (v - 32) / 1.8 : v - 273.15;
  return to === 'Celsius' ? c : to === 'Fahrenheit' ? c * 1.8 + 32 : c + 273.15;
}

const ZONES = [
  'Europe/Istanbul', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'America/New_York',
  'America/Los_Angeles', 'America/Sao_Paulo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai',
  'Asia/Tokyo', 'Australia/Sydney', 'UTC',
];

export function TimezoneConverter() {
  const [now, setNow] = useState(() => new Date());
  const [zones, setZones] = useState(['Europe/Istanbul', 'Europe/London', 'America/New_York', 'Asia/Tokyo']);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <ToolShell>
      <Field label="Saat dilimi ekle">
        <Select
          value=""
          onChange={(e) => {
            if (e.target.value && !zones.includes(e.target.value)) setZones([...zones, e.target.value]);
          }}
        >
          <option value="">Seçin…</option>
          {ZONES.filter((z) => !zones.includes(z)).map((z) => (
            <option key={z}>{z}</option>
          ))}
        </Select>
      </Field>

      <div className="mt-4 space-y-2">
        {zones.map((z) => (
          <div
            key={z}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold">{z.split('/').pop()?.replace('_', ' ')}</p>
              <p className="text-xs text-muted">{z}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold">
                {now.toLocaleTimeString('tr-TR', { timeZone: z, hour12: false })}
              </p>
              <p className="text-xs text-muted">
                {now.toLocaleDateString('tr-TR', { timeZone: z, day: 'numeric', month: 'short' })}
              </p>
            </div>
            <button
              onClick={() => setZones(zones.filter((x) => x !== z))}
              className="ml-3 text-xs text-muted hover:text-rose-500"
            >
              Kaldır
            </button>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}

/* ═══════════════════════════ colour ═══════════════════════════ */

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (n: number) => Math.round(255 * f(n)).toString(16).padStart(2, '0');
  return `#${to(0)}${to(8)}${to(4)}`;
}

export function ColorPicker() {
  const [hex, setHex] = useState('#3163ff');
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const formats = [
    ['HEX', hex.toUpperCase()],
    ['RGB', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
    ['HSL', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
    ['CSS değişkeni', `--color: ${hex};`],
  ];

  const shades = Array.from({ length: 9 }, (_, i) => hslToHex(hsl.h, hsl.s, 95 - i * 10));

  return (
    <ToolShell>
      <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
        <div>
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            aria-label="Renk seç"
            className="h-40 w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-transparent"
          />
          <TextInput
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="mt-3 text-center font-mono"
          />
        </div>
        <div className="space-y-2">
          {formats.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3.5 py-2.5"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
              <code className="flex-1 truncate text-right font-mono text-sm">{value}</code>
              <CopyButton value={value} label="" />
            </div>
          ))}
        </div>
      </div>

      <ResultPanel title="Ton skalası">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-9">
          {shades.map((s) => (
            <button
              key={s}
              onClick={() => setHex(s)}
              className="group rounded-lg border border-[var(--border)] p-1"
            >
              <span className="block h-12 rounded" style={{ background: s }} />
              <span className="mt-1 block font-mono text-[10px] text-muted">{s}</span>
            </button>
          ))}
        </div>
      </ResultPanel>
    </ToolShell>
  );
}

export function GradientGenerator() {
  const [c1, setC1] = useState('#3163ff');
  const [c2, setC2] = useState('#a855f7');
  const [angle, setAngle] = useState(135);
  const [type, setType] = useState<'linear' | 'radial'>('linear');

  const css =
    type === 'linear'
      ? `background: linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%);`
      : `background: radial-gradient(circle at 50% 50%, ${c1} 0%, ${c2} 100%);`;

  return (
    <ToolShell>
      <div
        className="h-56 rounded-2xl border border-[var(--border)]"
        style={{ background: css.replace('background: ', '').replace(';', '') }}
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Başlangıç rengi">
          <input
            type="color"
            value={c1}
            onChange={(e) => setC1(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-xl border border-[var(--border)] bg-transparent"
          />
        </Field>
        <Field label="Bitiş rengi">
          <input
            type="color"
            value={c2}
            onChange={(e) => setC2(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-xl border border-[var(--border)] bg-transparent"
          />
        </Field>
        <Field label="Tür">
          <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="linear">Doğrusal</option>
            <option value="radial">Dairesel</option>
          </Select>
        </Field>
        {type === 'linear' && (
          <Slider label="Açı" value={angle} onChange={setAngle} min={0} max={360} suffix="°" />
        )}
      </div>
      <ResultPanel title="CSS" actions={<CopyButton value={css} />}>
        <code className="block break-all font-mono text-sm">{css}</code>
      </ResultPanel>
    </ToolShell>
  );
}

export function PaletteGenerator() {
  const [base, setBase] = useState('#3163ff');
  const [scheme, setScheme] = useState<'analogous' | 'complementary' | 'triadic' | 'monochrome'>(
    'analogous',
  );

  const palette = useMemo(() => {
    const { r, g, b } = hexToRgb(base);
    const { h, s, l } = rgbToHsl(r, g, b);
    const wrap = (x: number) => (x + 360) % 360;
    switch (scheme) {
      case 'complementary':
        return [hslToHex(h, s, l), hslToHex(wrap(h + 180), s, l), hslToHex(h, s, Math.min(l + 20, 92)), hslToHex(wrap(h + 180), s, Math.max(l - 20, 12)), hslToHex(h, Math.max(s - 30, 8), l)];
      case 'triadic':
        return [hslToHex(h, s, l), hslToHex(wrap(h + 120), s, l), hslToHex(wrap(h + 240), s, l), hslToHex(h, s, Math.min(l + 18, 92)), hslToHex(h, s, Math.max(l - 18, 12))];
      case 'monochrome':
        return [92, 74, 56, 38, 22].map((li) => hslToHex(h, s, li));
      default:
        return [-40, -20, 0, 20, 40].map((d) => hslToHex(wrap(h + d), s, l));
    }
  }, [base, scheme]);

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ana renk">
          <input
            type="color"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-xl border border-[var(--border)] bg-transparent"
          />
        </Field>
        <Field label="Şema">
          <Select value={scheme} onChange={(e) => setScheme(e.target.value as typeof scheme)}>
            <option value="analogous">Analog</option>
            <option value="complementary">Tamamlayıcı</option>
            <option value="triadic">Üçlü</option>
            <option value="monochrome">Tek renk</option>
          </Select>
        </Field>
      </div>

      <div className="mt-5 grid grid-cols-5 overflow-hidden rounded-2xl border border-[var(--border)]">
        {palette.map((c) => (
          <div key={c} className="text-center">
            <div className="h-32" style={{ background: c }} />
            <p className="py-2 font-mono text-[11px]">{c.toUpperCase()}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <CopyButton value={palette.join(', ')} label="Paleti kopyala" />
      </div>
    </ToolShell>
  );
}

/* ═══════════════════════════ time ═══════════════════════════ */

export function CountdownTimer() {
  const [target, setTarget] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = target ? new Date(target).getTime() - now : 0;
  const done = target && diff <= 0;
  const s = Math.max(Math.floor(diff / 1000), 0);
  const parts = [
    ['Gün', Math.floor(s / 86400)],
    ['Saat', Math.floor((s % 86400) / 3600)],
    ['Dakika', Math.floor((s % 3600) / 60)],
    ['Saniye', s % 60],
  ] as const;

  return (
    <ToolShell>
      <Field label="Hedef tarih ve saat">
        <TextInput
          type="datetime-local"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </Field>
      {target && (
        <ResultPanel title={done ? 'Süre doldu' : 'Kalan süre'}>
          {done ? (
            <p className="text-2xl font-extrabold text-emerald-500">Hedef tarihe ulaşıldı 🎉</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {parts.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--border)] py-4 text-center">
                  <div className="font-mono text-3xl font-extrabold tabular-nums">
                    {String(value).padStart(2, '0')}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-muted">{label}</div>
                </div>
              ))}
            </div>
          )}
        </ResultPanel>
      )}
    </ToolShell>
  );
}

export function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - elapsed;
    const tick = () => {
      setElapsed(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const fmt = (ms: number) => {
    const total = Math.floor(ms);
    const m = Math.floor(total / 60000);
    const s = Math.floor((total % 60000) / 1000);
    const cs = Math.floor((total % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  return (
    <ToolShell>
      <div className="rounded-2xl border border-[var(--border)] py-12 text-center">
        <p className="font-mono text-5xl font-extrabold tabular-nums sm:text-7xl">{fmt(elapsed)}</p>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button onClick={() => setRunning((r) => !r)}>
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? 'Duraklat' : elapsed ? 'Devam et' : 'Başlat'}
        </Button>
        <Button variant="ghost" onClick={() => setLaps([...laps, elapsed])} disabled={!running}>
          <Flag className="h-4 w-4" /> Tur
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setRunning(false);
            setElapsed(0);
            setLaps([]);
          }}
        >
          <RotateCcw className="h-4 w-4" /> Sıfırla
        </Button>
      </div>
      {laps.length > 0 && (
        <ResultPanel title={`${laps.length} tur`} actions={<CopyButton value={laps.map(fmt).join('\n')} />}>
          <ul className="max-h-60 space-y-1 overflow-auto">
            {laps.map((l, i) => (
              <li key={i} className="flex justify-between font-mono text-sm">
                <span className="text-muted">Tur {i + 1}</span>
                <span>{fmt(l)}</span>
                <span className="text-muted">+{fmt(l - (laps[i - 1] ?? 0))}</span>
              </li>
            ))}
          </ul>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
