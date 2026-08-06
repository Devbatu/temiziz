/**
 * Statik dışa aktarımda (paylaşımlı hosting) sunucu rotaları bulunmaz.
 * Bu bayrak derleme anında paketlenir; sunucu gerektiren araçlar bozuk bir
 * form yerine ne yapılması gerektiğini anlatan bir panel gösterir.
 */
export const isStaticBuild = process.env.NEXT_PUBLIC_STATIC_MODE === '1';

/**
 * Bir Next.js sunucusu olmadan calisamayan araclar.
 *
 * Ag ve SEO araclari artik ayni sunucudaki PHP ucuyla (mt/net.php) calisiyor,
 * bu yuzden listeden cikarildi. Geriye yalnizca ekran goruntusu araci kaliyor:
 * o bir headless tarayici gerektiriyor ve paylasimli hostingde calistirilamaz.
 */
export const serverTools = new Set([
  'website-screenshot',
]);

export function needsServer(slug: string) {
  return isStaticBuild && serverTools.has(slug);
}
