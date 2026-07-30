import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Screenshots need a headless browser, which we don't run in-process.
 * Point SCREENSHOT_API_URL at any provider that returns an image for a URL,
 * using {url} and {width}/{height} placeholders, e.g.
 *   https://shot.example.com/take?url={url}&w={width}&h={height}&key=xxx
 */
export async function POST(request: Request) {
  const template = process.env.SCREENSHOT_API_URL;

  let body: { url?: string; device?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  let target = String(body.url ?? '').trim();
  if (!target) return NextResponse.json({ error: 'Bir adres girin.' }, { status: 400 });
  if (!/^https?:\/\//i.test(target)) target = `https://${target}`;

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: 'Geçerli bir URL girin.' }, { status: 400 });
  }
  if (/^(localhost|127\.|10\.|192\.168\.)/.test(parsed.hostname)) {
    return NextResponse.json({ error: 'Yerel adresler görüntülenemez.' }, { status: 400 });
  }

  const [width, height] = body.device === 'mobile' ? [390, 844] : [1440, 900];

  if (!template) {
    return NextResponse.json(
      {
        error:
          'Ekran görüntüsü servisi yapılandırılmamış. Sunucu ortamında SCREENSHOT_API_URL tanımlanmalı.',
        code: 'not_configured',
      },
      { status: 503 },
    );
  }

  const endpoint = template
    .replace('{url}', encodeURIComponent(parsed.toString()))
    .replace('{width}', String(width))
    .replace('{height}', String(height));

  try {
    const res = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(String(res.status));
    const contentType = res.headers.get('content-type') ?? 'image/png';
    if (!contentType.startsWith('image/')) throw new Error('not an image');
    return new NextResponse(await res.arrayBuffer(), {
      headers: { 'content-type': contentType, 'cache-control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Ekran görüntüsü alınamadı. Adresi kontrol edip tekrar deneyin.' },
      { status: 502 },
    );
  }
}
