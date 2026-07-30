/**
 * Statik dışa aktarımda (paylaşımlı hosting) sunucu rotaları bulunmaz.
 * Bu bayrak derleme anında paketlenir; sunucu gerektiren araçlar bozuk bir
 * form yerine ne yapılması gerektiğini anlatan bir panel gösterir.
 */
export const isStaticBuild = process.env.NEXT_PUBLIC_STATIC_MODE === '1';

/** Bir Next.js sunucusu olmadan çalışamayan araçlar. */
export const serverTools = new Set([
  // /api/net
  'whois-lookup',
  'ip-lookup',
  'ssl-checker',
  'ping-test',
  'port-checker',
  'website-status-checker',
  // /api/seo/canonical
  'canonical-checker',
  // /api/screenshot
  'website-screenshot',
  // /api/ai
  'ai-resume-builder',
  'ai-cover-letter',
  'ai-email-generator',
  'ai-blog-writer',
  'ai-caption-generator',
  'ai-product-description',
  'ai-prompt-generator',
  'ai-rewrite-tool',
  'ai-hashtag-generator',
  'ai-title-generator',
]);

export function needsServer(slug: string) {
  return isStaticBuild && serverTools.has(slug);
}
