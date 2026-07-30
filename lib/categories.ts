export type CategoryId =
  | 'pdf'
  | 'image'
  | 'ai'
  | 'seo'
  | 'developer'
  | 'utility'
  | 'website';

export interface Category {
  id: CategoryId;
  slug: string;
  name: string;
  short: string;
  description: string;
  /** Tailwind gradient stops used across cards, headers and icons. */
  gradient: string;
  accent: string;
  icon: string;
}

export const categories: Category[] = [
  {
    id: 'pdf',
    slug: 'pdf',
    name: 'PDF Araçları',
    short: 'PDF',
    description:
      'PDF birleştirme, bölme, sıkıştırma, dönüştürme ve koruma işlemlerini tarayıcıdan saniyeler içinde yapın.',
    gradient: 'from-rose-500 to-orange-500',
    accent: '#f43f5e',
    icon: 'FileText',
  },
  {
    id: 'image',
    slug: 'image',
    name: 'Görsel Araçları',
    short: 'Görsel',
    description:
      'Görsel sıkıştırma, boyutlandırma, format dönüştürme, kırpma ve düzenleme araçları.',
    gradient: 'from-violet-500 to-fuchsia-500',
    accent: '#8b5cf6',
    icon: 'Image',
  },
  {
    id: 'ai',
    slug: 'ai',
    name: 'Yapay Zekâ',
    short: 'AI',
    description:
      'Metin üretimi, yeniden yazma, başlık ve açıklama önerileri için yapay zekâ destekli araçlar.',
    gradient: 'from-sky-500 to-indigo-500',
    accent: '#0ea5e9',
    icon: 'Sparkles',
  },
  {
    id: 'seo',
    slug: 'seo',
    name: 'SEO Araçları',
    short: 'SEO',
    description:
      'Meta etiket, schema, sitemap ve içerik analizi araçlarıyla sitenizi arama motorlarına hazırlayın.',
    gradient: 'from-emerald-500 to-teal-500',
    accent: '#10b981',
    icon: 'TrendingUp',
  },
  {
    id: 'developer',
    slug: 'developer',
    name: 'Geliştirici',
    short: 'Kod',
    description:
      'JSON, XML, HTML, SQL biçimlendiriciler, minifier’lar, hash ve encode/decode araçları.',
    gradient: 'from-cyan-500 to-blue-500',
    accent: '#06b6d4',
    icon: 'Code2',
  },
  {
    id: 'utility',
    slug: 'utility',
    name: 'Günlük Araçlar',
    short: 'Pratik',
    description:
      'QR kod, parola üreteci, hesap makineleri, renk araçları ve zamanlayıcılar.',
    gradient: 'from-amber-500 to-yellow-500',
    accent: '#f59e0b',
    icon: 'Wrench',
  },
  {
    id: 'website',
    slug: 'website',
    name: 'Site & Alan Adı',
    short: 'Web',
    description:
      'WHOIS, DNS, IP, SSL ve erişilebilirlik kontrolleriyle alan adlarını ve sunucuları analiz edin.',
    gradient: 'from-slate-500 to-zinc-600',
    accent: '#64748b',
    icon: 'Globe',
  },
];

export const categoryMap = new Map(categories.map((c) => [c.id, c]));

export function getCategory(id: string) {
  return categories.find((c) => c.id === id || c.slug === id);
}
