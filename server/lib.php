<?php
/**
 * Ortak altyapi: yapilandirma, veritabani, guvenlik yardimcilari.
 *
 * Bu dosya public_html DISINDA durur ve dogrudan cagrilamaz.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

// Uretimde hata detaylari kullaniciya gosterilmez (bilgi sizintisi olur).
ini_set('display_errors', '0');
error_reporting(E_ALL);

/**
 * mt-config.php dosyasini bulur.
 *
 * Sabit sayida ust dizine cikmak yerine yukari dogru arar; boylece dosya
 * duzeni degisse de (ornegin site bir alt alan adina tasinsa da) calisir.
 * Arama public_html'e ULASINCA DURMAZ ama config'i webroot icinde bulursa
 * kabul etmez - orada durursa tarayiciyla indirilebilir olurdu.
 */
function mt_config_path(): ?string
{
    $dir = __DIR__;
    for ($i = 0; $i < 5; $i++) {
        $candidate = $dir . '/mt-config.php';
        if (is_file($candidate)) {
            return $candidate;
        }
        $parent = dirname($dir);
        if ($parent === $dir) {
            break;
        }
        $dir = $parent;
    }
    return null;
}

function mt_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $path = mt_config_path();
    if ($path === null) {
        mt_setup_screen(
            'Kurulum gerekli',
            'Yapilandirma dosyasi bulunamadi.',
            [
                '<code>mt-config.example.php</code> dosyasini <code>mt-config.php</code> olarak kopyalayin.',
                'Beklenen konum: <code>' . h(dirname(__DIR__) . '/mt-config.php') . '</code>',
                'Veritabani bilgilerini ve <code>hash_salt</code> degerini doldurun.',
                'Veritabaninda <code>schema.sql</code> dosyasini calistirin.',
                'Parolayi belirlemek icin <code>bash ~/parola-belirle.sh</code> komutunu calistirin.',
            ],
            null
        );
    }
    $loaded = require $path;
    if (!is_array($loaded)) {
        mt_setup_screen(
            'Yapilandirma hatali',
            'mt-config.php bir dizi (array) dondurmuyor.',
            ['Dosyanin <code>return [ ... ];</code> ile bittiginden emin olun.'],
            null
        );
    }
    foreach (['db_host', 'db_name', 'db_user', 'hash_salt'] as $key) {
        if (empty($loaded[$key])) {
            mt_setup_screen(
                'Yapilandirma eksik',
                "mt-config.php dosyasindaki '{$key}' alani bos birakilmis.",
                ['Dosyayi acip <code>' . h($key) . '</code> degerini doldurun.'],
                null
            );
        }
    }
    if (empty($loaded['admin_hash'])) {
        // Tek eksik parola: kullaniciyi zaten tamamlanmis adimlarla mesgul etme.
        mt_setup_screen(
            'Son adim: parolanizi belirleyin',
            'Veritabani, tablolar ve yapilandirma hazir. Geriye yalnizca yonetim '
            . 'parolasini secmek kaldi.',
            [
                'SSH ile sunucuya baglanin.',
                'Asagidaki komutu calistirin - parola ekranda gorunmez.',
                'Bu sayfayi yenileyin; giris ekrani gelecek.',
            ],
            'bash ~/parola-belirle.sh'
        );
    }
    $config = $loaded;
    return $config;
}

/**
 * Yapilandirma tamamlanmadan panele girilirse bos bir 500 yerine
 * yalnizca GERCEKTEN eksik olan adimi gosterir.
 */
