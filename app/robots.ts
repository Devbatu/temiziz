import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

// Derleme anında bir kez üretilir — statik dışa aktarım için gerekli.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    // /api tanıtım sayfasıdır ve indekslenmelidir; engellenenler yalnızca
    // sunucu uç noktaları ve yönetim paneli.
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/net', '/api/ai', '/api/screenshot', '/api/seo'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
