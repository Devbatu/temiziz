'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { BellRing, Loader2, ServerCog } from 'lucide-react';
import { needsServer } from '@/lib/runtime';
import { ToolProvider } from './ToolContext';

const Loading = () => (
  <div className="surface grid min-h-[320px] place-items-center rounded-2xl">
    <div className="flex items-center gap-3 text-sm text-muted">
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
      Araç yükleniyor…
    </div>
  </div>
);

/** Every widget is code-split, so a tool page only downloads its own logic. */
const lazy = <T,>(loader: () => Promise<{ default: ComponentType<T> } | ComponentType<T>>) =>
  dynamic(async () => {
    const mod = await loader();
    return (mod as { default: ComponentType<T> }).default ?? (mod as ComponentType<T>);
  }, { loading: Loading, ssr: false });

const text = () => import('./text-tools');
const util = () => import('./utility-tools');
const image = () => import('./image-tools');
const imageAdv = () => import('./image-advanced-tools');
const pdf = () => import('./pdf-tools');
const pdfConv = () => import('./pdf-convert-tools');
const net = () => import('./network-tools');
const web = () => import('./website-tools');
const ai = () => import('./AiTool');

/**
 * slug → interactive widget.
 * Adding a new tool means adding one line here plus an entry in `lib/tools.ts`.
 */
export const toolComponents: Record<string, ComponentType> = {
  // developer
  'json-formatter': lazy(() => text().then((m) => m.JsonFormatter)),
  'json-validator': lazy(() => text().then((m) => m.JsonValidator)),
  'xml-formatter': lazy(() => text().then((m) => m.XmlFormatter)),
  'html-formatter': lazy(() => text().then((m) => m.HtmlFormatter)),
  'css-minifier': lazy(() => text().then((m) => m.CssMinifier)),
  'javascript-minifier': lazy(() => text().then((m) => m.JavascriptMinifier)),
  'sql-formatter': lazy(() => text().then((m) => m.SqlFormatter)),
  'base64-encode-decode': lazy(() => text().then((m) => m.Base64Tool)),
  'regex-tester': lazy(() => text().then((m) => m.RegexTester)),
  'uuid-generator': lazy(() => text().then((m) => m.UuidGenerator)),
  'hash-generator': lazy(() => text().then((m) => m.HashGenerator)),
  'jwt-decoder': lazy(() => text().then((m) => m.JwtDecoder)),
  'markdown-editor': lazy(() => text().then((m) => m.MarkdownEditor)),
  'cron-generator': lazy(() => text().then((m) => m.CronGenerator)),

  // seo
  'meta-tag-generator': lazy(() => text().then((m) => m.MetaTagGenerator)),
  'opengraph-generator': lazy(() => text().then((m) => m.OpenGraphGenerator)),
  'schema-generator': lazy(() => text().then((m) => m.SchemaGenerator)),
  'robots-txt-generator': lazy(() => text().then((m) => m.RobotsGenerator)),
  'sitemap-generator': lazy(() => text().then((m) => m.SitemapGenerator)),
  'slug-generator': lazy(() => text().then((m) => m.SlugGenerator)),
  'keyword-density-checker': lazy(() => text().then((m) => m.KeywordDensityChecker)),

  // utility
  'qr-code-generator': lazy(() => util().then((m) => m.QrCodeGenerator)),
  'password-generator': lazy(() => util().then((m) => m.PasswordGenerator)),
  'lorem-ipsum-generator': lazy(() => util().then((m) => m.LoremIpsumGenerator)),
  'random-number-generator': lazy(() => util().then((m) => m.RandomNumberGenerator)),
  'random-name-generator': lazy(() => util().then((m) => m.RandomNameGenerator)),
  'age-calculator': lazy(() => util().then((m) => m.AgeCalculator)),
  'bmi-calculator': lazy(() => util().then((m) => m.BmiCalculator)),
  'unit-converter': lazy(() => util().then((m) => m.UnitConverter)),
  'timezone-converter': lazy(() => util().then((m) => m.TimezoneConverter)),
  'color-picker': lazy(() => util().then((m) => m.ColorPicker)),
  'gradient-generator': lazy(() => util().then((m) => m.GradientGenerator)),
  'palette-generator': lazy(() => util().then((m) => m.PaletteGenerator)),
  'countdown-timer': lazy(() => util().then((m) => m.CountdownTimer)),
  stopwatch: lazy(() => util().then((m) => m.Stopwatch)),

  // image
  'image-compressor': lazy(() => image().then((m) => m.ImageCompressor)),
  'image-resizer': lazy(() => image().then((m) => m.ImageResizer)),
  'image-converter': lazy(() => image().then((m) => m.ImageConverter)),
  'crop-image': lazy(() => image().then((m) => m.CropImage)),
  'blur-image': lazy(() => image().then((m) => m.BlurImage)),
  'watermark-image': lazy(() => image().then((m) => m.WatermarkImage)),
  'meme-generator': lazy(() => image().then((m) => m.MemeGenerator)),
  'background-remover': lazy(() => imageAdv().then((m) => m.BackgroundRemover)),
  'image-upscaler': lazy(() => imageAdv().then((m) => m.ImageUpscaler)),
  'gif-maker': lazy(() => imageAdv().then((m) => m.GifMaker)),
  'qr-scanner': lazy(() => imageAdv().then((m) => m.QrScanner)),

  // pdf
  'merge-pdf': lazy(() => pdf().then((m) => m.MergePdf)),
  'split-pdf': lazy(() => pdf().then((m) => m.SplitPdf)),
  'rotate-pdf': lazy(() => pdf().then((m) => m.RotatePdf)),
  'compress-pdf': lazy(() => pdf().then((m) => m.CompressPdf)),
  'jpg-to-pdf': lazy(() => pdf().then((m) => m.JpgToPdf)),
  'pdf-to-jpg': lazy(() => pdfConv().then((m) => m.PdfToJpg)),
  'pdf-to-word': lazy(() => pdfConv().then((m) => m.PdfToWord)),
  'word-to-pdf': lazy(() => pdfConv().then((m) => m.WordToPdf)),
  'protect-pdf': lazy(() => pdfConv().then((m) => m.ProtectPdf)),
  'unlock-pdf': lazy(() => pdfConv().then((m) => m.UnlockPdf)),

  // network & website
  'dns-lookup': lazy(() => net().then((m) => m.DnsLookup)),
  'whois-lookup': lazy(() => web().then((m) => m.WhoisLookup)),
  'ip-lookup': lazy(() => web().then((m) => m.IpLookup)),
  'ssl-checker': lazy(() => web().then((m) => m.SslChecker)),
  'ping-test': lazy(() => web().then((m) => m.PingTest)),
  'port-checker': lazy(() => web().then((m) => m.PortChecker)),
  'website-status-checker': lazy(() => web().then((m) => m.WebsiteStatusChecker)),
  'website-screenshot': lazy(() => web().then((m) => m.WebsiteScreenshot)),
  'canonical-checker': lazy(() => web().then((m) => m.CanonicalChecker)),
  'currency-converter': lazy(() => web().then((m) => m.CurrencyConverter)),

  // ai
  'ai-resume-builder': lazy(() => ai().then((m) => m.AiResumeBuilder)),
  'ai-cover-letter': lazy(() => ai().then((m) => m.AiCoverLetter)),
  'ai-email-generator': lazy(() => ai().then((m) => m.AiEmailGenerator)),
  'ai-blog-writer': lazy(() => ai().then((m) => m.AiBlogWriter)),
  'ai-caption-generator': lazy(() => ai().then((m) => m.AiCaptionGenerator)),
  'ai-product-description': lazy(() => ai().then((m) => m.AiProductDescription)),
  'ai-prompt-generator': lazy(() => ai().then((m) => m.AiPromptGenerator)),
  'ai-rewrite-tool': lazy(() => ai().then((m) => m.AiRewriteTool)),
  'ai-hashtag-generator': lazy(() => ai().then((m) => m.AiHashtagGenerator)),
  'ai-title-generator': lazy(() => ai().then((m) => m.AiTitleGenerator)),
};