function mt_setup_screen(
    string $title,
    string $intro,
    array $steps = [],
    ?string $command = null
): never {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');

    echo '<!doctype html><html lang="tr"><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex,nofollow">'
        . '<title>' . h($title) . '</title>'
        . '<style>'
        . 'body{font:15px/1.65 system-ui,-apple-system,Segoe UI,sans-serif;background:#0b0f1c;'
        . 'color:#e9edf7;margin:0;padding:48px 20px}'
        . '.b{max-width:620px;margin:0 auto;background:#141a2e;border:1px solid #232b45;'
        . 'border-radius:16px;padding:30px}'
        . 'h1{font-size:21px;margin:0 0 8px}'
        . 'p.m{color:#8d97b4;font-size:14px;margin:0 0 18px}'
        . 'ol{padding-left:20px;margin:0}li{margin:9px 0;color:#c8d0e4;font-size:14px}'
        . 'pre{background:#080c18;border:1px solid #232b45;border-radius:10px;padding:14px 16px;'
        . 'margin:18px 0 6px;overflow-x:auto;font-size:14px;color:#8fd3ff}'
        . 'code{background:#0e1425;padding:2px 6px;border-radius:5px;font-size:13px}'
        . '.f{color:#6b7699;font-size:12px;margin-top:22px;border-top:1px solid #232b45;padding-top:14px}'
        . '</style>'
        . '<div class="b">'
        . '<h1>' . h($title) . '</h1>'
        . '<p class="m">' . h($intro) . '</p>';

    if ($steps !== []) {
        echo '<ol>';
        foreach ($steps as $step) {
            // Adimlar kod tarafindan yazilir; icindeki <code> etiketi korunur.
            echo '<li>' . $step . '</li>';
        }
        echo '</ol>';
    }

    if ($command !== null) {
        echo '<pre>' . h($command) . '</pre>';
    }

    echo '<p class="f">Bu sayfa yalnizca kurulum tamamlanana kadar gorunur.</p>'
        . '</div></html>';
    exit;
}

function mt_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $c = mt_config();
    try {
        $pdo = new PDO(
            "mysql:host={$c['db_host']};dbname={$c['db_name']};charset=utf8mb4",
            $c['db_user'],
            $c['db_pass'],
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Gercek prepared statement kullan; emulasyon SQL injection
                // yuzeyini geri acabilir.
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    } catch (Throwable $e) {
        error_log('DB baglanti hatasi: ' . $e->getMessage());
        http_response_code(503);
        exit('Servis gecici olarak kullanilamiyor.');
    }
    return $pdo;
}

/** Ziyaretcinin IP'sini gunluk salt ile hashler - ham IP hicbir yerde durmaz. */
function mt_visitor_hash(): string
{
    $c    = mt_config();
    $ip   = mt_client_ip();
    $salt = $c['hash_salt'] . gmdate('Y-m-d');
    return substr(hash('sha256', $ip . $salt), 0, 16);
}

function mt_client_ip(): string
{
    // Hostinger LiteSpeed proxy arkasindan gelen gercek IP.
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $key) {
        if (empty($_SERVER[$key])) {
            continue;
        }
        $value = explode(',', (string) $_SERVER[$key])[0];
        $value = trim($value);
        if (filter_var($value, FILTER_VALIDATE_IP)) {
            return $value;
        }
    }
    return '0.0.0.0';
}

/**
 * Dakikalik hiz siniri. Asilirsa false doner.
 */
function mt_rate_ok(string $hash, int $limit = 60): bool
{
    $window = (int) floor(time() / 60);
    $db     = mt_db();

    $db->prepare(
        'INSERT INTO mt_rate (visitor_hash, window_start, hits) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE hits = hits + 1'
    )->execute([$hash, $window]);

    $stmt = $db->prepare('SELECT hits FROM mt_rate WHERE visitor_hash = ? AND window_start = ?');
    $stmt->execute([$hash, $window]);
    $hits = (int) ($stmt->fetchColumn() ?: 0);

    // Eski pencereleri ara sira temizle.
    if (random_int(1, 100) === 1) {
        $db->prepare('DELETE FROM mt_rate WHERE window_start < ?')->execute([$window - 120]);
    }

    return $hits <= $limit;
}

/** Basit cihaz siniflandirmasi - parmak izi cikarmaz. */
function mt_device(string $ua): string
{
    $ua = strtolower($ua);
    if ($ua === '' || preg_match('/bot|crawler|spider|curl|wget|headless|preview|slurp|fetch/', $ua)) {
        return 'bot';
    }
    if (str_contains($ua, 'ipad') || str_contains($ua, 'tablet')) {
        return 'tablet';
    }
    if (preg_match('/mobi|android|iphone/', $ua)) {
        return 'mobile';
    }
    return 'desktop';
}

