<?php
/**
 * Blog yonetimi: veritabanindaki yazilardan STATIK HTML uretir.
 *
 * Neden statik uretim?
 *  - Site zaten statik; blogu PHP ile canli render etmek her istekte PHP
 *    calistirir, hizi ve guvenlik yuzeyini kotulestirir.
 *  - Uretilen sayfa, sitenin mevcut statik sayfalarindan alinan "kabuk"
 *    (head + header + footer) icine yerlestirilir. Boylece tasarim birebir
 *    ayni olur ve CSS/JS tekrar edilmez.
 *
 * Kaynak dogruluk veritabanidir. Site bastan yuklenirse yazilar panelden
 * "Tumunu yeniden olustur" ile geri getirilir.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

function mt_public_dir(): string
{
    return dirname(mt_config_path()) . '/public_html';
}

/* ─────────────────────────── Slug ─────────────────────────── */

/** Turkce karakterleri cozer, SEO uyumlu slug uretir. */
function mt_slugify(string $input): string
{
    $map = [
        'ç' => 'c', 'Ç' => 'c', 'ğ' => 'g', 'Ğ' => 'g', 'ı' => 'i', 'İ' => 'i',
        'ö' => 'o', 'Ö' => 'o', 'ş' => 's', 'Ş' => 's', 'ü' => 'u', 'Ü' => 'u',
    ];
    $s = strtr($input, $map);
    $s = mb_strtolower($s, 'UTF-8');
    $s = preg_replace('/[^a-z0-9]+/u', '-', $s) ?? '';
    $s = trim($s, '-');
    return substr($s, 0, 80);
}

/** Slug benzersiz mi; degilse -2, -3 ... ekler. */
function mt_unique_slug(string $slug, ?int $ignoreId = null): string
{
    $db   = mt_db();
    $base = $slug !== '' ? $slug : 'yazi';
    $try  = $base;
    for ($i = 2; $i < 100; $i++) {
        $sql = 'SELECT COUNT(*) FROM mt_posts WHERE slug = ?' . ($ignoreId ? ' AND id <> ?' : '');
        $st  = $db->prepare($sql);
        $st->execute($ignoreId ? [$try, $ignoreId] : [$try]);
        if ((int) $st->fetchColumn() === 0) {
            return $try;
        }
        $try = $base . '-' . $i;
    }
    return $base . '-' . bin2hex(random_bytes(3));
}

/* ─────────────────────── Markdown → HTML ─────────────────────── */

/**
 * Kucuk bir Markdown donusturucu.
 *
 * Once tum girdi HTML olarak kacisli hale getirilir; boylece yazi icine
 * <script> yazilsa bile calismaz. Baglanti adreslerinde yalnizca guvenli
 * semalara izin verilir (javascript: gibi semalar XSS'e yol acar).
 */
function mt_markdown(string $md): string
{
    $esc = htmlspecialchars($md, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $out = [];

    foreach (preg_split('/\n{2,}/', str_replace("\r\n", "\n", $esc)) as $block) {
        $b = trim($block);
        if ($b === '') {
            continue;
        }
        if (preg_match('/^(#{1,4})\s+(.*)$/s', $b, $m)) {
            // Sayfa basligi zaten <h1>. Yazarlar bolum basligi icin genellikle
            // "##" kullanir; hem "#" hem "##" bu yuzden <h2> olur, boylece
            // sitedeki mevcut yazilarla ayni hiyerarsi korunur.
            $lvl = strlen($m[1]) <= 2 ? 2 : min(strlen($m[1]), 5);
            $out[] = "<h{$lvl}>" . mt_md_inline($m[2]) . "</h{$lvl}>";
            continue;
        }
        if (preg_match('/^(?:[-*+]\s+.*\n?)+$/m', $b) && preg_match('/^[-*+]\s/', $b)) {
            $items = '';
            foreach (explode("\n", $b) as $line) {
                $items .= '<li>' . mt_md_inline(preg_replace('/^[-*+]\s+/', '', trim($line)) ?? '') . '</li>';
            }
            $out[] = '<ul>' . $items . '</ul>';
            continue;
        }
        if (preg_match('/^\d+\.\s/', $b)) {
            $items = '';
            foreach (explode("\n", $b) as $line) {
                $items .= '<li>' . mt_md_inline(preg_replace('/^\d+\.\s+/', '', trim($line)) ?? '') . '</li>';
            }
            $out[] = '<ol>' . $items . '</ol>';
            continue;
        }
        if (str_starts_with($b, '&gt;')) {
            $out[] = '<blockquote>' . mt_md_inline(preg_replace('/^&gt;\s?/m', '', $b) ?? '') . '</blockquote>';
            continue;
        }
        $out[] = '<p>' . mt_md_inline(str_replace("\n", '<br />', $b)) . '</p>';
    }
    return implode("\n", $out);
}

function mt_md_inline(string $s): string
{
    $s = preg_replace('/`([^`]+)`/', '<code>$1</code>', $s) ?? $s;
    $s = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $s) ?? $s;
    $s = preg_replace('/(^|[^*])\*([^*]+)\*/', '$1<em>$2</em>', $s) ?? $s;
    $s = preg_replace_callback(
        '/\[([^\]]+)\]\(([^)]+)\)/',
        static fn (array $m): string =>
            '<a href="' . mt_safe_url($m[2]) . '" rel="noopener">' . $m[1] . '</a>',
        $s
    ) ?? $s;
    return $s;
}

