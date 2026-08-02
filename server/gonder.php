<?php
/**
 * Ziyaretçiden gelen içerik alıcısı: iletişim mesajları ve blog yorumları.
 * `public_html/mt/gonder.php` olarak yayınlanır.
 *
 * Korumalar:
 *  · Aynı kökenden gelme zorunluluğu (Origin denetimi)
 *  · Saatlik hız sınırı (ziyaretçi hash'i başına)
 *  · Bal küpü alanı — botlar doldurur, insanlar görmez
 *  · Form açılış zamanı: 3 saniyeden hızlı gönderim reddedilir
 *  · Uzunluk sınırları ve bağlantı sayısı denetimi (spam)
 *
 * Yorumlar `bekliyor` durumunda kaydedilir; yönetim panelinden onaylanana
 * kadar sitede görünmez. Onaysız yayın, spam bağlantılarının siteye SEO
 * zararı vermesi demektir.
 */
declare(strict_types=1);

define('MT_APP', true);

$mtLib = null;
$dir = __DIR__;
for ($i = 0; $i < 5; $i++) {
    if (is_file($dir . '/mt-lib/lib.php')) { $mtLib = $dir . '/mt-lib/lib.php'; break; }
    $ust = dirname($dir);
    if ($ust === $dir) { break; }
    $dir = $ust;
}
if ($mtLib === null) {
    http_response_code(503);
    exit('{"ok":false}');
}
require $mtLib;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$config  = mt_config();
$siteUrl = rtrim($config['site_url'], '/');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && rtrim($origin, '/') !== $siteUrl) {
    http_response_code(403);
    exit('{"ok":false,"hata":"koken"}');
}
header('Access-Control-Allow-Origin: ' . $siteUrl);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit('{"ok":false}');
}

$ham = file_get_contents('php://input', false, null, 0, 32768);
$in  = json_decode((string) $ham, true);
if (!is_array($in)) {
    http_response_code(400);
    exit('{"ok":false,"hata":"bicim"}');
}

$cikis = static function (int $kod, string $mesaj): never {
    http_response_code($kod);
    exit(json_encode(['ok' => false, 'hata' => $mesaj], JSON_UNESCAPED_UNICODE));
};

/* ─────────────────────────── ortak korumalar ─────────────────────────── */

// Bal küpü: gizli alan doldurulmuşsa gönderen bir bottur. Başarılı yanıt
// veriyoruz ki bot hatayı görüp yöntem değiştirmesin.
if (trim((string) ($in['website'] ?? '')) !== '') {
    exit('{"ok":true}');
}

// İnsan bir formu 3 saniyeden hızlı dolduramaz.
$acilis = (int) ($in['t'] ?? 0);
if ($acilis > 0 && (time() * 1000 - $acilis) < 3000) {
    $cikis(429, 'cok-hizli');
}

$hash = mt_visitor_hash();
if (!mt_rate_ok($hash . ':gonder', 8)) {
    $cikis(429, 'limit');
}

$ua = mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
if (mt_device($ua) === 'bot') {
    exit('{"ok":true,"atlandi":"bot"}');
}

/** Metni kırpar ve kontrol karakterlerini temizler. */
$temizle = static function (mixed $v, int $enUzun): string {
    $s = is_string($v) ? $v : '';
    $s = preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f]/u', '', $s) ?? '';
    return mb_substr(trim($s), 0, $enUzun);
};

/** Bağlantı yoğunluğu spam'in en güvenilir işaretidir. */
$cokLink = static function (string $s): bool {
    return preg_match_all('#https?://|www\.#i', $s) >= 2;
};

$tur = (string) ($in['tur'] ?? '');
$db  = mt_db();

/* ─────────────────────────── iletişim mesajı ─────────────────────────── */

if ($tur === 'mesaj') {
    $ad     = $temizle($in['ad'] ?? '', 80);
    $eposta = $temizle($in['eposta'] ?? '', 190);
    $konu   = $temizle($in['konu'] ?? '', 160);
    $mesaj  = $temizle($in['mesaj'] ?? '', 5000);

    if (mb_strlen($ad) < 2)                          { $cikis(422, 'ad'); }
    if (!filter_var($eposta, FILTER_VALIDATE_EMAIL)) { $cikis(422, 'eposta'); }
    if (mb_strlen($mesaj) < 10)                      { $cikis(422, 'mesaj'); }
    if ($cokLink($mesaj))                            { $cikis(422, 'spam'); }

    $db->prepare(
        'INSERT INTO mt_messages (ad, eposta, konu, mesaj, visitor_hash, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())'
    )->execute([$ad, $eposta, $konu, $mesaj, $hash, $ua]);

    exit('{"ok":true}');
}

/* ─────────────────────────────── yorum ─────────────────────────────── */

if ($tur === 'yorum') {
    $slug  = $temizle($in['slug'] ?? '', 90);
    $ad    = $temizle($in['ad'] ?? '', 60);
    $eposta = $temizle($in['eposta'] ?? '', 190);
    $govde = $temizle($in['govde'] ?? '', 2000);

    if (mb_strlen($ad) < 2)     { $cikis(422, 'ad'); }
    if (mb_strlen($govde) < 5)  { $cikis(422, 'yorum'); }
    if ($cokLink($govde))       { $cikis(422, 'spam'); }
    // E-posta isteğe bağlı; verilmişse geçerli olmalı.
    if ($eposta !== '' && !filter_var($eposta, FILTER_VALIDATE_EMAIL)) {
        $cikis(422, 'eposta');
    }

    $st = $db->prepare('SELECT id FROM mt_posts WHERE slug = ? AND status = "published"');
    $st->execute([$slug]);
    $postId = (int) $st->fetchColumn();
    if ($postId === 0) {
        $cikis(404, 'yazi');
    }

    // Aynı ziyaretçinin aynı yazıya arka arkaya aynı metni göndermesini engelle.
    $tekrar = $db->prepare(
        'SELECT COUNT(*) FROM mt_comments
         WHERE post_id = ? AND visitor_hash = ? AND govde = ?
           AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)'
    );
    $tekrar->execute([$postId, $hash, $govde]);
    if ((int) $tekrar->fetchColumn() > 0) {
        exit('{"ok":true,"durum":"bekliyor"}');
    }

    $db->prepare(
        'INSERT INTO mt_comments (post_id, ad, eposta, govde, durum, visitor_hash, created_at)
         VALUES (?, ?, ?, ?, "bekliyor", ?, UTC_TIMESTAMP())'
    )->execute([$postId, $ad, $eposta, $govde, $hash]);

    exit('{"ok":true,"durum":"bekliyor"}');
}

$cikis(400, 'tur');
