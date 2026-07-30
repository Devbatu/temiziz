import type { CategoryId } from './categories';

/**
 * Central monetisation config. Every ad unit, affiliate offer and upsell on the
 * site is declared here so placements can be audited and tuned in one file.
 */

export const adsense = {
  /** e.g. "ca-pub-1234567890123456" — set in .env.local */
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '',
  get enabled() {
    return this.client.startsWith('ca-pub-');
  },
} as const;

/**
 * Ad unit slot IDs from your AdSense dashboard, keyed by placement.
 * A missing id renders a reserved-space placeholder instead — no layout shift
 * either way.
 */
export const adSlots: Record<string, string> = {
  'home-mid': process.env.NEXT_PUBLIC_AD_HOME_MID ?? '',
  'home-bottom': process.env.NEXT_PUBLIC_AD_HOME_BOTTOM ?? '',
  'tools-grid': process.env.NEXT_PUBLIC_AD_TOOLS_GRID ?? '',
  'tool-below': process.env.NEXT_PUBLIC_AD_TOOL_BELOW ?? '',
  'tool-sidebar': process.env.NEXT_PUBLIC_AD_TOOL_SIDEBAR ?? '',
  'category-top': process.env.NEXT_PUBLIC_AD_CATEGORY_TOP ?? '',
  'blog-inarticle': process.env.NEXT_PUBLIC_AD_BLOG_INARTICLE ?? '',
  'blog-list': process.env.NEXT_PUBLIC_AD_BLOG_LIST ?? '',
};

/* ─────────────────────────── affiliate offers ─────────────────────────── */

export interface Offer {
  id: string;
  title: string;
  description: string;
  /** Shown on the button. */
  cta: string;
  url: string;
  /** Short label, e.g. "%20 indirim". */
  badge?: string;
  icon: string;
  /** Which tool categories this offer is relevant to. */
  categories: CategoryId[];
  /** Specific tool slugs where it fits best; these rank first. */
  tools?: string[];
}

/**
 * Replace `url` values with your own affiliate links. Every rendered link gets
 * rel="sponsored nofollow noopener" and is visibly labelled — required by both
 * Google's link policy and Turkish advertising regulation.
 */
export const offers: Offer[] = [
  {
    id: 'hosting',
    title: 'Hızlı web hosting',
    description:
      'Sitenizi saniyeler içinde açan SSD hosting. Ücretsiz SSL, günlük yedek ve Türkçe destek dahil.',
    cta: 'Planları incele',
    url: 'https://example.com/hosting?ref=multitools',
    badge: 'İlk yıl %70',
    icon: 'Server',
    categories: ['website', 'seo', 'developer'],
    tools: ['whois-lookup', 'dns-lookup', 'ssl-checker', 'website-status-checker', 'ping-test'],
  },
  {
    id: 'seo-suite',
    title: 'Profesyonel SEO aracı',
    description:
      'Sıralama takibi, rakip analizi ve teknik SEO denetimi tek panelde. 14 gün ücretsiz deneyin.',
    cta: 'Ücretsiz dene',
    url: 'https://example.com/seo?ref=multitools',
    badge: '14 gün ücretsiz',
    icon: 'TrendingUp',
    categories: ['seo'],
    tools: ['meta-tag-generator', 'keyword-density-checker', 'canonical-checker', 'sitemap-generator'],
  },
  {
    id: 'stock-images',
    title: 'Telifsiz görsel kütüphanesi',
    description:
      'Milyonlarca yüksek çözünürlüklü fotoğraf, vektör ve şablon. Ticari kullanıma uygun lisans.',
    cta: 'Koleksiyonu gör',
    url: 'https://example.com/stock?ref=multitools',
    badge: 'İlk 10 görsel ücretsiz',
    icon: 'Image',
    categories: ['image'],
    tools: ['background-remover', 'image-upscaler', 'meme-generator', 'watermark-image'],
  },
  {
    id: 'esign',
    title: 'Dijital imza platformu',
    description:
      'PDF sözleşmeleri yasal geçerliliği olan e-imza ile saniyeler içinde imzalatın.',
    cta: 'Hemen başla',
    url: 'https://example.com/esign?ref=multitools',
    badge: 'Ayda 5 imza ücretsiz',
    icon: 'PenTool',
    categories: ['pdf'],
    tools: ['merge-pdf', 'protect-pdf', 'pdf-to-word', 'word-to-pdf'],
  },
  {
    id: 'password-manager',
    title: 'Parola yöneticisi',
    description:
      'Ürettiğiniz güçlü parolaları tüm cihazlarınızda şifreli olarak saklayın ve otomatik doldurun.',
    cta: 'Ücretsiz kur',
    url: 'https://example.com/passwords?ref=multitools',
    icon: 'KeyRound',
    categories: ['utility'],
    tools: ['password-generator', 'hash-generator'],
  },
  {
    id: 'cloud-ide',
    title: 'Bulut geliştirme ortamı',
    description:
      'Tarayıcıdan tam donanımlı bir geliştirme ortamı. Kurulum yok, her yerden aynı proje.',
    cta: 'Denemeye başla',
    url: 'https://example.com/ide?ref=multitools',
    icon: 'Code2',
    categories: ['developer'],
    tools: ['json-formatter', 'regex-tester', 'jwt-decoder', 'markdown-editor'],
  },
  {
    id: 'ai-writer',
    title: 'Gelişmiş içerik asistanı',
    description:
      'Uzun form içerik, marka sesi eğitimi ve ekip iş birliği için profesyonel yazım platformu.',
    cta: 'Ücretsiz dene',
    url: 'https://example.com/writer?ref=multitools',
    badge: 'Yeni',
    icon: 'Sparkles',
    categories: ['ai'],
    tools: ['ai-blog-writer', 'ai-rewrite-tool', 'ai-title-generator'],
  },
];

/** Best-matching offers for a tool: exact tool match first, then category. */
export function offersForTool(slug: string, category: CategoryId, limit = 1) {
  const exact = offers.filter((o) => o.tools?.includes(slug));
  const byCategory = offers.filter(
    (o) => o.categories.includes(category) && !exact.includes(o),
  );
  return [...exact, ...byCategory].slice(0, limit);
}

export function offersForCategory(category: CategoryId, limit = 2) {
  return offers.filter((o) => o.categories.includes(category)).slice(0, limit);
}

/* ─────────────────────────── consent ─────────────────────────── */

export const CONSENT_KEY = 'consent:v1';
export type ConsentValue = 'all' | 'necessary';
