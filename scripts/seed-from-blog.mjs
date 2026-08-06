#!/usr/bin/env node
/**
 * `lib/blog.ts` içindeki yazılardan `server/seed-posts.json` üretir.
 *
 * Yazıların iki kopyası var: Next tarafındaki tipli liste ve PHP'nin
 * veritabanına yüklediği JSON. İkisini elle güncellemek kaçınılmaz olarak
 * birbirinden ayrışmalarına yol açıyordu — sitede bir metin, panelde başka bir
 * metin görünüyordu. Tek yazı kaynağı `lib/blog.ts`; bu script türetmeyi yapar.
 *
 * Kullanım:  node scripts/seed-from-blog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const src = path.join(root, 'lib/blog.ts');
const dest = path.join(root, 'server/seed-posts.json');

// TypeScript'i derlemeden okuyabilmek için tip anotasyonlarını söküp geçici bir
// ESM modülü olarak içe aktarıyoruz. Dosya düz veri tuttuğu için bu yeterli.
const ts = fs.readFileSync(src, 'utf8');
const js = ts
  .replace(/export interface Post \{[\s\S]*?\n\}\n/, '')
  .replace(/: Post\[\]/, '')
  .replace(/export function[\s\S]*$/, '')
  .replace(/export const postMap[\s\S]*$/, '');

const tmp = path.join(root, '.blog-seed.mjs');
fs.writeFileSync(tmp, js);

let posts;
try {
  ({ posts } = await import(pathToFileURL(tmp).href));
} finally {
  fs.rmSync(tmp, { force: true });
}

const seed = posts.map((p) => ({
  slug: p.slug,
  title: p.title,
  category: p.category,
  excerpt: p.excerpt,
  body: p.body,
  date: p.date,
  reading_time: p.readingTime,
  tools: p.tools.join(','),
}));

fs.writeFileSync(dest, JSON.stringify(seed, null, 2) + '\n');

const kelime = seed.reduce((n, p) => n + p.body.split(/\s+/).length, 0);
console.log(`✓ ${seed.length} yazı yazıldı → server/seed-posts.json`);
console.log(`  toplam ${kelime} kelime, ortalama ${Math.round(kelime / seed.length)} kelime/yazı`);