/** javascript:, data: gibi semalari engeller. */
function mt_safe_url(string $raw): string
{
    $decoded = html_entity_decode($raw, ENT_QUOTES, 'UTF-8');
    $flat    = strtolower(preg_replace('/[\s\x00-\x1f]/', '', $decoded) ?? '');
    if (preg_match('/^([a-z][a-z0-9+.\-]*):/', $flat, $m)
        && !in_array($m[1], ['http', 'https', 'mailto', 'tel'], true)) {
        return '#gecersiz-baglanti';
    }
    return htmlspecialchars($decoded, ENT_QUOTES, 'UTF-8');
}

/* ─────────────────── Sayfa kabugu (tasarim eslesmesi) ─────────────────── */

/**
 * Next.js calisma zamanini kabuktan cikarir.
 *
 * KRITIK: Kabuk hangi sayfadan alindiysa, o sayfanin React hidrasyon verisini
 * (self.__next_f) ve chunk betiklerini de tasir. Bunlar blog sayfasinda
 * kalirsa tarayici once bizim HTML'imizi gosterir, sonra React devreye girip
 * KAYNAK SAYFAYI (ornegin ana sayfayi) yeniden cizer - kullanici baska bir
 * sayfaya atilmis gibi olur.
 *
 * Blog sayfalarinin React'e ihtiyaci yok: icerik zaten sunucuda uretilmis
 * duz HTML. Betikleri atinca sayfa daha da hizli acilir.
 */
function mt_strip_next_runtime(string $html): string
{
    // Chunk betikleri ve on-yukleme baglantilari
    $html = preg_replace('#<script[^>]+src="/_next/static/[^"]*"[^>]*>\s*</script>#i', '', $html) ?? $html;
    $html = preg_replace('#<link[^>]+rel="preload"[^>]*as="script"[^>]*>#i', '', $html) ?? $html;
    // RSC yuku: <script>self.__next_f.push(...)</script>
    $html = preg_replace('#<script>\s*self\.__next_f[\s\S]*?</script>#i', '', $html) ?? $html;
    $html = preg_replace('#<script>\s*\(self\.__next_f[\s\S]*?</script>#i', '', $html) ?? $html;
    return $html;
}

/**
 * React kaldirilinca ustteki tema ve menu dugmeleri islevsiz kalirdi.
 * Bu kucuk betik onlari saf JavaScript ile calisir hale getirir.
 */