/**
 * Tarayici kimligini adlandirir.
 *
 * Arama motoru botlari SEO acisindan degerli bilgidir: Googlebot'un hangi
 * sayfalari ne siklikta taradigini gormek, indekslenme sorunlarini erkenden
 * yakalamayi saglar. Bu yuzden botlari atmak yerine ayri etiketle kaydediyoruz;
 * ziyaretci istatistiklerine karismalari ise sorgularda engelleniyor.
 */
function mt_bot_name(string $ua): ?string
{
    $ua = strtolower($ua);
    $bilinen = [
        'googlebot'      => 'Googlebot',
        'google-inspect' => 'Google Inspection',
        'adsbot-google'  => 'AdsBot (Google)',
        'mediapartners'  => 'AdSense Crawler',
        'bingbot'        => 'Bingbot',
        'yandex'         => 'YandexBot',
        'duckduckbot'    => 'DuckDuckBot',
        'baiduspider'    => 'Baiduspider',
        'applebot'       => 'Applebot',
        'facebookexternalhit' => 'Facebook',
        'twitterbot'     => 'Twitterbot',
        'linkedinbot'    => 'LinkedInBot',
        'whatsapp'       => 'WhatsApp',
        'telegrambot'    => 'TelegramBot',
        'ahrefsbot'      => 'AhrefsBot',
        'semrushbot'     => 'SemrushBot',
        'mj12bot'        => 'MJ12bot',
        'dotbot'         => 'DotBot',
        'petalbot'       => 'PetalBot',
        'gptbot'         => 'GPTBot',
        'claudebot'      => 'ClaudeBot',
        'perplexity'     => 'PerplexityBot',
    ];
    foreach ($bilinen as $iz => $ad) {
        if (str_contains($ua, $iz)) {
            return $ad;
        }
    }
    return 'Diger bot';
}

/**
 * Tarayici ailesini kaba sekilde belirler.
 *
 * Bilincli olarak SURUM NUMARASI ALMIYORUZ: surum + isletim sistemi + ekran
 * boyutu birlesimi parmak izi olusturmaya yaklasir. Yalnizca "hangi tarayicida
 * sorun yasaniyor" sorusuna yetecek kadar bilgi tutuyoruz.
 */
function mt_browser(string $ua): string
{
    $ua = strtolower($ua);
    return match (true) {
        str_contains($ua, 'edg/')                             => 'Edge',
        str_contains($ua, 'opr/') || str_contains($ua, 'opera') => 'Opera',
        str_contains($ua, 'samsungbrowser')                   => 'Samsung Internet',
        str_contains($ua, 'firefox')                          => 'Firefox',
        str_contains($ua, 'chrome') || str_contains($ua, 'crios') => 'Chrome',
        str_contains($ua, 'safari')                           => 'Safari',
        default                                               => 'Diger',
    };
}

function mt_os(string $ua): string
{
    $ua = strtolower($ua);
    return match (true) {
        str_contains($ua, 'android')                          => 'Android',
        str_contains($ua, 'iphone') || str_contains($ua, 'ipad') => 'iOS',
        str_contains($ua, 'windows')                          => 'Windows',
        str_contains($ua, 'mac os')                           => 'macOS',
        str_contains($ua, 'linux')                            => 'Linux',
        default                                               => 'Diger',
    };
}

/** Referans URL'sinden yalnizca alan adini alir. */
function mt_referrer_host(string $referrer): ?string
{
    if ($referrer === '') {
        return null;
    }
    $host = parse_url($referrer, PHP_URL_HOST);
    if (!is_string($host) || $host === '') {
        return null;
    }
    $host = strtolower(preg_replace('/^www\./', '', $host));
    // Kendi sitemizden gelenler "dogrudan" sayilir.
    if ($host === parse_url(mt_config()['site_url'], PHP_URL_HOST)) {
        return null;
    }
    return substr($host, 0, 120);
}

/**
 * Saniyeyi okunur sureye cevirir. Panelin birden fazla bolumu kullandigi icin
 * (pano, davranis, kayit oynatici) burada, ortak kutuphanede duruyor.
 */
function mt_sure(float $saniye): string
{
    if ($saniye < 60) {
        return round($saniye) . ' sn';
    }
    return floor($saniye / 60) . ' dk '
        . str_pad((string) (round($saniye) % 60), 2, '0', STR_PAD_LEFT) . ' sn';
}

/** Cikti kaciscisi - HTML'e basilan her degisken bundan gecer. */
function h(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