export function ToolRuntime({ slug, name }: { slug: string; name: string }) {
  // Statik sürümde sunucu rotaları yok — aracı bozuk göstermek yerine açıkla.
  if (needsServer(slug)) return <ServerRequired name={name} />;

  const Cmp = toolComponents[slug];
  // ToolProvider, ortak butonların kullanımı hangi araca yazacağını bilmesini sağlar.
  if (Cmp) {
    return (
      <ToolProvider slug={slug}>
        <Cmp />
      </ToolProvider>
    );
  }

  return (
    <div className="surface grid place-items-center rounded-2xl px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
        <BellRing className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">{name} çok yakında</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        Bu araç geliştirme aşamasında. Bu arada aynı kategorideki hazır araçlara göz atabilir veya
        aşağıdaki benzer araçlardan birini kullanabilirsiniz.
      </p>
      <Link
        href="/tools"
        className="mt-6 inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-5 text-sm font-semibold text-white"
      >
        Hazır araçlara göz at
      </Link>
    </div>
  );
}

function ServerRequired({ name }: { name: string }) {
  return (
    <div className="surface grid place-items-center rounded-2xl px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
        <ServerCog className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-xl font-bold">{name} bu sürümde kullanılamıyor</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        Bu araç, sorguyu sizin adınıza yapan bir sunucu gerektirir. Sitenin bu sürümü tamamen
        statik olarak yayınlandığı için sunucu tarafı araçlar devre dışıdır.
      </p>
      <p className="mt-3 max-w-md text-xs leading-relaxed text-muted">
        Tarayıcıda çalışan araçların tamamı (PDF, görsel, geliştirici, SEO üreticileri ve
        hesaplayıcılar) sorunsuz kullanılabilir.
      </p>
      <Link
        href="/tools"
        className="mt-6 inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-5 text-sm font-semibold text-white"
      >
        Çalışan araçlara göz at
      </Link>
    </div>
  );
}
