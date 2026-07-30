import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Fetches a page server-side (CORS makes this impossible from the browser) and audits its canonical setup. */
export async function POST(request: Request) {
  let url: string;
  try {
    const body = await request.json();
    url = String(body.url ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Geçerli bir URL girin.' }, { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol) || /^(localhost|127\.|0\.|10\.|192\.168\.)/.test(target.hostname)) {
    return NextResponse.json({ error: 'Yalnızca herkese açık http/https adresleri kontrol edilebilir.' }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'user-agent': 'MultiTools-CanonicalChecker/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    const html = (await res.text()).slice(0, 400_000);

    const head = /<head[\s\S]*?<\/head>/i.exec(html)?.[0] ?? html;
    const attr = (tag: string, re: RegExp) => re.exec(tag)?.[1]?.trim() ?? null;

    const canonicalTag = /<link[^>]+rel=["']?canonical["']?[^>]*>/i.exec(head)?.[0] ?? null;
    const canonical = canonicalTag ? attr(canonicalTag, /href=["']([^"']+)["']/i) : null;

    const metaContent = (name: string) =>
      new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i').exec(head)?.[1] ??
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`, 'i').exec(head)?.[1] ??
      null;

    const resolved = canonical ? new URL(canonical, res.url).toString() : null;
    const selfReferencing = resolved !== null && normalise(resolved) === normalise(res.url);

    const issues: Array<{ level: 'error' | 'warn' | 'ok'; text: string }> = [];
    if (!resolved) {
      issues.push({ level: 'error', text: 'Sayfada canonical etiketi bulunamadı.' });
    } else if (selfReferencing) {
      issues.push({ level: 'ok', text: 'Canonical kendine işaret ediyor (self-referencing) — doğru yapılandırma.' });
    } else {
      issues.push({
        level: 'warn',
        text: `Canonical farklı bir adrese işaret ediyor: ${resolved}. Bu sayfanın indekslenmesini engelleyebilir.`,
      });
    }

    const canonicalCount = (head.match(/rel=["']?canonical/gi) ?? []).length;
    if (canonicalCount > 1) {
      issues.push({ level: 'error', text: `${canonicalCount} adet canonical etiketi var. Yalnızca bir tane olmalı.` });
    }
    if (resolved && !/^https:/i.test(resolved)) {
      issues.push({ level: 'warn', text: 'Canonical HTTPS değil. HTTPS sürümüne işaret etmeli.' });
    }
    if (res.url !== target.toString()) {
      issues.push({ level: 'warn', text: `İstek yönlendirildi: ${target.toString()} → ${res.url}` });
    }

    const robots = metaContent('robots');
    if (robots && /noindex/i.test(robots)) {
      issues.push({ level: 'error', text: 'Sayfada noindex var — arama motorları bu sayfayı indekslemez.' });
    }

    return NextResponse.json({
      requestedUrl: target.toString(),
      finalUrl: res.url,
      status: res.status,
      canonical: resolved,
      canonicalRaw: canonical,
      selfReferencing,
      canonicalCount,
      title: /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1]?.trim() ?? null,
      description: metaContent('description'),
      robots,
      ogUrl: metaContent('og:url'),
      issues,
    });
  } catch (e) {
    const msg = (e as Error).name === 'TimeoutError'
      ? 'Sayfa 12 saniye içinde yanıt vermedi.'
      : 'Sayfaya ulaşılamadı. Adresi kontrol edip tekrar deneyin.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

function normalise(u: string) {
  try {
    const url = new URL(u);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/$/, '')}`.toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}
