<?php
/**
 * Olay toplama ucu. public_html/mt/collect.php olarak yayinlanir.
 *
 * Tasarim notlari:
 * - Cerez KULLANMAZ. Ziyaretci kimligi gunluk degisen bir salt ile hashlenir,
 *   yani ertesi gun ayni kisi baska bir hash uretir. Bu yuzden cerez onayi
 *   gerektirmez ve KVKK acisindan kisisel veri islenmis olmaz.
 * - Yalnizca beyaz listedeki olay turleri ve sinirli uzunlukta alanlar kabul
 *   edilir; her sorgu hazir ifade (prepared statement) ile calisir.
 */
declare(strict_types=1);

define('MT_APP', true);
// lib.php yukari dogru aranir; boylece dosya duzeni degisse de bulunur.
$mtLib = null;
$dir = __DIR__;
for ($i = 0; $i < 5; $i++) {
    if (is_file($dir . '/mt-lib/lib.php')) { $mtLib = $dir . '/mt-lib/lib.php'; break; }
    $parent = dirname($dir);
    if ($parent === $dir) { break; }
    $dir = $parent;
}
if ($mtLib === null) {
    http_response_code(503);
    exit('Kurulum tamamlanmamis: mt-lib/lib.php bulunamadi.');
}
require $mtLib;
require dirname($mtLib) . '/audit.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$config = mt_config();

// --- CORS: yalnizca kendi alan adimiz ---------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && rtrim($origin, '/') !== rtrim($config['site_url'], '/')) {
    http_response_code(403);
    exit('{"ok":false}');
}
header('Access-Control-Allow-Origin: ' . rtrim($config['site_url'], '/'));

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit('{"ok":false}');
}

// --- Govde ------------------------------------------------------------------
$raw = file_get_contents('php://input', false, null, 0, 2048);
$in  = json_decode((string) $raw, true);
if (!is_array($in)) {
    http_response_code(400);
    exit('{"ok":false}');
}

$allowedTypes = ['pageview', 'page_leave', 'tool_run', 'tool_result', 'tool_error',
                 'affiliate_click', 'outbound'];
$type = (string) ($in['type'] ?? '');
if (!in_array($type, $allowedTypes, true)) {
    http_response_code(400);
    exit('{"ok":false}');
}

// --- Hiz siniri -------------------------------------------------------------
$hash = mt_visitor_hash();
if (!mt_rate_ok($hash, 120)) {
    http_response_code(429);
    exit('{"ok":false,"error":"rate"}');
}

// --- Alan temizligi ---------------------------------------------------------
/** Yalnizca site ici, guvenli karakterlerden olusan yollari kabul et. */
$path = (string) ($in['path'] ?? '/');
if ($path === '' || $path[0] !== '/' || !preg_match('#^/[A-Za-z0-9/_.\-]{0,254}$#', $path)) {
    $path = '/';
}

$slug = null;
if (!empty($in['tool'])) {
    $candidate = (string) $in['tool'];
    // Slug kurali: yalnizca kucuk harf, rakam ve tire.
    if (preg_match('/^[a-z0-9-]{1,80}$/', $candidate)) {
        $slug = $candidate;
    }
}

$label = null;
if (!empty($in['label'])) {
    $label = mb_substr(preg_replace('/[^\p{L}\p{N} _.\-]/u', '', (string) $in['label']), 0, 120);
    if ($label === '') {
        $label = null;
    }
}

// --- Davranis alanlari (hepsi sinirlandirilir) ------------------------------
$ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');

// Sayfada gecirilen sure: 12 saatten uzun degerler sekmesi acik kalmis
// oturumlardir, ortalamayi bozmasin diye kirpiyoruz.
$duration = null;
if (isset($in['duration']) && is_numeric($in['duration'])) {
    $duration = max(0, min((int) $in['duration'], 12 * 3600 * 1000));
}

$scroll = null;
if (isset($in['scroll']) && is_numeric($in['scroll'])) {
    $scroll = max(0, min((int) $in['scroll'], 100));
}

$viewport = null;
if (isset($in['vw']) && is_numeric($in['vw'])) {
    $viewport = max(0, min((int) $in['vw'], 20000));
}

/**
 * Tam referans adresi: yalnizca alan adi degil, hangi sayfadan gelindigi.
 * "com.linkedin.android" gibi bir host tek basina ise yaramaz; tam adres
 * hangi paylasimdan gelindigini gosterir. Kendi sitemizden gelenler atlanir.
 */
$referrerUrl = null;
$refRaw = (string) ($in['referrer'] ?? '');
if ($refRaw !== '' && preg_match('#^https?://#i', $refRaw)) {
    $refHost = (string) parse_url($refRaw, PHP_URL_HOST);
    $ownHost = (string) parse_url($config['site_url'], PHP_URL_HOST);
    if ($refHost !== '' && stripos($refHost, $ownHost) === false) {
        $referrerUrl = mb_substr($refRaw, 0, 400);
    }
}

$device  = mt_device($ua);
$country = null;
if (!empty($_SERVER['HTTP_CF_IPCOUNTRY']) && preg_match('/^[A-Z]{2}$/', $_SERVER['HTTP_CF_IPCOUNTRY'])) {
    $country = $_SERVER['HTTP_CF_IPCOUNTRY'];
}

// Botlari ATMIYORUZ: hangi arama motorunun neyi taradigini gormek SEO icin
// degerli. Ziyaretci istatistiklerine karismamalari sorgu tarafinda
// (device <> "bot") saglanir. Bot adi etiket alanina yazilir.
if ($device === 'bot') {
    $label = mt_bot_name((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    $type  = 'pageview';
}

try {
    mt_db()->prepare(
        'INSERT INTO mt_events
           (event_type, path, tool_slug, label, duration_ms, scroll_pct, browser, os,
            viewport_w, referrer_host, referrer_url, device, country, visitor_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())'
    )->execute([
        $type,
        $path,
        $slug,
        $label,
        $duration,
        $scroll,
        mt_browser($ua),
        mt_os($ua),
        $viewport,
        mt_referrer_host($refRaw),
        $referrerUrl,
        $device,
        $country,
        $hash,
    ]);
} catch (Throwable $e) {
    error_log('collect hatasi: ' . $e->getMessage());
    http_response_code(500);
    exit('{"ok":false}');
}

// Konum yalnizca ilk sayfa gosteriminde cozulur: hash gunluk degistigi icin
// ziyaretci basina gunde bir dis sorgu yapilir. Bot trafigi icin atlanir.
if ($device !== 'bot' && $type === 'pageview') {
    mt_geo_enrich($hash);
}

echo '{"ok":true}';
