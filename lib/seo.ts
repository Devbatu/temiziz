import type { Tool, FaqItem } from './tools';
import { categoryMap } from './categories';
import { absoluteUrl, site } from './site';

/** Meta description, capped near the 160-character sweet spot. */
export function toolMetaDescription(tool: Tool) {
  const base = `${tool.name}: ${tool.description} Ücretsiz, üyeliksiz ve tarayıcınızda çalışır.`;
  return base.length > 158 ? `${base.slice(0, 155).trimEnd()}…` : base;
}


export function toolTitle(tool: Tool) {
  const BUTCE = 47;
  const uzun = `${tool.name} — Ücretsiz Online Araç`;
  if (uzun.length <= BUTCE) return uzun;
  const kisa = `${tool.name} — Online Araç`;
  if (kisa.length <= BUTCE) return kisa;
  return tool.name;
}

/**
 * Araca özgü kullanım adımları.
 *
 * Geri dönüş metni bilerek aracın adını ve ne ürettiğini içeriyor: aynı üç
 * cümlenin her sayfada birebir tekrarlanması hem okuyucuya bir şey anlatmıyor
 * hem de sayfaları birbirinin kopyası haline getiriyordu.
 */
export function toolSteps(tool: Tool): string[] {
  if (tool.steps?.length) return tool.steps;
  return [
    `${tool.name} alanına verinizi girin veya dosyanızı yükleyin.`,
    'Sunulan seçenekleri ihtiyacınıza göre ayarlayın.',
    'Sonucu kontrol edip kopyalayın ya da indirin.',
  ];
}

/** Tool-specific FAQ, falling back to sensible platform-wide answers. */
export function toolFaq(tool: Tool): FaqItem[] {
  const cat = categoryMap.get(tool.category)!;
  const generic: FaqItem[] = [
    {
      q: `${tool.name} ücretsiz mi?`,
      a: `Evet. ${tool.name} aracını sınırsız ve ücretsiz kullanabilirsiniz; hesap açmanız veya e-posta vermeniz gerekmez.`,
    },
    {
      q: 'Verilerim güvende mi?',
      a: 'Bu araç tarayıcınızda çalışır. Girdiğiniz veriler cihazınızda işlenir, sunucularımızda saklanmaz.',
    },
    {
      q: 'Mobil cihazda kullanabilir miyim?',
      a: 'Evet, araç telefon ve tablette masaüstüyle aynı şekilde çalışır; ayrı bir uygulama kurmanıza gerek yoktur.',
    },
    {
      q: `Benzer başka hangi araçlar var?`,
      a: `${cat.name} kategorisinde bu araca ek olarak birçok araç bulunur. Sayfanın alt bölümündeki “Benzer araçlar” listesinden ulaşabilirsiniz.`,
    },
  ];
  // Genel sorular yalnızca aracın kendi SSS'i üçe ulaşmıyorsa tamamlayıcı
  // olarak eklenir. Her sayfaya birebir aynı cevapları iliştirmek bölümü
  // uzatıyor ama sayfayı zenginleştirmiyor; sayfalar birbirinin kopyası oluyor.
  const own = tool.faq ?? [];
  if (own.length >= 3) return own.slice(0, 6);
  return [...own, ...generic].slice(0, 3);
}

export function toolJsonLd(tool: Tool) {
  const cat = categoryMap.get(tool.category)!;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: tool.name,
      url: absoluteUrl(`/tools/${tool.slug}`),
      description: toolMetaDescription(tool),
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
      publisher: { '@type': 'Organization', name: site.name, url: site.url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: site.url },
        { '@type': 'ListItem', position: 2, name: 'Araçlar', item: absoluteUrl('/tools') },
        {
          '@type': 'ListItem',
          position: 3,
          name: cat.name,
          item: absoluteUrl(`/category/${cat.slug}`),
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: tool.name,
          item: absoluteUrl(`/tools/${tool.slug}`),
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: toolFaq(tool).map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];
}
