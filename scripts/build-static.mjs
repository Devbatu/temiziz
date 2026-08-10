#!/usr/bin/env node
/**
 * Paylaşımlı hosting için statik site üretir.
 *
 * Next.js `output: 'export'` modunda sunucu rotalarına (route handler) izin
 * vermez. Bu script derleme süresince onları geçici olarak kenara alır,
 * karşılıkları olan statik dosyaları üretir ve iş bitince geri koyar.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
// @next/env bir CommonJS modülü: adlandırılmış içe aktarım ESM'de çalışmaz.
import nextEnv from '@next/env';

const root = process.cwd();

/**
 * .env dosyalarını bu sarmalayıcının kendi ortamına da yükle.
 * `next build` bunu kendi içinde yapar, ama bu script düz Node olarak çalışır;
 * yüklemezsek NEXT_PUBLIC_* değerlerini boş görür ve aşağıdaki ads.txt üretimi
 * sessizce BOŞ bir dosya yazar.
 */
nextEnv.loadEnvConfig(root);
const stash = path.join(root, '.static-stash');

/** Statik derlemede çıkarılacak sunucu rotaları. */
// Blog artik veritabanindan yonetiliyor ve statik HTML'i PHP uretiyor.
// Next de uretirse iki kaynak ayni dosyalari ezer: yuklemeden sonra panelden
// eklenen yazilar listeden duser. Bu yuzden blog derlemeye dahil edilmez.
const routes = ['app/api', 'app/ads.txt', 'app/blog'];

const moved = [];

function move(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
}

function restore() {
  for (const { original, stashed } of moved.reverse()) {
    if (fs.existsSync(stashed)) move(stashed, original);
  }
  if (fs.existsSync(stash) && fs.readdirSync(stash).length === 0) {
    fs.rmSync(stash, { recursive: true, force: true });
  }
}

process.on('exit', restore);
process.on('SIGINT', () => process.exit(130));

try {
  console.log('▸ Sunucu rotaları geçici olarak kaldırılıyor…');
  for (const rel of routes) {
    const original = path.join(root, rel);
    if (!fs.existsSync(original)) continue;
    const stashed = path.join(stash, rel);
    move(original, stashed);
    moved.push({ original, stashed });
    console.log(`  · ${rel}`);
  }

  // /ads.txt normalde bir rota; statik sürümde gerçek dosya olarak yazılır.
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';
  const adsLines = [];
  if (client.startsWith('ca-pub-')) {
    adsLines.push(`google.com, ${client.replace('ca-pub-', 'pub-')}, DIRECT, f08c47fec0942fa0`);
  }
  if (process.env.ADS_TXT_EXTRA) {
    adsLines.push(...process.env.ADS_TXT_EXTRA.split('\n').map((l) => l.trim()).filter(Boolean));
  }
  if (adsLines.length === 0) {
    // Boş bir ads.txt yayına alınırsa sunucudaki geçerli dosyanın üzerine yazar
    // ve AdSense sitedeki reklamları "yetkisiz satıcı" sayarak durdurur.
    // Sessizce devam etmek yerine derlemeyi burada kesiyoruz.
    throw new Error(
      'ads.txt boş kalacaktı: NEXT_PUBLIC_ADSENSE_CLIENT okunamadı. ' +
        '.env dosyasında ca-pub- ile başlayan değerin tanımlı olduğunu doğrulayın.',
    );
  }
  fs.mkdirSync(path.join(root, 'public'), { recursive: true });
  fs.writeFileSync(path.join(root, 'public/ads.txt'), adsLines.join('\n') + '\n');
  console.log(`▸ public/ads.txt yazıldı (${adsLines.length} satır)`);

  console.log('▸ Statik derleme başlıyor…\n');
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, STATIC_EXPORT: '1', NEXT_PUBLIC_STATIC_MODE: '1' },
  });

  const out = path.join(root, 'out');
  if (!fs.existsSync(out)) throw new Error('out/ klasörü üretilemedi.');

  // Apache/LiteSpeed için 404 yönlendirmesi ve temel önbellek kuralları.
  fs.writeFileSync(
    path.join(out, '.htaccess'),
    `# MultiTools — statik sürüm
ErrorDocument 404 /404.html

# Birlestirilen arac: bmi-calculator ile bmi-hesaplama ayni islevi goruyordu.
# Iki URL ayni sorgu icin yarisinca arama motoru sinyalleri boler; eski adres
# kalici olarak yenisine yonlendiriliyor.
Redirect 301 /tools/bmi-calculator/ /tools/bmi-hesaplama/

# Kaldirilan araclar: calismak icin bir uygulama sunucusu veya ucretli
# bir API gerektiriyorlardi. Calismayan sayfa birakmak yerine kategoriye
# yonlendiriliyorlar.
Redirect 301 /tools/ai-resume-builder/ /tools/
Redirect 301 /tools/ai-cover-letter/ /tools/
Redirect 301 /tools/ai-email-generator/ /tools/
Redirect 301 /tools/ai-blog-writer/ /tools/
Redirect 301 /tools/ai-caption-generator/ /tools/
Redirect 301 /tools/ai-product-description/ /tools/
Redirect 301 /tools/ai-prompt-generator/ /tools/
Redirect 301 /tools/ai-rewrite-tool/ /tools/
Redirect 301 /tools/ai-hashtag-generator/ /tools/
Redirect 301 /tools/ai-title-generator/ /tools/
Redirect 301 /tools/website-screenshot/ /category/website/

# AI kategorisindeki tum araclar kaldirildi; bos kategori sayfasi
# Google tarafindan soft 404 sayilir. Kategori adresi araclar sayfasina gider.
Redirect 301 /category/ai/ /tools/
Redirect 301 /tools/bmi-calculator /tools/bmi-hesaplama/

# Tek kanonik adres: https + www'suz.
# Ayni icerigin iki adreste yayinlanmasi (www / www'suz) arama motorlarinda
# yinelenen icerik sayilir ve siralama gucunu ikiye boler.
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on [OR]
  RewriteCond %{HTTP_HOST} ^www\\. [NC]
  RewriteCond %{HTTP_HOST} ^(?:www\\.)?(.+)$ [NC]
  RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  # Clickjacking koruması. DENY değil SAMEORIGIN: yönetim panelindeki kayıt
  # oynatıcı, sayfayı aynı köken üzerinden bir iframe içinde gösteriyor.
  Header set X-Frame-Options "SAMEORIGIN"
  <FilesMatch "\\.(js|css|svg|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
`,
  );

  const count = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).reduce(
      (n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1),
      0,
    );

  console.log(`\n✓ Hazır: out/ (${count(out)} dosya)`);
  console.log('  Bu klasörün İÇİNDEKİLERİ sunucuda public_html içine yükleyin.');
} catch (err) {
  console.error('\n✗ Statik derleme başarısız:', err.message);
  process.exitCode = 1;
}
