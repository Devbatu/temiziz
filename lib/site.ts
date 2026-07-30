export const site = {
  name: 'MultiTools',
  tagline: 'Tek platformda yüzlerce online araç',
  description:
    'PDF, görsel, yapay zekâ, SEO, geliştirici ve günlük hayat araçları tek bir yerde. Kurulum yok, üyelik yok, saniyeler içinde sonuç.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://celaning.com',
  locale: 'tr_TR',
  twitter: '@multitools',
} as const;

/**
 * Mutlak URL üretir ve sondaki eğik çizgiyi kanonik biçime getirir.
 *
 * Site `trailingSlash: true` ile yayınlandığı için gerçek adres
 * `/tools/merge-pdf/` şeklindedir. Sitemap ve JSON-LD içinde eğik çizgisiz
 * biçim kullanılırsa arama motoru 301 yönlendirmesine düşer: tarama bütçesi
 * boşa gider ve canonical etiketiyle çelişen bir sinyal oluşur.
 *
 * `/sitemap.xml` gibi dosya adlarına (son parçada nokta varsa) eğik çizgi
 * eklenmez.
 */
export function absoluteUrl(path = '/') {
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  const [pathname, rest = ''] = withLeading.split(/(?=[?#])/, 2);

  const lastSegment = pathname.split('/').pop() ?? '';
  const isFile = lastSegment.includes('.');
  const normalised = isFile || pathname.endsWith('/') ? pathname : `${pathname}/`;

  return `${site.url}${normalised}${rest}`;
}
