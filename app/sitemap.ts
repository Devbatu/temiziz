import type { MetadataRoute } from 'next';
import { tools } from '@/lib/tools';
import { categories } from '@/lib/categories';
import { absoluteUrl } from '@/lib/site';

// Derleme anında bir kez üretilir — statik dışa aktarım için gerekli.
export const dynamic = 'force-static';

/** Regenerated automatically from the tool/category/post registries. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Blog YAZILARI burada yok: onlar veritabaninda yasiyor ve PHP tarafindan
  // uretilen sitemap-blog.xml icinde listeleniyor (robots.txt ikisini de bildirir).
  const staticPages = ['/', '/tools', '/blog', '/pricing', '/api', '/about', '/contact', '/privacy', '/terms'].map(
    (path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '/' ? 1 : 0.6,
    }),
  );

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...tools.map((t) => ({
      url: absoluteUrl(`/tools/${t.slug}`),
      lastModified: new Date(t.added),
      changeFrequency: 'monthly' as const,
      priority: t.popularity >= 85 ? 0.9 : 0.7,
    })),
  ];
}
