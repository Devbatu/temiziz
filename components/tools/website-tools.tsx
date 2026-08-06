'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import {
  Button,
  CopyButton,
  ErrorNote,
  Field,
  ResultPanel,
  Select,
  Stat,
  TextInput,
  ToolShell,
} from './shared';

/* ─────────────────────── ağ araçları istemcisi ─────────────────────── */

/**
 * Statik yayında Next.js sunucu rotaları bulunmaz; bu sorguları aynı sunucudaki
 * PHP ucu karşılar. Geliştirme sunucusunda `/api/net` çalıştığı için orası
 * kullanılır — böylece iki ortamda da tek kod yolu geçerli olur.
 */
const NET_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_URL
  ? process.env.NEXT_PUBLIC_ANALYTICS_URL.replace(/collect\.php$/, 'net.php')
  : '/api/net';

function useNetAction<T>(action: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(payload: Record<string, unknown>) {
    setBusy(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(NET_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Sorgu başarısız oldu.');
        return;
      }
      setData(json as T);
    } catch {
      setError('Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  return { data, error, busy, run, setError };
}

function HostForm({
  value,
  onChange,
  onSubmit,
  busy,
  label = 'Alan adı',
  placeholder = 'ornek.com',
  cta = 'Sorgula',
  extra,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  label?: string;
  placeholder?: string;
  cta?: string;
  extra?: React.ReactNode;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label={label}>
          <TextInput
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder={placeholder}
          />
        </Field>
        {extra}
      </div>
      <div className="mt-4">
        <Button onClick={onSubmit} disabled={busy}>
          {busy ? 'Sorgulanıyor…' : cta}
        </Button>
      </div>
    </>
  );
}

const privacyNote = (
  <p className="mt-4 text-xs text-muted">
    Sorgu sunucumuz üzerinden yapılır; girdiğiniz adres kaydedilmez.
  </p>
);

/* ═══════════════════════════ WHOIS ═══════════════════════════ */

interface WhoisResult {
  host: string;
  available: boolean;
  registrar: string | null;
  created: string | null;
  updated: string | null;
  expires: string | null;
  status: string[];
  nameServers: string[];
  raw: string;
}

export function WhoisLookup() {
  const [host, setHost] = useState('');
  const { data, error, busy, run } = useNetAction<WhoisResult>('whois');
  const [showRaw, setShowRaw] = useState(false);

  return (
    <ToolShell>
      <HostForm value={host} onChange={setHost} onSubmit={() => run({ host })} busy={busy} />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {data && (
        <ResultPanel title={data.host}>
          {data.available ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Bu alan adı kayıtlı görünmüyor — müsait olabilir.
            </p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <Stat label="Kayıt firması" value={data.registrar ?? 'Bilinmiyor'} />
                <Stat label="Kayıt tarihi" value={formatDate(data.created)} />
                <Stat label="Son güncelleme" value={formatDate(data.updated)} />
                <Stat label="Bitiş tarihi" value={formatDate(data.expires)} />
              </div>

              {data.nameServers.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Ad sunucuları
                  </p>
                  <ul className="mt-2 space-y-1 font-mono text-[13px]">
                    {data.nameServers.map((ns) => (
                      <li key={ns}>{ns}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.status.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.status.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-[var(--border)] px-2.5 py-1 font-mono text-[11px] text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}>
              {showRaw ? 'Ham kaydı gizle' : 'Ham WHOIS kaydını göster'}
            </Button>
            <CopyButton value={data.raw} label="Ham kaydı kopyala" />
          </div>
          {showRaw && (
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--border)] p-3 font-mono text-[12px] leading-relaxed">
              {data.raw}
            </pre>
          )}
        </ResultPanel>
      )}
      {privacyNote}
    </ToolShell>
  );
}

function formatDate(value: string | null) {
  if (!value) return 'Bilinmiyor';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('tr-TR', { dateStyle: 'long' });
}

/* ═══════════════════════════ IP ═══════════════════════════ */

interface IpResult {
  query: string;
  country: string;
  countryCode: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  reverse: string;
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
}

export function IpLookup() {
  const [host, setHost] = useState('');
  const { data, error, busy, run } = useNetAction<IpResult>('ip');

  return (
    <ToolShell>
      <HostForm
        value={host}
        onChange={setHost}
        onSubmit={() => run({ host })}
        busy={busy}
        label="IP adresi veya alan adı"
        placeholder="8.8.8.8 veya ornek.com"
      />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {data && (
        <ResultPanel title={data.query}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Ülke" value={`${data.country} (${data.countryCode})`} />
            <Stat label="Şehir" value={[data.city, data.regionName].filter(Boolean).join(', ') || '—'} />
            <Stat label="Servis sağlayıcı" value={data.isp || '—'} />
            <Stat label="Kuruluş" value={data.org || '—'} />
            <Stat label="AS numarası" value={data.as || '—'} />
            <Stat label="Saat dilimi" value={data.timezone || '—'} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {data.hosting && <Tag tone="info">Veri merkezi / hosting</Tag>}
            {data.proxy && <Tag tone="warn">Proxy veya VPN</Tag>}
            {data.mobile && <Tag tone="info">Mobil ağ</Tag>}
          </div>

          {data.lat != null && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lon}#map=10/${data.lat}/${data.lon}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-4 inline-block text-sm font-semibold text-brand-500"
            >
              Haritada gör →
            </a>
          )}
          <p className="mt-3 text-xs text-muted">
            Konum bilgisi yaklaşıktır ve IP bloğunun kayıtlı olduğu bölgeyi gösterir; kullanıcının
            fiziksel adresi değildir.
          </p>
        </ResultPanel>
      )}
      {privacyNote}
    </ToolShell>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: 'info' | 'warn' | 'ok' | 'bad' }) {
  const styles = {
    info: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
    warn: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
    ok: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
    bad: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
  }[tone];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{children}</span>;
}

/* ═══════════════════════════ SSL ═══════════════════════════ */

interface SslResult {
  host: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysLeft: number;
  expired: boolean;
  authorized: boolean;
  authorizationError: string | null;
  protocol: string | null;
  altNames: string[];
  serialNumber: string;
}

export function SslChecker() {
  const [host, setHost] = useState('');
  const { data, error, busy, run } = useNetAction<SslResult>('ssl');

  return (
    <ToolShell>
      <HostForm value={host} onChange={setHost} onSubmit={() => run({ host })} busy={busy} cta="Kontrol et" />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {data && (
        <ResultPanel title={data.host}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {data.expired ? (
              <Tag tone="bad">Sertifikanın süresi dolmuş</Tag>
            ) : data.daysLeft < 15 ? (
              <Tag tone="warn">{data.daysLeft} gün içinde doluyor</Tag>
            ) : (
              <Tag tone="ok">Geçerli — {data.daysLeft} gün kaldı</Tag>
            )}
            {data.authorized ? <Tag tone="ok">Zincir doğrulandı</Tag> : <Tag tone="bad">Zincir doğrulanamadı</Tag>}
            {data.protocol && <Tag tone="info">{data.protocol}</Tag>}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Sertifika sahibi" value={data.subject} />
            <Stat label="Veren kurum" value={data.issuer} />
            <Stat label="Başlangıç" value={formatDate(data.validFrom)} />
            <Stat label="Bitiş" value={formatDate(data.validTo)} />
          </div>

          {!data.authorized && data.authorizationError && (
            <div className="mt-4">
              <ErrorNote>Doğrulama hatası: {data.authorizationError}</ErrorNote>
            </div>
          )}

          {data.altNames.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Kapsanan alan adları
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.altNames.map((n) => (
                  <span key={n} className="rounded-md border border-[var(--border)] px-2 py-1 font-mono text-[11px]">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </ResultPanel>
      )}
      {privacyNote}
    </ToolShell>
  );
}

/* ═══════════════════════════ ping ═══════════════════════════ */

interface PingResult {
  host: string;
  samples: Array<number | null>;
  min: number;
  max: number;
  avg: number;
  loss: number;
}

export function PingTest() {
  const [host, setHost] = useState('');
  const { data, error, busy, run } = useNetAction<PingResult>('ping');

  return (
    <ToolShell>
      <HostForm value={host} onChange={setHost} onSubmit={() => run({ host })} busy={busy} cta="Test et" />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {data && (
        <ResultPanel title={data.host}>
          <div className="grid gap-2 sm:grid-cols-4">
            <Stat label="Ortalama" value={`${data.avg} ms`} />
            <Stat label="En düşük" value={`${data.min} ms`} />
            <Stat label="En yüksek" value={`${data.max} ms`} />
            <Stat label="Kayıp" value={`%${data.loss}`} />
          </div>
          <div className="mt-4 flex items-end gap-2">
            {data.samples.map((s, i) => (
              <div key={i} className="flex-1 text-center">
                <div
                  className={`rounded-t ${s === null ? 'bg-rose-500/60' : 'bg-gradient-to-t from-brand-600 to-violet-500'}`}
                  style={{ height: `${Math.min(((s ?? data.max) / (data.max || 1)) * 80 + 8, 88)}px` }}
                />
                <span className="mt-1 block text-[11px] text-muted">{s === null ? '—' : `${s}ms`}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Ölçüm, sunucunun 443 (veya 80) portuna TCP bağlantısı kurma süresidir. Klasik ICMP
            ping’ten farklı olarak bazı güvenlik duvarlarını atlar ve gerçek uygulama gecikmesine
            daha yakın bir değer verir. Süre, sunucumuzun bulunduğu konumdan ölçülür.
          </p>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ port ═══════════════════════════ */

const COMMON_PORTS = [
  ['HTTP', 80], ['HTTPS', 443], ['SSH', 22], ['FTP', 21],
  ['SMTP', 25], ['MySQL', 3306], ['PostgreSQL', 5432], ['RDP', 3389],
] as const;

interface PortResult {
  host: string;
  port: number;
  open: boolean;
  ms?: number;
  reason?: string;
}

export function PortChecker() {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('443');
  const { data, error, busy, run } = useNetAction<PortResult>('port');

  return (
    <ToolShell>
      <HostForm
        value={host}
        onChange={setHost}
        onSubmit={() => run({ host, port: Number(port) })}
        busy={busy}
        label="Sunucu adresi"
        cta="Portu test et"
        extra={
          <Field label="Port">
            <TextInput
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="sm:w-32"
            />
          </Field>
        }
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {COMMON_PORTS.map(([label, p]) => (
          <button
            key={p}
            onClick={() => setPort(String(p))}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              port === String(p)
                ? 'bg-brand-600 text-white'
                : 'border border-[var(--border)] text-muted hover:border-brand-400'
            }`}
          >
            {label} · {p}
          </button>
        ))}
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {data && (
        <ResultPanel title={`${data.host}:${data.port}`}>
          {data.open ? (
            <p className="flex items-center gap-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" /> Port açık ({data.ms} ms)
            </p>
          ) : (
            <p className="flex items-center gap-2 text-lg font-bold text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" /> Port kapalı — {data.reason}
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Test, sunucumuzdan dışarı doğru yapılır: sonuç portun <strong>internete açık</strong>{' '}
            olup olmadığını gösterir. Yalnızca yönetim yetkiniz olan sunucularda kullanın.
          </p>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ status ═══════════════════════════ */

interface StatusResult {
  host: string;
  ok: boolean;
  status: number;
  statusText: string;
  ms: number;
  finalUrl: string;
  server: string | null;
  contentType: string | null;
  scheme: string;
}

export function WebsiteStatusChecker() {
  const [host, setHost] = useState('');
  const { data, error, busy, run } = useNetAction<StatusResult>('status');

  return (
    <ToolShell>
      <HostForm
        value={host}
        onChange={setHost}
        onSubmit={() => run({ host })}
        busy={busy}
        label="Site adresi"
        cta="Durumu kontrol et"
      />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {data && (
        <ResultPanel title={data.host}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {data.ok ? <Tag tone="ok">Site ayakta</Tag> : <Tag tone="warn">Yanıt verdi ama hata döndü</Tag>}
            <Tag tone="info">HTTP {data.status}</Tag>
            <Tag tone={data.ms < 500 ? 'ok' : data.ms < 1500 ? 'warn' : 'bad'}>{data.ms} ms</Tag>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Durum" value={`${data.status} ${data.statusText}`} />
            <Stat label="Yanıt süresi" value={`${data.ms} ms`} />
            <Stat label="Son adres" value={data.finalUrl} />
            <Stat label="Sunucu" value={data.server ?? 'Belirtilmemiş'} />
          </div>
        </ResultPanel>
      )}
    </ToolShell>
  );
}

/* ═══════════════════════════ canonical ═══════════════════════════ */

interface CanonicalResult {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  canonical: string | null;
  selfReferencing: boolean;
  canonicalCount: number;
  title: string | null;
  description: string | null;
  robots: string | null;
  ogUrl: string | null;
  issues: Array<{ level: 'error' | 'warn' | 'ok'; text: string }>;
}

export function CanonicalChecker() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState<CanonicalResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(NET_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'canonical', url }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Kontrol başarısız oldu.');
        return;
      }
      setData(json);
    } catch {
      setError('Sunucuya ulaşılamadı.');
    } finally {
      setBusy(false);
    }
  }

  const icons = {
    error: <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />,
    warn: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />,
    ok: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />,
  };

  return (
    <ToolShell>
      <HostForm
        value={url}
        onChange={setUrl}
        onSubmit={check}
        busy={busy}
        label="Sayfa adresi"
        placeholder="https://ornek.com/blog/yazi"
        cta="Kontrol et"
      />
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {data && (
        <ResultPanel title="Canonical raporu">
          <ul className="space-y-2">
            {data.issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                {icons[issue.level]}
                <span className={issue.level === 'ok' ? '' : 'text-muted'}>{issue.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Stat label="İstenen adres" value={data.requestedUrl} />
            <Stat label="Ulaşılan adres" value={data.finalUrl} />
            <Stat label="Canonical" value={data.canonical ?? 'Yok'} />
            <Stat label="HTTP durumu" value={String(data.status)} />
            <Stat label="Robots" value={data.robots ?? 'Belirtilmemiş'} />
            <Stat label="og:url" value={data.ogUrl ?? 'Yok'} />
          </div>

          {(data.title || data.description) && (
            <div className="mt-4 rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs text-muted">Sayfa meta bilgileri</p>
              <p className="mt-2 font-semibold">{data.title ?? '(başlık yok)'}</p>
              <p className="mt-1 text-sm text-muted">{data.description ?? '(açıklama yok)'}</p>
            </div>
          )}
        </ResultPanel>
      )}
      {privacyNote}
    </ToolShell>
  );
}

/* ═══════════════════════════ screenshot ═══════════════════════════ */

export function WebsiteScreenshot() {
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState('desktop');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (image) URL.revokeObjectURL(image); }, [image]);

  async function capture() {
    setBusy(true);
    setError('');
    setImage('');
    try {
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, device }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Ekran görüntüsü alınamadı.');
        return;
      }
      setImage(URL.createObjectURL(await res.blob()));
    } catch {
      setError('Sunucuya ulaşılamadı.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell>
      <HostForm
        value={url}
        onChange={setUrl}
        onSubmit={capture}
        busy={busy}
        label="Site adresi"
        placeholder="https://ornek.com"
        cta="Görüntü al"
        extra={
          <Field label="Cihaz">
            <Select value={device} onChange={(e) => setDevice(e.target.value)} className="sm:w-44">
              <option value="desktop">Masaüstü — 1440×900</option>
              <option value="mobile">Mobil — 390×844</option>
            </Select>
          </Field>
        }
      />

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {image && (
        <ResultPanel
          title="Ekran görüntüsü"
          actions={
            <Button
              onClick={() => {
                const a = document.createElement('a');
                a.href = image;
                a.download = 'ekran-goruntusu.png';
                a.click();
              }}
            >
              PNG indir
            </Button>
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Site ekran görüntüsü" className="w-full rounded-xl border border-[var(--border)]" />
        </ResultPanel>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Ekran görüntüsü alma başsız tarayıcı gerektirir. Kendi kurulumunuzda bu aracı etkinleştirmek
        için sunucu ortamına <code className="font-mono">SCREENSHOT_API_URL</code> değişkenini
        tanımlayın (<code className="font-mono">{'{url}'}</code>,{' '}
        <code className="font-mono">{'{width}'}</code> ve{' '}
        <code className="font-mono">{'{height}'}</code> yer tutucularıyla).
      </p>
    </ToolShell>
  );
}

/* ═══════════════════════════ currency ═══════════════════════════ */

const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'RUB', 'SEK', 'AED'];

export function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('TRY');
  const [rate, setRate] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (from === to) {
      setRate(1);
      setError('');
      return;
    }
    setBusy(true);
    setError('');
    // Frankfurter is a free, key-less ECB rate feed — queried straight from the browser.
    fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d) => {
        if (cancelled) return;
        const value = d?.rates?.[to];
        if (typeof value !== 'number') throw new Error();
        setRate(value);
        setDate(d.date ?? '');
      })
      .catch(() => {
        if (!cancelled) {
          setRate(null);
          setError('Güncel kur alınamadı. Birkaç saniye sonra tekrar deneyin.');
        }
      })
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const result = useMemo(() => {
    const n = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(n) || rate === null) return null;
    return n * rate;
  }, [amount, rate]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <ToolShell>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Field label="Tutar">
          <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Kaynak">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Hedef">
          <Select value={to} onChange={(e) => setTo(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-3">
        <Button variant="ghost" onClick={swap}>
          ⇄ Para birimlerini değiştir
        </Button>
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {busy && <div className="skeleton mt-5 h-20 rounded-xl" />}

      {!busy && result !== null && (
        <ResultPanel
          title="Dönüşüm"
          actions={<CopyButton value={result.toFixed(2)} />}
        >
          <p className="text-3xl font-extrabold">
            {result.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}{' '}
            <span className="text-lg text-muted">{to}</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            1 {from} = {rate?.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} {to}
            {date && ` · ${new Date(date).toLocaleDateString('tr-TR', { dateStyle: 'long' })} kurları`}
          </p>
          <p className="mt-3 text-xs text-muted">
            Kurlar Avrupa Merkez Bankası referans verilerinden alınır, iş günlerinde günde bir kez
            güncellenir ve bilgilendirme amaçlıdır. Gerçek işlem kurları bankanıza göre değişir.
          </p>
        </ResultPanel>
      )}
    </ToolShell>
  );
}
