<?php
/**
 * IndexNow bildirimi.
 *
 * Bing, Yandex, Seznam ve Naver bu protokolu destekler: yeni veya guncellenen
 * URL'leri bir istekle bildirirsiniz, arama motoru siteyi kendi tarama sirasini
 * beklemeden ziyaret eder. Hesap veya dogrulama gerekmez; tek sart, sitenin
 * kokunde anahtarla ayni adi tasiyan bir metin dosyasi bulunmasi.
 *
 * Google IndexNow'i DESTEKLEMEZ. Google icin Search Console uzerinden site
 * haritasi gonderimi gerekir; bu betik onun yerine gecmez.
 *
 * Kullanim (domain kokunde):  php indexnow.php
 */
declare(strict_types=1);

define('MT_APP', true);
require __DIR__ . '/mt-lib/lib.php';
ini_set('display_errors', '1');

$config = mt_config();
$kok    = rtrim($config['site_url'], '/');
$host   = (string) parse_url($kok, PHP_URL_HOST);
$public = dirname(mt_config_path()) . '/public_html';

/**
 * Anahtar bir kez uretilir ve saklanir. Her calistirmada degisirse, arama
 * motoru onceki bildirimleri dogrulayamaz.
 */
$anahtarDosya = dirname(mt_config_path()) . '/indexnow-key.txt';
if (is_file($anahtarDosya)) {
    $anahtar = trim((string) file_get_contents($anahtarDosya));
} else {
    $anahtar = bin2hex(random_bytes(16));
    file_put_contents($anahtarDosya, $anahtar);
    chmod($anahtarDosya, 0600);
    echo "Yeni anahtar uretildi.\n";
}

// Dogrulama dosyasi: icerigi anahtarin kendisi olmali.
$dogrulama = $public . '/' . $anahtar . '.txt';
if (!is_file($dogrulama)) {
    file_put_contents($dogrulama, $anahtar);
    chmod($dogrulama, 0644);
    echo "Dogrulama dosyasi yazildi: /{$anahtar}.txt\n";
}

/** Iki site haritasindaki tum URL'leri toplar. */
function mt_sitemap_urller(string $kok): array
{
    $urller = [];
    foreach (['/sitemap.xml', '/sitemap-blog.xml'] as $sm) {
        $xml = @file_get_contents($kok . $sm);
        if ($xml === false) {
            continue;
        }
        if (preg_match_all('#<loc>([^<]+)</loc>#', $xml, $m)) {
            $urller = array_merge($urller, $m[1]);
        }
    }
    return array_values(array_unique($urller));
}

$urller = mt_sitemap_urller($kok);
if ($urller === []) {
    exit("Site haritasindan URL okunamadi.\n");
}

// IndexNow tek istekte en fazla 10.000 URL kabul eder; bizde cok altinda.
$govde = json_encode([
    'host'        => $host,
    'key'         => $anahtar,
    'keyLocation' => $kok . '/' . $anahtar . '.txt',
    'urlList'     => $urller,
], JSON_UNESCAPED_SLASHES);

$ch = curl_init('https://api.indexnow.org/indexnow');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $govde,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json; charset=utf-8'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
]);
$yanit = curl_exec($ch);
$kod   = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

printf("%d URL bildirildi. Yanit: HTTP %d %s\n", count($urller), $kod, trim((string) $yanit));

/*
 * IndexNow yanit kodlari:
 *   200 - kabul edildi
 *   202 - kabul edildi, anahtar dogrulamasi bekliyor
 *   400 - istek bicimi hatali
 *   403 - anahtar dogrulanamadi (kokdeki .txt dosyasina erisilemiyor)
 *   422 - URL'ler bildirilen host ile uyusmuyor
 *   429 - cok fazla istek
 */
if ($kod === 200 || $kod === 202) {
    echo "Basarili. Bing ve Yandex siteyi kisa surede taramaya baslar.\n";
} else {
    echo "Bildirim kabul edilmedi; yukaridaki koda bakin.\n";
}
