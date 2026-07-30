/**
 * Prompt templates for the AI tools. Each entry maps a tool slug to a system
 * prompt plus the form fields its UI should render.
 */

export interface AiField {
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
  hint?: string;
}

export interface AiToolSpec {
  system: string;
  fields: AiField[];
  /** Builds the user turn from the submitted form values. */
  build: (v: Record<string, string>) => string;
  cta: string;
  /** Rough output ceiling — longer for documents, shorter for lists. */
  maxTokens: number;
}

const TONES = ['Profesyonel', 'Samimi', 'Resmî', 'Enerjik', 'İkna edici', 'Sade'];
const LANGS = ['Türkçe', 'İngilizce'];

const common = (v: Record<string, string>) =>
  `Dil: ${v.language || 'Türkçe'}\nTon: ${v.tone || 'Profesyonel'}`;

export const aiTools: Record<string, AiToolSpec> = {
  'ai-resume-builder': {
    system:
      'Sen deneyimli bir kariyer danışmanı ve teknik işe alım uzmanısın. Verilen bilgilerden ATS (aday takip sistemi) uyumlu, ölçülebilir başarılara odaklanan bir özgeçmiş metni yazarsın. Uydurma iş deneyimi, sertifika veya rakam ekleme — yalnızca verilen bilgileri kullan, eksik bölümleri atla. Çıktıyı Markdown başlıklarıyla bölümlendir.',
    cta: 'Özgeçmiş oluştur',
    maxTokens: 6000,
    fields: [
      { name: 'name', label: 'Ad Soyad', required: true },
      { name: 'title', label: 'Hedef pozisyon', placeholder: 'Frontend Developer', required: true },
      { name: 'experience', label: 'Deneyim', type: 'textarea', placeholder: 'Şirket, rol, yıl ve yaptığınız işler…', required: true },
      { name: 'skills', label: 'Yetkinlikler', type: 'textarea', placeholder: 'React, TypeScript, SQL…' },
      { name: 'education', label: 'Eğitim', placeholder: 'Üniversite, bölüm, yıl' },
      { name: 'tone', label: 'Ton', type: 'select', options: TONES },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `${common(v)}\n\nAd Soyad: ${v.name}\nHedef pozisyon: ${v.title}\nDeneyim:\n${v.experience}\nYetkinlikler: ${v.skills || '—'}\nEğitim: ${v.education || '—'}\n\nBu bilgilerden bir özgeçmiş metni yaz.`,
  },

  'ai-cover-letter': {
    system:
      'Sen bir kariyer danışmanısın. Başvurulan pozisyona özel, kısa (en fazla 4 paragraf) ve ikna edici bir ön yazı yazarsın. Klişe kalıplardan kaçınır, adayın deneyimini pozisyonun ihtiyacına bağlarsın. Verilmeyen bilgiyi uydurma.',
    cta: 'Ön yazı oluştur',
    maxTokens: 4000,
    fields: [
      { name: 'name', label: 'Ad Soyad', required: true },
      { name: 'position', label: 'Pozisyon', required: true },
      { name: 'company', label: 'Şirket', required: true },
      { name: 'background', label: 'Deneyiminiz', type: 'textarea', placeholder: 'İlgili deneyim ve güçlü yönleriniz', required: true },
      { name: 'tone', label: 'Ton', type: 'select', options: TONES },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `${common(v)}\n\nAday: ${v.name}\nPozisyon: ${v.position}\nŞirket: ${v.company}\nDeneyim: ${v.background}\n\nBu başvuru için ön yazı yaz.`,
  },

  'ai-email-generator': {
    system:
      'Sen profesyonel iş yazışmaları konusunda uzman bir editörsün. Konu satırı ve gövdeden oluşan, doğrudan gönderilebilir e-posta taslakları yazarsın. Gereksiz uzatma; istenen tonu tutarlı biçimde uygula.',
    cta: 'E-posta oluştur',
    maxTokens: 3000,
    fields: [
      { name: 'purpose', label: 'E-postanın amacı', type: 'textarea', placeholder: 'Örn: Gecikmiş faturayı nazikçe hatırlatmak', required: true },
      { name: 'recipient', label: 'Alıcı', placeholder: 'Müşteri, yönetici, iş ortağı…' },
      { name: 'details', label: 'Eklenecek detaylar', type: 'textarea', placeholder: 'Tarih, tutar, referans numarası…' },
      { name: 'tone', label: 'Ton', type: 'select', options: TONES },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `${common(v)}\n\nAmaç: ${v.purpose}\nAlıcı: ${v.recipient || 'belirtilmedi'}\nDetaylar: ${v.details || '—'}\n\nKonu satırı ve gövdeyi içeren bir e-posta taslağı yaz.`,
  },

  'ai-blog-writer': {
    system:
      'Sen SEO bilgisi güçlü bir içerik editörüsün. Anahtar kelimeyi doğal bir yoğunlukta kullanan, H2/H3 başlıklarla bölümlenmiş, okunabilir blog yazıları üretirsin. Anahtar kelime doldurmadan kaçın. İstatistik veya alıntı uydurma; genel bilgiyle sınırlı kal. Markdown kullan.',
    cta: 'Blog yazısı üret',
    maxTokens: 8000,
    fields: [
      { name: 'topic', label: 'Konu', placeholder: 'PDF dosya boyutu küçültme', required: true },
      { name: 'keyword', label: 'Ana anahtar kelime', placeholder: 'pdf sıkıştırma' },
      { name: 'audience', label: 'Hedef kitle', placeholder: 'Küçük işletme sahipleri' },
      { name: 'length', label: 'Uzunluk', type: 'select', options: ['Kısa (~400 kelime)', 'Orta (~800 kelime)', 'Uzun (~1500 kelime)'] },
      { name: 'tone', label: 'Ton', type: 'select', options: TONES },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `${common(v)}\n\nKonu: ${v.topic}\nAnahtar kelime: ${v.keyword || v.topic}\nHedef kitle: ${v.audience || 'genel'}\nUzunluk: ${v.length || 'Orta (~800 kelime)'}\n\nBu konuda SEO uyumlu bir blog yazısı üret. Başlık, giriş, alt başlıklar ve kısa bir sonuç bölümü olsun.`,
  },

  'ai-caption-generator': {
    system:
      'Sen sosyal medya içerik uzmanısın. Platformun karakter sınırlarına ve üslubuna uygun, dikkat çekici açıklamalar yazarsın. Her seferinde numaralandırılmış 5 farklı alternatif üret. Aşırı emoji kullanma.',
    cta: 'Açıklama üret',
    maxTokens: 3000,
    fields: [
      { name: 'topic', label: 'Gönderi konusu', type: 'textarea', placeholder: 'Yeni ürün lansmanı, kahve dükkanı açılışı…', required: true },
      { name: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'LinkedIn', 'X (Twitter)', 'TikTok', 'Facebook'] },
      { name: 'tone', label: 'Ton', type: 'select', options: TONES },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `${common(v)}\n\nPlatform: ${v.platform || 'Instagram'}\nKonu: ${v.topic}\n\n5 farklı açıklama alternatifi üret.`,
  },

  'ai-product-description': {
    system:
      'Sen e-ticaret metin yazarısın. Özellikleri faydaya çeviren, tarama kolaylığı için kısa paragraf ve madde işaretleri kullanan ürün açıklamaları yazarsın. Verilmeyen özellik, sertifika veya garanti uydurma.',
    cta: 'Açıklama üret',
    maxTokens: 3000,
    fields: [
      { name: 'product', label: 'Ürün adı', required: true },
      { name: 'features', label: 'Özellikler', type: 'textarea', placeholder: 'Malzeme, ölçü, renk, kullanım alanı…', required: true },
      { name: 'audience', label: 'Hedef kitle', placeholder: 'Öğrenciler, ofis çalışanları…' },
      { name: 'tone', label: 'Ton', type: 'select', options: TONES },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `${common(v)}\n\nÜrün: ${v.product}\nÖzellikler: ${v.features}\nHedef kitle: ${v.audience || 'genel'}\n\nKısa bir tanıtım paragrafı, madde işaretli öne çıkan özellikler ve bir kapanış cümlesi içeren ürün açıklaması yaz.`,
  },

  'ai-prompt-generator': {
    system:
      'Sen prompt mühendisliği uzmanısın. Kullanıcının kısa fikrini; rol, bağlam, görev, kısıtlar ve istenen çıktı biçimi içeren ayrıntılı bir prompt’a dönüştürürsün. Çıktıyı doğrudan kopyalanabilir tek bir prompt bloğu olarak ver, ardından kısa bir "neden böyle" notu ekle.',
    cta: 'Prompt üret',
    maxTokens: 3000,
    fields: [
      { name: 'idea', label: 'Fikriniz', type: 'textarea', placeholder: 'Örn: müşteri yorumlarını analiz eden bir asistan', required: true },
      { name: 'target', label: 'Hangi araç için?', type: 'select', options: ['Metin (sohbet)', 'Görsel üretimi', 'Kod üretimi', 'Veri analizi'] },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `Dil: ${v.language || 'Türkçe'}\nKullanım: ${v.target || 'Metin (sohbet)'}\nFikir: ${v.idea}\n\nBu fikri ayrıntılı bir prompt’a dönüştür.`,
  },

  'ai-rewrite-tool': {
    system:
      'Sen bir editörsün. Verilen metni anlamını ve olgusal içeriğini koruyarak istenen ton ve amaca göre yeniden yazarsın. Yeni bilgi ekleme, mevcut bilgiyi çıkarma.',
    cta: 'Yeniden yaz',
    maxTokens: 6000,
    fields: [
      { name: 'text', label: 'Metin', type: 'textarea', placeholder: 'Yeniden yazılacak metni yapıştırın…', required: true },
      { name: 'goal', label: 'Amaç', type: 'select', options: ['Sadeleştir', 'Kısalt', 'Detaylandır', 'Daha profesyonel yap', 'Daha samimi yap', 'Akıcılığı artır'] },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `Dil: ${v.language || 'Türkçe'}\nAmaç: ${v.goal || 'Akıcılığı artır'}\n\nMetin:\n${v.text}\n\nYalnızca yeniden yazılmış metni döndür.`,
  },

  'ai-hashtag-generator': {
    system:
      'Sen sosyal medya erişim uzmanısın. Popüler, orta ve niş hacimli etiketleri dengeleyen hashtag setleri üretirsin. Etiketleri gruplandırarak sun ve tek satırlık kopyalanabilir bir liste ekle. Yanıltıcı veya alakasız etiket önerme.',
    cta: 'Hashtag üret',
    maxTokens: 2000,
    fields: [
      { name: 'topic', label: 'İçerik konusu', type: 'textarea', placeholder: 'El yapımı seramik kupa satışı', required: true },
      { name: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'TikTok', 'LinkedIn', 'X (Twitter)', 'YouTube'] },
      { name: 'count', label: 'Adet', type: 'select', options: ['10', '20', '30'] },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `Dil: ${v.language || 'Türkçe'}\nPlatform: ${v.platform || 'Instagram'}\nAdet: ${v.count || '20'}\nKonu: ${v.topic}\n\nHashtag seti üret.`,
  },

  'ai-title-generator': {
    system:
      'Sen başlık optimizasyonu uzmanısın. Merak uyandıran ama abartıya (clickbait) kaçmayan başlık alternatifleri üretirsin. Her başlığın yanına karakter sayısını parantez içinde yaz; SEO için 60 karakteri aşanları işaretle.',
    cta: 'Başlık üret',
    maxTokens: 2000,
    fields: [
      { name: 'topic', label: 'İçerik konusu', type: 'textarea', placeholder: 'Görsel sıkıştırmanın site hızına etkisi', required: true },
      { name: 'type', label: 'İçerik türü', type: 'select', options: ['Blog yazısı', 'YouTube videosu', 'Haber', 'Ürün sayfası', 'E-posta konusu'] },
      { name: 'keyword', label: 'Anahtar kelime', placeholder: 'İsteğe bağlı' },
      { name: 'language', label: 'Dil', type: 'select', options: LANGS },
    ],
    build: (v) =>
      `Dil: ${v.language || 'Türkçe'}\nTür: ${v.type || 'Blog yazısı'}\nAnahtar kelime: ${v.keyword || '—'}\nKonu: ${v.topic}\n\n10 farklı başlık alternatifi üret.`,
  },
};

export function getAiTool(slug: string) {
  return aiTools[slug];
}