function mt_static_header_js(): string
{
    return <<<'HTML'
<script>
(function () {
  var root = document.documentElement;
  var MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  var SUN  = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';

  // Tema dugmesi: React tarafinda ikon yalnizca istemcide ciziliyordu,
  // bu yuzden statik HTML'de bos geliyor. Ikonu da burada yerlestiriyoruz.
  var themeBtn = document.querySelector('header button[aria-label*="temaya"]');
  if (themeBtn) {
    var paint = function () {
      var dark = root.classList.contains('dark');
      themeBtn.innerHTML = dark ? SUN : MOON;
      themeBtn.setAttribute('aria-label', dark ? 'Aydınlık temaya geç' : 'Karanlık temaya geç');
    };
    paint();
    themeBtn.addEventListener('click', function () {
      var dark = root.classList.toggle('dark');
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
      paint();
    });
  }

  // Arama ve mobil menu dugmeleri React'e bagliydi; burada araclar sayfasina
  // goturuyoruz ki tiklayan kullanici bosluga dusmesin.
  document.querySelectorAll('header button').forEach(function (b) {
    if (b === themeBtn) return;
    b.addEventListener('click', function () { location.href = '/tools/'; });
  });
})();
</script>
HTML;
}

/**
 * Var olan statik bir sayfayi okuyup <main> oncesi ve sonrasini alir.
 * Boylece uretilen blog sayfasi sitenin gercek basligini, menusunu, CSS'ini
 * ve altbilgisini birebir kullanir.
 */
function mt_page_shell(): ?array
{
    static $shell = null;
    if ($shell !== null) {
        return $shell ?: null;
    }
    foreach (['/blog/index.html', '/index.html'] as $rel) {
        $path = mt_public_dir() . $rel;
        if (!is_file($path)) {
            continue;
        }
        $html = (string) file_get_contents($path);
        $open = strpos($html, '<main id="main">');
        $close = strrpos($html, '</main>');
        if ($open === false || $close === false) {
            continue;
        }
        $shell = [
            'before' => mt_strip_next_runtime(substr($html, 0, $open + strlen('<main id="main">'))),
            'after'  => mt_strip_next_runtime(substr($html, $close)) . mt_static_header_js(),
        ];
        return $shell;
    }
    $shell = false;
    return null;
}

/** Kabuktaki <head> alanlarini bu yaziya gore degistirir. */
function mt_apply_head(string $before, array $post, string $canonical): string
{
    $title = htmlspecialchars($post['title'] . ' | MultiTools', ENT_QUOTES, 'UTF-8');
    $desc  = htmlspecialchars(mb_substr($post['excerpt'], 0, 158), ENT_QUOTES, 'UTF-8');

    $before = preg_replace('#<title>.*?</title>#s', '<title>' . $title . '</title>', $before, 1) ?? $before;
    $before = preg_replace(
        '#<meta name="description" content="[^"]*"\s*/?>#',
        '<meta name="description" content="' . $desc . '"/>',
        $before,
        1
    ) ?? $before;
    $before = preg_replace(
        '#<link rel="canonical" href="[^"]*"\s*/?>#',
        '<link rel="canonical" href="' . htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') . '"/>',
        $before,
        1
    ) ?? $before;

    // BlogPosting semasi: arama sonuclarinda tarih ve yazar gosterimi saglar.
    $schema = [
        '@context'         => 'https://schema.org',
        '@type'            => 'BlogPosting',
        'headline'         => $post['title'],
        'description'      => $post['excerpt'],
        'datePublished'    => $post['published_at'],
        'dateModified'     => $post['updated_at'],
        'author'           => ['@type' => 'Organization', 'name' => 'MultiTools'],
        'publisher'        => ['@type' => 'Organization', 'name' => 'MultiTools'],
        'mainEntityOfPage' => $canonical,
    ];
    $json = str_replace(
        ['<', '>', '&'],
        ['<', '>', '&'],
        json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
    return str_replace(
        '</head>',
        '<script type="application/ld+json">' . $json . '</script></head>',
        $before
    );
}

/* ─────────────────────── Sayfa uretimi ─────────────────────── */

/**
 * Arac slug'undan gorunen adi cozer.
 *
 * Arac listesi Next tarafinda derlenmis durumda; burada tekrar tanimlamak
 * yerine uretilmis arac sayfasinin <h1> basligini okuyoruz. Boylece tek
 * dogruluk kaynagi korunur ve arac adi degisirse burasi da guncel kalir.
 */
function mt_tool_name(string $slug): ?string
{
    static $cache = [];
    if (array_key_exists($slug, $cache)) {
        return $cache[$slug];
    }
    $file = mt_public_dir() . '/tools/' . $slug . '/index.html';
    $ad = null;
    if (is_file($file)) {
        $html = (string) file_get_contents($file, false, null, 0, 60000);
        if (preg_match('#<h1[^>]*>(.*?)</h1>#s', $html, $m)) {
            $ad = trim(strip_tags($m[1]));
        }
    }
    return $cache[$slug] = $ad;
}

/** Yazi sonundaki "Bu yazida gecen araclar" bolumu. */
function mt_related_tools_html(string $csv): string
{
    $slugs = array_filter(array_map('trim', explode(',', $csv)));
    $kart = '';
    foreach ($slugs as $slug) {
        if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
            continue;
        }
        $ad = mt_tool_name($slug);
        if ($ad === null) {
            continue; // Arac yayindan kalkmissa kirik baglanti uretme.
        }
        $kart .= '<a href="/tools/' . htmlspecialchars($slug, ENT_QUOTES, 'UTF-8') . '/"'
            . ' class="surface group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg">'
            . '<span class="block text-[15px] font-bold group-hover:text-brand-500">'
            . htmlspecialchars($ad, ENT_QUOTES, 'UTF-8') . '</span>'
            . '<span class="mt-1 block text-xs text-muted">Araci ac &rarr;</span></a>';
    }
    if ($kart === '') {
        return '';
    }
    return '<section class="mt-12 border-t border-[var(--border)] pt-10">'
        . '<h2 class="mb-6 text-xl font-bold">Bu yazida gecen araclar</h2>'
        . '<div class="grid gap-4 sm:grid-cols-3">' . $kart . '</div></section>';
}

