/**
 * Birlikte kullanılan araç zincirleri.
 *
 * Neden var: araç sayfaları şimdiye kadar yalnızca kendi kategorisindeki
 * araçlara bağlanıyordu. Kategoriler arası bağlantı yoktu, yani site içi
 * bağlantı ağı yedi ayrı adaya bölünmüştü. Arama motorları bağlantıları
 * takip ederek sayfaları keşfeder ve önem sırasını buradan çıkarır; kopuk
 * adalar hem taranmayı hem de sıralamayı zayıflatır.
 *
 * Buradaki zincirler uydurma değil, gerçek iş akışları: kullanıcı bir aracı
 * bitirdiğinde büyük olasılıkla sıradaki adıma ihtiyaç duyar.
 */

export interface Workflow {
  id: string;
  /** Kullanıcıya gösterilen bağlam cümlesi. */
  title: string;
  /** Sıralı adımlar — araç slug'ları. */
  steps: string[];
}

export const workflows: Workflow[] = [
  {
    id: 'tarama-arsiv',
    title: 'Taranmış belgeleri arşivlemek',
    steps: ['image-compressor', 'jpg-to-pdf', 'merge-pdf', 'compress-pdf'],
  },
  {
    id: 'belge-paylasim',
    title: 'Belgeyi güvenli paylaşmak',
    steps: ['merge-pdf', 'split-pdf', 'protect-pdf'],
  },
  {
    id: 'pdf-duzenleme',
    title: 'PDF içeriğini düzenlemek',
    steps: ['pdf-to-word', 'word-to-pdf', 'compress-pdf'],
  },
  {
    id: 'web-gorsel',
    title: 'Web sitesi için görsel hazırlamak',
    steps: ['image-resizer', 'image-compressor', 'image-converter'],
  },
  {
    id: 'urun-fotografi',
    title: 'Ürün fotoğrafı hazırlamak',
    steps: ['crop-image', 'background-remover', 'image-compressor', 'watermark-image'],
  },
  {
    id: 'sosyal-medya',
    title: 'Sosyal medya gönderisi hazırlamak',
    steps: ['crop-image', 'ai-caption-generator', 'ai-hashtag-generator'],
  },
  {
    id: 'yeni-sayfa-seo',
    title: 'Yeni sayfayı yayına hazırlamak',
    steps: ['slug-generator', 'meta-tag-generator', 'schema-generator', 'sitemap-generator'],
  },
  {
    id: 'seo-denetim',
    title: 'Yayındaki sayfayı denetlemek',
    steps: ['canonical-checker', 'keyword-density-checker', 'website-status-checker'],
  },
  {
    id: 'alan-adi-kurulum',
    title: 'Alan adı ve sunucu kurulumu',
    steps: ['whois-lookup', 'dns-lookup', 'ssl-checker', 'port-checker'],
  },
  {
    id: 'api-hata-ayikla',
    title: 'API yanıtını incelemek',
    steps: ['json-formatter', 'json-validator', 'jwt-decoder', 'base64-encode-decode'],
  },
  {
    id: 'yayin-oncesi-kod',
    title: 'Kodu yayına hazırlamak',
    steps: ['javascript-minifier', 'css-minifier', 'html-formatter'],
  },
  {
    id: 'icerik-uretimi',
    title: 'Blog yazısı üretmek',
    steps: ['ai-title-generator', 'ai-blog-writer', 'keyword-density-checker', 'slug-generator'],
  },
  {
    id: 'hesap-guvenligi',
    title: 'Hesap güvenliğini sağlamak',
    steps: ['password-generator', 'hash-generator', 'qr-code-generator'],
  },
  {
    id: 'sunum-hazirlik',
    title: 'Sunum materyali hazırlamak',
    steps: ['pdf-to-jpg', 'image-upscaler', 'gif-maker'],
  },
];

/** Bu aracın geçtiği iş akışları — sayfada bağlam bağlantısı olarak gösterilir. */
export function workflowsForTool(slug: string, limit = 2): Array<{
  workflow: Workflow;
  /** Bu araçtan sonraki adım (varsa) — "sıradaki adım" önerisi. */
  next: string | null;
  /** Bu araçtan önceki adım (varsa). */
  prev: string | null;
}> {
  return workflows
    .filter((w) => w.steps.includes(slug))
    .slice(0, limit)
    .map((workflow) => {
      const i = workflow.steps.indexOf(slug);
      return {
        workflow,
        prev: i > 0 ? workflow.steps[i - 1] : null,
        next: i < workflow.steps.length - 1 ? workflow.steps[i + 1] : null,
      };
    });
}
