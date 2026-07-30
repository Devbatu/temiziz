import { NextResponse } from 'next/server';
import net from 'node:net';
import tls from 'node:tls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOST_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;
const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]+$/i;

/** Blocks loopback / link-local / RFC1918 targets so the tools cannot be used to probe our own network. */
function isPrivate(host: string) {
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function cleanHost(input: unknown) {
  const raw = String(input ?? '')
    .trim()
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .toLowerCase();
  if (!raw) throw new Error('Alan adı veya IP adresi girin.');
  if (!HOST_RE.test(raw) && !IP_RE.test(raw)) throw new Error('Geçerli bir alan adı veya IP girin.');
  if (isPrivate(raw)) throw new Error('Yerel ve özel ağ adresleri sorgulanamaz.');
  return raw;
}

export async function POST(request: Request) {
  let body: { action?: string; host?: string; port?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  try {
    const host = cleanHost(body.host);
    switch (body.action) {
      case 'whois':
        return NextResponse.json(await whois(host));
      case 'ip':
        return NextResponse.json(await ipInfo(host));
      case 'ssl':
        return NextResponse.json(await sslInfo(host));
      case 'ping':
        return NextResponse.json(await ping(host));
      case 'port':
        return NextResponse.json(await portCheck(host, Number(body.port)));
      case 'status':
        return NextResponse.json(await statusCheck(host));
      default:
        return NextResponse.json({ error: 'Bilinmeyen işlem.' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

/* ─────────────────────────────── WHOIS ─────────────────────────────── */

const WHOIS_SERVERS: Record<string, string> = {
  com: 'whois.verisign-grs.com',
  net: 'whois.verisign-grs.com',
  org: 'whois.pir.org',
  io: 'whois.nic.io',
  dev: 'whois.nic.google',
  app: 'whois.nic.google',
  co: 'whois.nic.co',
  tr: 'whois.nic.tr',
  info: 'whois.afilias.net',
  biz: 'whois.nic.biz',
  me: 'whois.nic.me',
  xyz: 'whois.nic.xyz',
};

function whoisQuery(server: string, query: string, timeout = 8000) {
  return new Promise<string>((resolve, reject) => {
    const socket = net.createConnection({ host: server, port: 43, timeout });
    let data = '';
    socket.on('connect', () => socket.write(`${query}\r\n`));
    socket.on('data', (chunk) => (data += chunk.toString('utf8')));
    socket.on('end', () => resolve(data));
    socket.on('timeout', () => (socket.destroy(), reject(new Error('WHOIS sunucusu yanıt vermedi.'))));
    socket.on('error', () => reject(new Error('WHOIS sunucusuna bağlanılamadı.')));
  });
}

async function whois(host: string) {
  const tld = host.split('.').pop()!;
  const server = WHOIS_SERVERS[tld];
  if (!server) {
    throw new Error(`.${tld} uzantısı için WHOIS sunucusu tanımlı değil. Yaygın uzantıları deneyin.`);
  }

  let raw = await whoisQuery(server, host);

  // Thin registries (.com/.net) only point at the registrar — follow the referral.
  const referral = /Registrar WHOIS Server:\s*(\S+)/i.exec(raw)?.[1];
  if (referral && !referral.includes(server)) {
    try {
      const detailed = await whoisQuery(referral, host);
      if (detailed.length > raw.length / 2) raw = detailed;
    } catch {
      /* referral unreachable — the thin record is still useful */
    }
  }

  const field = (...names: string[]) => {
    for (const name of names) {
      const m = new RegExp(`^\\s*${name}\\s*:\\s*(.+)$`, 'im').exec(raw);
      if (m) return m[1].trim();
    }
    return null;
  };

  const nameServers = [...raw.matchAll(/^\s*(?:Name Server|nserver)\s*:\s*(.+)$/gim)]
    .map((m) => m[1].trim().toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i);

  const available = /no match|not found|no data found|no entries found/i.test(raw);

  return {
    host,
    available,
    registrar: field('Registrar', 'Sponsoring Registrar'),
    created: field('Creation Date', 'Created Date', 'created', 'Domain Registration Date'),
    updated: field('Updated Date', 'Last Modified'),
    expires: field('Registry Expiry Date', 'Expiry Date', 'Expiration Date', 'Domain Expiration Date'),
    status: [...raw.matchAll(/^\s*(?:Domain Status|status)\s*:\s*(\S+)/gim)]
      .map((m) => m[1])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 6),
    nameServers,
    raw: raw.slice(0, 6000),
  };
}

/* ─────────────────────────────── IP ─────────────────────────────── */

async function ipInfo(host: string) {
  const res = await fetch(
    `http://ip-api.com/json/${encodeURIComponent(host)}?fields=status,message,query,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,mobile,proxy,hosting`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('IP servisi yanıt vermedi. Daha sonra tekrar deneyin.');
  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error(data.message === 'private range' ? 'Özel ağ adresi sorgulanamaz.' : 'IP bilgisi bulunamadı.');
  }
  return data;
}

/* ─────────────────────────────── SSL ─────────────────────────────── */

function sslInfo(host: string) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, timeout: 8000, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate(true);
        if (!cert || Object.keys(cert).length === 0) {
          socket.end();
          reject(new Error('Sertifika alınamadı.'));
          return;
        }
        const validTo = new Date(cert.valid_to);
        const daysLeft = Math.ceil((validTo.getTime() - Date.now()) / 86400000);
        resolve({
          host,
          subject: cert.subject?.CN ?? host,
          issuer: cert.issuer?.O ?? cert.issuer?.CN ?? 'Bilinmiyor',
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysLeft,
          expired: daysLeft <= 0,
          authorized: socket.authorized,
          authorizationError: socket.authorized ? null : String(socket.authorizationError ?? ''),
          protocol: socket.getProtocol(),
          altNames: (cert.subjectaltname ?? '')
            .split(',')
            .map((s: string) => s.replace('DNS:', '').trim())
            .filter(Boolean)
            .slice(0, 20),
          serialNumber: cert.serialNumber,
        });
        socket.end();
      },
    );
    socket.on('timeout', () => (socket.destroy(), reject(new Error('Sunucu 443 portunda yanıt vermedi.'))));
    socket.on('error', () => reject(new Error('HTTPS bağlantısı kurulamadı. Alan adını kontrol edin.')));
  });
}

/* ─────────────────────────────── ping / port ─────────────────────────────── */

function tcpProbe(host: string, port: number, timeout = 5000) {
  return new Promise<number>((resolve, reject) => {
    const started = performance.now();
    const socket = net.createConnection({ host, port, timeout });
    socket.on('connect', () => {
      const ms = performance.now() - started;
      socket.destroy();
      resolve(ms);
    });
    socket.on('timeout', () => (socket.destroy(), reject(new Error('timeout'))));
    socket.on('error', () => (socket.destroy(), reject(new Error('refused'))));
  });
}

async function ping(host: string) {
  const results: Array<number | null> = [];
  for (let i = 0; i < 4; i++) {
    try {
      results.push(await tcpProbe(host, 443));
    } catch {
      try {
        results.push(await tcpProbe(host, 80));
      } catch {
        results.push(null);
      }
    }
  }
  const ok = results.filter((r): r is number => r !== null);
  if (ok.length === 0) throw new Error('Sunucuya 80 veya 443 portundan ulaşılamadı.');
  return {
    host,
    samples: results.map((r) => (r === null ? null : Math.round(r))),
    min: Math.round(Math.min(...ok)),
    max: Math.round(Math.max(...ok)),
    avg: Math.round(ok.reduce((a, b) => a + b, 0) / ok.length),
    loss: Math.round(((results.length - ok.length) / results.length) * 100),
  };
}

async function portCheck(host: string, port: number) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Port numarası 1 ile 65535 arasında olmalıdır.');
  }
  try {
    const ms = await tcpProbe(host, port, 6000);
    return { host, port, open: true, ms: Math.round(ms) };
  } catch (e) {
    return {
      host,
      port,
      open: false,
      reason: (e as Error).message === 'timeout' ? 'Zaman aşımı (filtrelenmiş olabilir)' : 'Bağlantı reddedildi',
    };
  }
}

/* ─────────────────────────────── status ─────────────────────────────── */

async function statusCheck(host: string) {
  const attempts: Array<Record<string, unknown>> = [];
  for (const scheme of ['https', 'http'] as const) {
    const started = performance.now();
    try {
      const res = await fetch(`${scheme}://${host}/`, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
        headers: { 'user-agent': 'MultiTools-StatusChecker/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      attempts.push({
        scheme,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        ms: Math.round(performance.now() - started),
        finalUrl: res.url,
        server: res.headers.get('server'),
        contentType: res.headers.get('content-type'),
      });
      break;
    } catch {
      attempts.push({ scheme, ok: false, error: 'Bağlanılamadı' });
    }
  }
  const best = attempts.find((a) => a.ok) ?? attempts[attempts.length - 1];
  if (!best?.ok && attempts.every((a) => !a.ok)) {
    throw new Error('Siteye ulaşılamadı. Alan adı yanlış olabilir veya sunucu kapalı olabilir.');
  }
  return { host, ...best, attempts };
}