function mt_post_url(array $post): string
{
    return rtrim(mt_config()['site_url'], '/') . '/blog/' . $post['slug'] . '/';
}

/** Tek bir yaziyi statik HTML olarak yazar. */
function mt_write_post(array $post): bool
{
    $shell = mt_page_shell();
    if ($shell === null) {
        return false;
    }
    $canonical = mt_post_url($post);
    $tarih = date('j F Y', strtotime((string) $post['published_at']));
    $aylar = ['January'=>'Ocak','February'=>'Şubat','March'=>'Mart','April'=>'Nisan','May'=>'Mayıs',
              'June'=>'Haziran','July'=>'Temmuz','August'=>'Ağustos','September'=>'Eylül',
              'October'=>'Ekim','November'=>'Kasım','December'=>'Aralık'];
    $tarih = strtr($tarih, $aylar);

    $body = '<article class="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">'
        . '<nav class="mb-6 flex items-center gap-2 text-xs text-muted">'
        . '<a href="/" class="hover:text-brand-500">Ana sayfa</a><span>/</span>'
        . '<a href="/blog/" class="hover:text-brand-500">Blog</a></nav>'
        . '<span class="text-[11px] font-bold uppercase tracking-wider text-brand-500">'
        . htmlspecialchars($post['category'], ENT_QUOTES, 'UTF-8') . '</span>'
        . '<h1 class="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">'
        . htmlspecialchars($post['title'], ENT_QUOTES, 'UTF-8') . '</h1>'
        . '<p class="mt-4 text-sm text-muted">' . htmlspecialchars($tarih, ENT_QUOTES, 'UTF-8')
        . ' · ' . (int) $post['reading_time'] . ' dk okuma</p>'
        . '<div class="mt-8 leading-relaxed [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-bold'
        . ' [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc'
        . ' [&_ol_li]:list-decimal [&_p]:my-4 [&_p]:text-muted [&_a]:text-brand-500 [&_a]:underline'
        . ' [&_blockquote]:border-l-2 [&_blockquote]:border-brand-500 [&_blockquote]:pl-4'
        . ' [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 dark:[&_code]:bg-white/10">'
        . mt_markdown((string) $post['body'])
        . '</div>'
        . mt_related_tools_html((string) ($post['related_tools'] ?? ''))
        . '</article>';

    $html = mt_apply_head($shell['before'], $post, $canonical) . $body . $shell['after'];

    $dir = mt_public_dir() . '/blog/' . $post['slug'];
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return false;
    }
    return file_put_contents($dir . '/index.html', $html) !== false;
}

