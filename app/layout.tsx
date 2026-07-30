import type { Metadata, Viewport } from 'next';
import { jsonLdScript } from '@/lib/jsonld';
import './globals.css';
import { site, absoluteUrl } from '@/lib/site';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeScript } from '@/components/layout/ThemeScript';
import { Monetization, consentDefaults } from '@/components/ads/Monetization';
import { adsense } from '@/lib/monetization';
import { Tracker } from '@/components/analytics/Tracker';
import { Suspense } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'online araçlar',
    'pdf araçları',
    'görsel sıkıştırma',
    'seo araçları',
    'geliştirici araçları',
    'ücretsiz online tool',
  ],
  alternates: { canonical: '/' },
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    site: site.twitter,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  // Search Console dogrulamasi: hPanel'e dokunmadan, .env'e kodu yazip
  // yeniden derlemek yeterli. Bos ise etiket hic basilmaz.
  verification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION }
    : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#060814' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: site.url,
  description: site.description,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: absoluteUrl('/tools?q={search_term_string}') },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <ThemeScript />

        {/*
          Consent Mode v2 varsayilanlari.

          React 19 harici <script src> etiketlerini <head> in en basina tasir,
          bu yuzden AdSense etiketi kaynakta bu satirdan once gorunur. Calisma
          sirasi yine de dogrudur: bu satir ici betik HTML ayristirilirken
          senkron calisir, AdSense betigi ise `async` oldugu icin ancak agdan
          indikten sonra calisir. Ayrica `wait_for_update: 500` sayesinde
          Google etiketleri reklam istegi atmadan once onay durumunun
          guncellenmesini bekler.
        */}
        <script dangerouslySetInnerHTML={{ __html: consentDefaults }} />

        {/*
          AdSense betigi statik HTML'in parcasi olarak <head> te durur.
          Tembel yuklenirse betik yalnizca JavaScript calistiktan sonra olusur
          ve Google'in site dogrulamasi onu kaynakta bulamaz. `async` sayesinde
          sayfa render'ini bloklamaz.
        */}
        {adsense.enabled && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense.client}`}
            crossOrigin="anonymous"
          />
        )}

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(orgJsonLd)}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          İçeriğe geç
        </a>
        <Monetization />
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
