import type { Tool, FaqItem } from './tools';
import { categoryMap } from './categories';
import { absoluteUrl, site } from './site';

/** Meta description, capped near the 160-character sweet spot. */
export function toolMetaDescription(tool: Tool) {
  const base = `${tool.name}: ${tool.description} Ücretsiz, üyeliksiz ve tarayıcınızda çalışır.`;
  return base.length > 158 ? `${base.slice(0, 155).trimEnd()}…` : base;
}

export function toolTitle(tool: Tool) {
  return `${tool.name} — Ücretsiz Online Araç`;
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
  return [...(tool.faq ?? []), ...generic].slice(0, 5);
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
