/** Paylaşımlı hosting için statik dışa aktarım modu. */
const isStatic = process.env.STATIC_EXPORT === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Pin tracing to this project — a stray lockfile in the user's home dir
  // otherwise makes Next infer the wrong workspace root.
  outputFileTracingRoot: import.meta.dirname,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  ...(isStatic
    ? {
        // `out/` klasörüne saf HTML/CSS/JS üretir. Sunucu gerektirmez.
        output: 'export',
        // Her sayfa kendi klasöründe index.html olur — Apache/LiteSpeed
        // altında .htaccess kuralı olmadan doğru çalışır.
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        // Docker/VPS için kendi kendine yeten sunucu çıktısı.
        output: 'standalone',
        async headers() {
          return [
            {
              source: '/:path*',
              headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
