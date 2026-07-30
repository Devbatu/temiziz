'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  beautifyCss,
  decodeBase64,
  decodeJwt,
  encodeBase64,
  formatHtml,
  formatJson,
  formatSql,
  formatXml,
  keywordDensity,
  markdownToHtml,
  minifyCss,
  minifyJs,
  minifyJson,
  parseJson,
  slugify,
} from '@/lib/format';

/* ══════════════════════ generic text transform tool ══════════════════════ */

interface Action {
  label: string;
  run: (input: string) => string;
}

function TextTool({
  actions,
  placeholder,
  sample,
  filename,
  inputLabel = 'Girdi',
  outputLabel = 'Çıktı',
}: {
  actions: Action[];
  placeholder: string;
  sample: string;
  filename: string;
  inputLabel?: string;
  outputLabel?: string;
}) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  function run(action: Action) {
    setError('');
    if (!input.trim()) {
      setError('Önce işlenecek bir metin girin.');
      setOutput('');
      return;
    }
    try {
      setOutput(action.run(input));
    } catch (e) {
      setOutput('');
      setError((e as Error).message);
    }
  }

  return (
    <ToolShell>
      <Field label={inputLabel} hint={`${input.length.toLocaleString('tr-TR')} karakter`}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
        />
      </Field>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((a, i) => (
          <Button key={a.label} variant={i === 0 ? 'primary' : 'ghost'} onClick={() => run(a)}>
            {a.label}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => setInput(sample)}>
          Örnek yükle
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setInput('');
            setOutput('');
            setError('');
          }}
        >
          Temizle
        </Button>
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {output && (
        <ResultPanel
          title={outputLabel}
          actions={
            <>
              <CopyButton value={output} />
              <DownloadButton data={output} filename={filename} />
            </>
          }
        >
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">
            {output}
          </pre>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/* ══════════════════════════ developer tools ══════════════════════════ */

const JSON_SAMPLE = '{"ad":"Multi Tools","araclar":[{"id":1,"ad":"JSON Formatlayıcı"}],"aktif":true}';

export function JsonFormatter() {
  return (
    <TextTool
      placeholder='{"anahtar": "değer"}'
      sample={JSON_SAMPLE}
      filename="formatted.json"
      actions={[
        { label: 'Formatla (2 boşluk)', run: (v) => formatJson(v, 2) },
        { label: 'Formatla (4 boşluk)', run: (v) => formatJson(v, 4) },
        { label: 'Küçült', run: minifyJson },
      ]}
    />
  );
}

export function JsonValidator() {
  const [input, setInput] = useState('');
  const [state, setState] = useState<{ ok: boolean; message: string; keys?: number } | null>(null);

  function validate() {
    try {
      const parsed = parseJson(input);
      const keys =
        parsed && typeof parsed === 'object' ? Object.keys(parsed as object).length : 0;
      setState({ ok: true, message: 'JSON geçerli.', keys });
    } catch (e) {
      setState({ ok: false, message: (e as Error).message });
    }
  }

  return (
    <ToolShell>
      <Field label="JSON verisi">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"anahtar": "değer"}'
        />
      </Field>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={validate}>Doğrula</Button>
        <Button variant="ghost" onClick={() => setInput(JSON_SAMPLE)}>
          Örnek yükle
        </Button>
      </div>
      {state && (
        <div className="mt-4">
          {state.ok ? (
            <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ {state.message}
              {state.keys ? ` Kök seviyede ${state.keys} alan bulundu.` : ''}
            </div>
          ) : (
            <ErrorNote>{state.message}</ErrorNote>
          )}
        </div>
      )}
    </ToolShell>
  );
}

export function XmlFormatter() {
  return (
    <TextTool
      placeholder="<root><item>değer</item></root>"
      sample="<katalog><urun id='1'><ad>Kalem</ad><fiyat>25</fiyat></urun></katalog>"
      filename="formatted.xml"
      actions={[
        { label: 'Formatla', run: (v) => formatXml(v, 2) },
        { label: 'Küçült', run: (v) => v.replace(/>\s+</g, '><').trim() },
      ]}
    />
  );
}

export function HtmlFormatter() {
  return (
    <TextTool
      placeholder="<div><p>Merhaba</p></div>"
      sample="<div class='card'><h2>Başlık</h2><p>Açıklama metni</p><a href='#'>Devamı</a></div>"
      filename="formatted.html"
      actions={[
        { label: 'Formatla', run: (v) => formatHtml(v, 2) },
        { label: 'Küçült', run: (v) => v.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim() },
      ]}
    />
  );
}

export function CssMinifier() {
  return (
    <TextTool
      placeholder=".card { padding: 16px; }"
      sample={'/* kart */\n.card {\n  padding: 16px;\n  border-radius: 12px;\n}\n\n.card:hover {\n  box-shadow: 0 4px 12px rgba(0,0,0,.1);\n}'}
      filename="style.min.css"
      actions={[
        { label: 'Küçült', run: minifyCss },
        { label: 'Biçimlendir', run: beautifyCss },
      ]}
    />
  );
}

export function JavascriptMinifier() {
  return (
    <TextTool
      placeholder="function topla(a, b) { return a + b; }"
      sample={'// toplama\nfunction topla(a, b) {\n  return a + b;\n}\n\nconst sonuc = topla(2, 3);\nconsole.log("Sonuç:", sonuc);'}
      filename="script.min.js"
      actions={[{ label: 'Küçült', run: minifyJs }]}
    />
  );
}

export function SqlFormatter() {
  return (
    <TextTool
      placeholder="SELECT * FROM users WHERE id = 1"
      sample="SELECT u.id, u.name, o.total FROM users u INNER JOIN orders o ON o.user_id = u.id WHERE u.active = 1 AND o.total > 100 ORDER BY o.total DESC LIMIT 20"
      filename="query.sql"
      actions={[
        { label: 'Formatla', run: formatSql },
        { label: 'Tek satır', run: (v) => v.replace(/\s+/g, ' ').trim() },
      ]}
    />
  );
}

export function Base64Tool() {
  return (
    <TextTool
      placeholder="Kodlanacak veya çözülecek metni yapıştırın"
      sample="Multi Tools ile işiniz saniyeler içinde bitsin."
      filename="base64.txt"
      actions={[
        { label: 'Base64’e çevir', run: encodeBase64 },
        { label: 'Base64’ten çöz', run: decodeBase64 },
      ]}
    />
  );
}

export function SlugGenerator() {
  const [input, setInput] = useState('');
  const slug = useMemo(() => slugify(input), [input]);
  return (
    <ToolShell>
      <Field label="Başlık" hint="Türkçe karakterler otomatik dönüştürülür">
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Örn: PDF Dosya Boyutu Küçültme Rehberi"
        />
      </Field>
      {slug && (
        <ResultPanel title="URL slug" actions={<CopyButton value={slug} />}>
          <p className="break-all font-mono text-sm">{slug}</p>
          <p className="mt-2 text-xs text-muted">{slug.length} karakter</p>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

export function JwtDecoder() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<ReturnType<typeof decodeJwt> | null>(null);
  const [error, setError] = useState('');

  function decode() {
    setError('');
    try {
      setResult(decodeJwt(token));
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    }
  }

  const exp = (result?.payload as { exp?: number })?.exp;

  return (
    <ToolShell>
      <Field label="JWT token" hint="Token tarayıcınızda çözülür, hiçbir yere gönderilmez">
        <TextArea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          className="min-h-[120px]"
        />
      </Field>
      <div className="mt-4">
        <Button onClick={decode}>Çöz</Button>
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {result && (
        <>
          {exp && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Stat
                label="Son geçerlilik"
                value={new Date(exp * 1000).toLocaleString('tr-TR')}
              />
              <Stat
                label="Durum"
                value={exp * 1000 > Date.now() ? 'Geçerli' : 'Süresi dolmuş'}
              />
            </div>
          )}
          <ResultPanel
            title="Header"
            actions={<CopyButton value={JSON.stringify(result.header, null, 2)} />}
          >
            <pre className="overflow-auto font-mono text-[13px]">
              {JSON.stringify(result.header, null, 2)}
            </pre>
          </ResultPanel>
          <ResultPanel
            title="Payload"
            actions={<CopyButton value={JSON.stringify(result.payload, null, 2)} />}
          >
            <pre className="overflow-auto font-mono text-[13px]">
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          </ResultPanel>
        </>
      )}
    </ToolShell>
  );
}

export function HashGenerator() {
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState('SHA-256');
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');

  async function generate() {
    setError('');
    if (!input) {
      setError('Önce özeti alınacak metni girin.');
      return;
    }
    try {
      const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(input));
      setHash(
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      );
    } catch {
      setError('Tarayıcınız bu algoritmayı desteklemiyor.');
    }
  }

  return (
    <ToolShell>
      <Field label="Metin">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Özeti alınacak metin"
          className="min-h-[140px]"
        />
      </Field>
      <div className="mt-4 grid gap-3 sm:grid-cols-[200px_auto] sm:items-end">
        <Field label="Algoritma">
          <Select value={algo} onChange={(e) => setAlgo(e.target.value)}>
            <option>SHA-1</option>
            <option>SHA-256</option>
            <option>SHA-384</option>
            <option>SHA-512</option>
          </Select>
        </Field>
        <Button onClick={generate}>Hash üret</Button>
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      {hash && (
        <ResultPanel title={algo} actions={<CopyButton value={hash} />}>
          <p className="break-all font-mono text-[13px]">{hash}</p>
        </ResultPanel>
      )}
      <p className="mt-4 text-xs text-muted">
        Not: MD5 ve SHA-1 çakışmaya açıktır; parola saklama gibi güvenlik amaçlı kullanımlarda
        tercih edilmemelidir.
      </p>
    </ToolShell>
  );
}

export function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [list, setList] = useState<string[]>([]);
  const [upper, setUpper] = useState(false);

  function generate() {
    const out = Array.from({ length: count }, () =>
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : fallbackUuid(),
    );
    setList(upper ? out.map((u) => u.toUpperCase()) : out);
  }

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text = list.join('\n');

  return (
    <ToolShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Adet" value={count} onChange={setCount} min={1} max={100} />
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={upper}
            onChange={(e) => setUpper(e.target.checked)}
            className="h-4 w-4 accent-[#3163ff]"
          />
          Büyük harf
        </label>
      </div>
      <div className="mt-4">
        <Button onClick={generate}>Üret</Button>
      </div>
      {list.length > 0 && (
        <ResultPanel
          title={`${list.length} UUID v4`}
          actions={
            <>
              <CopyButton value={text} />
              <DownloadButton data={text} filename="uuids.txt" />
            </>
          }
        >
          <pre className="max-h-80 overflow-auto font-mono text-[13px] leading-relaxed">{text}</pre>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

function fallbackUuid() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function RegexTester() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w{2,}\\b');
  const [flags, setFlags] = useState('gi');
  const [text, setText] = useState('İletişim: destek@multitools.app veya satis@ornek.com');

  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [] as RegExpMatchArray[], error: '' };
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
      return { matches: [...text.matchAll(re)], error: '' };
    } catch (e) {
      return { matches: [] as RegExpMatchArray[], error: (e as Error).message };
    }
  }, [pattern, flags, text]);

  const highlighted = useMemo(() => {
    if (error || matches.length === 0) return null;
    const parts: React.ReactNode[] = [];
    let last = 0;
    matches.forEach((m, i) => {
      const start = m.index ?? 0;
      parts.push(text.slice(last, start));
      parts.push(
        <mark key={i} className="rounded bg-brand-500/25 px-0.5 text-[var(--fg)]">
          {m[0]}
        </mark>,
      );
      last = start + m[0].length;
    });
    parts.push(text.slice(last));
    return parts;
  }, [matches, text, error]);

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Field label="Desen">
          <TextInput
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="font-mono"
            placeholder="\\d+"
          />
        </Field>
        <Field label="Bayraklar">
          <TextInput
            value={flags}
            onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
            className="font-mono"
            placeholder="gi"
          />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Test metni">
          <TextArea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[160px]" />
        </Field>
      </div>
      {error && <div className="mt-4"><ErrorNote>Geçersiz desen: {error}</ErrorNote></div>}
      <ResultPanel title={`${matches.length} eşleşme`}>
        {highlighted ? (
          <p className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">
            {highlighted}
          </p>
        ) : (
          <p className="text-sm text-muted">Eşleşme bulunamadı.</p>
        )}
        {matches.length > 0 && (
          <ul className="mt-4 space-y-1 text-[13px]">
            {matches.slice(0, 30).map((m, i) => (
              <li key={i} className="font-mono">
                <span className="text-muted">#{i + 1} ({m.index}):</span> {m[0]}
              </li>
            ))}
          </ul>
        )}
      </ResultPanel>
    </ToolShell>
  );
}

