import { adsense } from '@/lib/monetization';

/**
 * Authorized Digital Sellers file. Google will not serve ads on the domain
 * until this resolves with the publisher's own ca-pub id.
 */
export function GET() {
  const lines: string[] = [];

  if (adsense.enabled) {
    lines.push(`google.com, ${adsense.client.replace('ca-pub-', 'pub-')}, DIRECT, f08c47fec0942fa0`);
  }

  // Extra sellers (ad networks, exchanges) — one entry per line.
  const extra = process.env.ADS_TXT_EXTRA;
  if (extra) lines.push(...extra.split('\n').map((l) => l.trim()).filter(Boolean));

  return new Response(lines.join('\n') + '\n', {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
