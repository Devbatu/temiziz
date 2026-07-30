#!/usr/bin/env node
/**
 * Sitenin ilk blog yazilarini (lib/blog.ts) JSON'a aktarir.
 * Bu JSON bir kez veritabanina yuklenir; sonrasinda tum yazilar panelden
 * yonetilir ve lib/blog.ts artik kullanilmaz.
 */
import fs from 'node:fs';

const { posts } = await import('../lib/blog.ts');

const out = posts.map((p) => ({
  slug: p.slug,
  title: p.title,
  category: p.category,
  excerpt: p.excerpt,
  body: p.body,
  date: p.date,
  reading_time: p.readingTime,
  tools: p.tools.join(','),
}));

fs.writeFileSync('server/seed-posts.json', JSON.stringify(out, null, 2), 'utf8');
console.log(`server/seed-posts.json yazildi: ${out.length} yazi`);