export function MarkdownEditor() {
  const [md, setMd] = useState(
    '# Başlık\n\nMerhaba **dünya**! Bu bir *Markdown* örneğidir.\n\n- Birinci madde\n- İkinci madde\n\n[Bağlantı](https://multitools.app)',
  );
  const html = useMemo(() => markdownToHtml(md), [md]);

  return (
    <ToolShell>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Markdown">
          <TextArea value={md} onChange={(e) => setMd(e.target.value)} className="min-h-[400px]" />
        </Field>
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Önizleme
          </span>
          <div
            className="prose-sm min-h-[400px] overflow-auto rounded-xl border border-[var(--border)] p-4 [&_a]:text-brand-500 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-brand-500 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:my-2 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-black/10 [&_pre]:p-3 dark:[&_code]:bg-white/10 dark:[&_pre]:bg-white/10"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton value={html} label="HTML’i kopyala" />
        <DownloadButton data={md} filename="document.md" label="Markdown indir" />
        <DownloadButton data={html} filename="document.html" mime="text/html" label="HTML indir" />
      </div>
    </ToolShell>
  );
}

/* ──────────────────────────── cron ──────────────────────────── */

const CRON_PRESETS = [
  { label: 'Her dakika', value: '* * * * *' },
  { label: 'Her saat başı', value: '0 * * * *' },
  { label: 'Her gün 03:00', value: '0 3 * * *' },
  { label: 'Her pazartesi 09:00', value: '0 9 * * 1' },
  { label: 'Ayın 1’i 00:00', value: '0 0 1 * *' },
  { label: 'Her 15 dakikada', value: '*/15 * * * *' },
];