/** Blog liste sayfasini yeniden yazar. */
function mt_write_index(): bool
{
    $shell = mt_page_shell();
    if ($shell === null) {
        return false;
    }
    $posts = mt_db()->query(
        'SELECT * FROM mt_posts WHERE status = "published" ORDER BY published_at DESC'
    )->fetchAll();

    $cards = '';
    foreach ($posts as $p) {
        $cards .= '<a href="/blog/' . htmlspecialchars($p['slug'], ENT_QUOTES, 'UTF-8') . '/"'
            . ' class="surface group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl">'
            . '<span class="text-[11px] font-bold uppercase tracking-wider text-brand-500">'
            . htmlspecialchars($p['category'], ENT_QUOTES, 'UTF-8') . '</span>'
            . '<h2 class="mt-2 text-xl font-bold leading-snug group-hover:text-brand-500">'
            . htmlspecialchars($p['title'], ENT_QUOTES, 'UTF-8') . '</h2>'
            . '<p class="mt-2 flex-1 text-sm leading-relaxed text-muted">'
            . htmlspecialchars($p['excerpt'], ENT_QUOTES, 'UTF-8') . '</p>'
            . '<span class="mt-4 text-xs text-muted">' . date('d.m.Y', strtotime((string) $p['published_at']))
            . ' · ' . (int) $p['reading_time'] . ' dk</span></a>';
    }
    if ($cards === '') {
        $cards = '<p class="text-muted">Henüz yazı yayınlanmadı.</p>';
    }

    $body = '<div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">'
        . '<h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Blog</h1>'
        . '<p class="mt-3 max-w-2xl text-muted">Araçlardan en iyi verimi almanız için pratik rehberler.</p>'
        . '<div class="mt-10 grid gap-4 sm:grid-cols-2">' . $cards . '</div></div>';

    $head = preg_replace(
        '#<link rel="canonical" href="[^"]*"\s*/?>#',
        '<link rel="canonical" href="' . rtrim(mt_config()['site_url'], '/') . '/blog/"/>',
        $shell['before'],
        1
    ) ?? $shell['before'];

    return file_put_contents(mt_public_dir() . '/blog/index.html', $head . $body . $shell['after']) !== false;
}

/** Blog yazilari icin ayri sitemap; robots.txt her ikisini de listeler. */
function mt_write_sitemap(): bool
{
    $base  = rtrim(mt_config()['site_url'], '/');
    $posts = mt_db()->query(
        'SELECT slug, updated_at FROM mt_posts WHERE status = "published" ORDER BY published_at DESC'
    )->fetchAll();

    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
        . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($posts as $p) {
        $xml .= '  <url><loc>' . htmlspecialchars($base . '/blog/' . $p['slug'] . '/', ENT_QUOTES, 'UTF-8')
             . '</loc><lastmod>' . date('Y-m-d', strtotime((string) $p['updated_at']))
             . '</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>' . "\n";
    }
    $xml .= '</urlset>' . "\n";

    $ok = file_put_contents(mt_public_dir() . '/sitemap-blog.xml', $xml) !== false;

    // robots.txt icine ikinci sitemap satirini ekle (yoksa).
    $robots = mt_public_dir() . '/robots.txt';
    if (is_file($robots)) {
        $icerik = (string) file_get_contents($robots);
        $satir  = 'Sitemap: ' . $base . '/sitemap-blog.xml';
        if (!str_contains($icerik, $satir)) {
            file_put_contents($robots, rtrim($icerik) . "\n" . $satir . "\n");
        }
    }
    return $ok;
}

/** Yayindan kaldirilan yazinin statik dosyasini siler. */
function mt_remove_post_files(string $slug): void
{
    $dir = mt_public_dir() . '/blog/' . $slug;
    if (is_file($dir . '/index.html')) {
        unlink($dir . '/index.html');
    }
    if (is_dir($dir)) {
        @rmdir($dir);
    }
}

/** Tum yayinlanmis yazilari yeniden uretir. Site yeniden yuklendikten sonra kullanilir. */
function mt_rebuild_all(): array
{
    $posts = mt_db()->query('SELECT * FROM mt_posts WHERE status = "published"')->fetchAll();
    $ok = 0;
    $fail = 0;
    foreach ($posts as $p) {
        mt_write_post($p) ? $ok++ : $fail++;
    }
    mt_write_index();
    mt_write_sitemap();
    return ['ok' => $ok, 'fail' => $fail];
}