export function CronGenerator() {
  const [minute, setMinute] = useState('0');
  const [hour, setHour] = useState('3');
  const [dom, setDom] = useState('*');
  const [month, setMonth] = useState('*');
  const [dow, setDow] = useState('*');

  const expr = `${minute} ${hour} ${dom} ${month} ${dow}`;
  const description = useMemo(() => describeCron(minute, hour, dom, month, dow), [
    minute,
    hour,
    dom,
    month,
    dow,
  ]);

  function applyPreset(value: string) {
    const [mi, h, d, mo, w] = value.split(' ');
    setMinute(mi);
    setHour(h);
    setDom(d);
    setMonth(mo);
    setDow(w);
  }

  const fields: Array<[string, string, (v: string) => void, string]> = [
    ['Dakika', minute, setMinute, '0-59'],
    ['Saat', hour, setHour, '0-23'],
    ['Ayın günü', dom, setDom, '1-31'],
    ['Ay', month, setMonth, '1-12'],
    ['Haftanın günü', dow, setDow, '0-6'],
  ];

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-5">
        {fields.map(([label, value, set, hint]) => (
          <Field key={label} label={label} hint={hint}>
            <TextInput value={value} onChange={(e) => set(e.target.value)} className="font-mono" />
          </Field>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CRON_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => applyPreset(p.value)}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand-400 hover:text-brand-500"
          >
            {p.label}
          </button>
        ))}
      </div>

      <ResultPanel title="Cron ifadesi" actions={<CopyButton value={expr} />}>
        <p className="font-mono text-lg font-bold">{expr}</p>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </ResultPanel>
    </ToolShell>
  );
}

const DOW_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function describeCron(mi: string, h: string, dom: string, mo: string, dow: string) {
  const parts: string[] = [];
  if (mi.startsWith('*/')) parts.push(`her ${mi.slice(2)} dakikada bir`);
  else if (mi === '*') parts.push('her dakika');
  else parts.push(`${mi}. dakikada`);

  if (h === '*') parts.push('her saat');
  else if (h.startsWith('*/')) parts.push(`her ${h.slice(2)} saatte bir`);
  else parts.push(`saat ${h.padStart(2, '0')}’te`);

  if (dom !== '*') parts.push(`ayın ${dom}. günü`);
  if (mo !== '*') parts.push(`${mo}. ayda`);
  if (dow !== '*') {
    const n = Number(dow);
    parts.push(Number.isInteger(n) && DOW_NAMES[n] ? `${DOW_NAMES[n]} günleri` : `${dow} günlerinde`);
  }
  return `Çalışma zamanı: ${parts.join(', ')}.`;
}

/* ══════════════════════════════ SEO tools ══════════════════════════════ */

export function MetaTagGenerator() {
  const [f, setF] = useState({
    title: '',
    description: '',
    keywords: '',
    author: '',
    url: '',
    image: '',
    robots: 'index, follow',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const output = useMemo(() => {
    const lines = [
      `<title>${esc(f.title)}</title>`,
      `<meta name="description" content="${esc(f.description)}" />`,
      f.keywords && `<meta name="keywords" content="${esc(f.keywords)}" />`,
      f.author && `<meta name="author" content="${esc(f.author)}" />`,
      `<meta name="robots" content="${esc(f.robots)}" />`,
      `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
      f.url && `<link rel="canonical" href="${esc(f.url)}" />`,
      '',
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${esc(f.title)}" />`,
      `<meta property="og:description" content="${esc(f.description)}" />`,
      f.url && `<meta property="og:url" content="${esc(f.url)}" />`,
      f.image && `<meta property="og:image" content="${esc(f.image)}" />`,
      '',
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(f.title)}" />`,
      `<meta name="twitter:description" content="${esc(f.description)}" />`,
      f.image && `<meta name="twitter:image" content="${esc(f.image)}" />`,
    ].filter((l): l is string => typeof l === 'string');
    return lines.join('\n');
  }, [f]);

  const titleLen = f.title.length;
  const descLen = f.description.length;

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Sayfa başlığı"
            hint={`${titleLen}/60 ${titleLen > 60 ? '· çok uzun' : titleLen > 0 && titleLen < 30 ? '· kısa' : ''}`}
          >
            <TextInput value={f.title} onChange={set('title')} placeholder="Sayfanızın başlığı" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Açıklama"
            hint={`${descLen}/160 ${descLen > 160 ? '· çok uzun' : ''}`}
          >
            <TextInput
              value={f.description}
              onChange={set('description')}
              placeholder="Arama sonuçlarında görünecek açıklama"
            />
          </Field>
        </div>
        <Field label="Anahtar kelimeler">
          <TextInput value={f.keywords} onChange={set('keywords')} placeholder="araç, online, pdf" />
        </Field>
        <Field label="Yazar">
          <TextInput value={f.author} onChange={set('author')} placeholder="Ad Soyad" />
        </Field>
        <Field label="Canonical URL">
          <TextInput value={f.url} onChange={set('url')} placeholder="https://site.com/sayfa" />
        </Field>
        <Field label="Görsel URL">
          <TextInput value={f.image} onChange={set('image')} placeholder="https://site.com/og.jpg" />
        </Field>
        <Field label="Robots">
          <Select value={f.robots} onChange={set('robots')}>
            <option>index, follow</option>
            <option>noindex, follow</option>
            <option>index, nofollow</option>
            <option>noindex, nofollow</option>
          </Select>
        </Field>
      </div>

      {/* SERP preview */}
      {(f.title || f.description) && (
        <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs text-muted">Google önizlemesi</p>
          <p className="mt-2 truncate text-xs text-emerald-600 dark:text-emerald-400">
            {f.url || 'https://site.com/sayfa'}
          </p>
          <p className="truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">
            {f.title || 'Sayfa başlığı'}
          </p>
          <p className="line-clamp-2 text-sm text-muted">
            {f.description || 'Sayfanızın açıklaması burada görünür.'}
          </p>
        </div>
      )}

      <ResultPanel
        title="HTML çıktısı"
        actions={
          <>
            <CopyButton value={output} />
            <DownloadButton data={output} filename="meta-tags.html" mime="text/html" />
          </>
        }
      >
        <pre className="overflow-auto font-mono text-[13px] leading-relaxed">{output}</pre>
      </ResultPanel>
    </ToolShell>
  );
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function OpenGraphGenerator() {
  const [f, setF] = useState({
    type: 'website',
    title: '',
    description: '',
    url: '',
    image: '',
    siteName: '',
    locale: 'tr_TR',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const output = [
    `<meta property="og:type" content="${esc(f.type)}" />`,
    `<meta property="og:title" content="${esc(f.title)}" />`,
    `<meta property="og:description" content="${esc(f.description)}" />`,
    `<meta property="og:url" content="${esc(f.url)}" />`,
    `<meta property="og:image" content="${esc(f.image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    f.siteName && `<meta property="og:site_name" content="${esc(f.siteName)}" />`,
    `<meta property="og:locale" content="${esc(f.locale)}" />`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tür">
          <Select value={f.type} onChange={set('type')}>
            <option value="website">website</option>
            <option value="article">article</option>
            <option value="product">product</option>
            <option value="profile">profile</option>
          </Select>
        </Field>
        <Field label="Site adı">
          <TextInput value={f.siteName} onChange={set('siteName')} placeholder="Site adı" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Başlık">
            <TextInput value={f.title} onChange={set('title')} placeholder="Paylaşım başlığı" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Açıklama">
            <TextInput value={f.description} onChange={set('description')} placeholder="Kısa açıklama" />
          </Field>
        </div>
        <Field label="URL">
          <TextInput value={f.url} onChange={set('url')} placeholder="https://site.com/sayfa" />
        </Field>
        <Field label="Görsel (1200×630)">
          <TextInput value={f.image} onChange={set('image')} placeholder="https://site.com/og.jpg" />
        </Field>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="grid h-40 place-items-center bg-black/5 text-xs text-muted dark:bg-white/5">
          {f.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.image} alt="" className="h-full w-full object-cover" />
          ) : (
            '1200 × 630 görsel önizlemesi'
          )}
        </div>
        <div className="p-3">
          <p className="text-[11px] uppercase text-muted">{f.url || 'site.com'}</p>
          <p className="mt-1 font-semibold">{f.title || 'Paylaşım başlığı'}</p>
          <p className="line-clamp-2 text-sm text-muted">
            {f.description || 'Bağlantı paylaşıldığında görünecek açıklama.'}
          </p>
        </div>
      </div>

      <ResultPanel title="OpenGraph etiketleri" actions={<CopyButton value={output} />}>
        <pre className="overflow-auto font-mono text-[13px] leading-relaxed">{output}</pre>
      </ResultPanel>
    </ToolShell>
  );
}

const SCHEMA_TYPES = ['Article', 'FAQPage', 'Product', 'LocalBusiness', 'Organization'] as const;

export function SchemaGenerator() {
  const [type, setType] = useState<(typeof SCHEMA_TYPES)[number]>('Article');
  const [f, setF] = useState({ name: '', description: '', url: '', author: '', image: '', price: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  const json = useMemo(() => {
    const base: Record<string, unknown> = { '@context': 'https://schema.org', '@type': type };
    if (type === 'Article') {
      Object.assign(base, {
        headline: f.name,
        description: f.description,
        image: f.image || undefined,
        author: { '@type': 'Person', name: f.author || 'Yazar' },
        datePublished: new Date().toISOString().slice(0, 10),
        mainEntityOfPage: f.url || undefined,
      });
    } else if (type === 'Product') {
      Object.assign(base, {
        name: f.name,
        description: f.description,
        image: f.image || undefined,
        offers: {
          '@type': 'Offer',
          price: f.price || '0',
          priceCurrency: 'TRY',
          availability: 'https://schema.org/InStock',
          url: f.url || undefined,
        },
      });
    } else if (type === 'FAQPage') {
      Object.assign(base, {
        mainEntity: [
          {
            '@type': 'Question',
            name: f.name || 'Soru metni',
            acceptedAnswer: { '@type': 'Answer', text: f.description || 'Cevap metni' },
          },
        ],
      });
    } else {
      Object.assign(base, {
        name: f.name,
        description: f.description,
        url: f.url || undefined,
        image: f.image || undefined,
      });
    }
    return `<script type="application/ld+json">\n${JSON.stringify(base, null, 2)}\n</script>`;
  }, [type, f]);

  return (
    <ToolShell>
      <Field label="Schema türü">
        <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          {SCHEMA_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </Field>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={type === 'FAQPage' ? 'Soru' : 'Ad / Başlık'}>
          <TextInput value={f.name} onChange={set('name')} />
        </Field>
        <Field label={type === 'FAQPage' ? 'Cevap' : 'Açıklama'}>
          <TextInput value={f.description} onChange={set('description')} />
        </Field>
        <Field label="URL">
          <TextInput value={f.url} onChange={set('url')} placeholder="https://site.com/sayfa" />
        </Field>
        <Field label="Görsel">
          <TextInput value={f.image} onChange={set('image')} placeholder="https://site.com/img.jpg" />
        </Field>
        {type === 'Article' && (
          <Field label="Yazar">
            <TextInput value={f.author} onChange={set('author')} />
          </Field>
        )}
        {type === 'Product' && (
          <Field label="Fiyat (TRY)">
            <TextInput value={f.price} onChange={set('price')} placeholder="199.90" />
          </Field>
        )}
      </div>
      <ResultPanel
        title="JSON-LD"
        actions={
          <>
            <CopyButton value={json} />
            <DownloadButton data={json} filename="schema.html" mime="text/html" />
          </>
        }
      >
        <pre className="max-h-96 overflow-auto font-mono text-[13px] leading-relaxed">{json}</pre>
      </ResultPanel>
    </ToolShell>
  );
}

export function RobotsGenerator() {
  const [agent, setAgent] = useState('*');
  const [allow, setAllow] = useState('/');
  const [disallow, setDisallow] = useState('/admin/\n/tmp/\n/*.json$');
  const [sitemap, setSitemap] = useState('');
  const [delay, setDelay] = useState('');

  const output = [
    `User-agent: ${agent}`,
    ...allow.split('\n').filter(Boolean).map((l) => `Allow: ${l.trim()}`),
    ...disallow.split('\n').filter(Boolean).map((l) => `Disallow: ${l.trim()}`),
    delay && `Crawl-delay: ${delay}`,
    '',
    sitemap && `Sitemap: ${sitemap}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <ToolShell>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="User-agent">
          <TextInput value={agent} onChange={(e) => setAgent(e.target.value)} />
        </Field>
        <Field label="Crawl-delay (sn)">
          <TextInput value={delay} onChange={(e) => setDelay(e.target.value)} placeholder="isteğe bağlı" />
        </Field>
        <Field label="Allow (her satıra bir yol)">
          <TextArea value={allow} onChange={(e) => setAllow(e.target.value)} className="min-h-[120px]" />
        </Field>
        <Field label="Disallow (her satıra bir yol)">
          <TextArea
            value={disallow}
            onChange={(e) => setDisallow(e.target.value)}
            className="min-h-[120px]"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Sitemap URL">
            <TextInput
              value={sitemap}
              onChange={(e) => setSitemap(e.target.value)}
              placeholder="https://site.com/sitemap.xml"
            />
          </Field>
        </div>
      </div>
      <ResultPanel
        title="robots.txt"
        actions={
          <>
            <CopyButton value={output} />
            <DownloadButton data={output} filename="robots.txt" />
          </>
        }
      >
        <pre className="overflow-auto font-mono text-[13px] leading-relaxed">{output}</pre>
      </ResultPanel>
    </ToolShell>
  );
}

export function SitemapGenerator() {
  const [urls, setUrls] = useState('https://site.com/\nhttps://site.com/hakkimizda');
  const [freq, setFreq] = useState('weekly');
  const [priority, setPriority] = useState('0.8');

  const output = useMemo(() => {
    const list = urls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    const today = new Date().toISOString().slice(0, 10);
    const body = list
      .map(
        (u) =>
          `  <url>\n    <loc>${esc(u)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
  }, [urls, freq, priority]);

  const count = urls.split('\n').filter((u) => u.trim()).length;

  return (
    <ToolShell>
      <Field label="URL listesi" hint={`${count} URL`}>
        <TextArea value={urls} onChange={(e) => setUrls(e.target.value)} className="min-h-[200px]" />
      </Field>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Değişim sıklığı">
          <Select value={freq} onChange={(e) => setFreq(e.target.value)}>
            {['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Öncelik">
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.3'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </Field>
      </div>
      <ResultPanel
        title="sitemap.xml"
        actions={
          <>
            <CopyButton value={output} />
            <DownloadButton data={output} filename="sitemap.xml" mime="application/xml" />
          </>
        }
      >
        <pre className="max-h-96 overflow-auto font-mono text-[13px] leading-relaxed">{output}</pre>
      </ResultPanel>
    </ToolShell>
  );
}

export function KeywordDensityChecker() {
  const [text, setText] = useState('');
  const { rows, total } = useMemo(() => keywordDensity(text), [text]);

  return (
    <ToolShell>
      <Field label="Metin" hint={`${total} kelime`}>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Analiz edilecek içeriği yapıştırın…"
        />
      </Field>
      {rows.length > 0 && (
        <ResultPanel title="Kelime yoğunluğu">
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.word} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm font-medium">{r.word}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                    style={{ width: `${Math.min(r.density * 8, 100)}%` }}
                  />
                </span>
                <span className="w-24 shrink-0 text-right text-xs text-muted">
                  {r.count}× · %{r.density.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
