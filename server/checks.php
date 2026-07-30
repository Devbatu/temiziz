<?php
/**
 * Site saglik kontrolleri.
 *
 * Her kontrol ['durum' => ok|uyari|hata|bilgi, 'baslik', 'detay'] dondurur.
 * Tumu sunucu tarafindan, disaridan bakan bir istemci gibi calisir.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

/** Tek bir HTTP istegi yapar; basliklari ve govdeyi dondurur. */
function mt_fetch(string $url, bool $followRedirects = false, int $timeout = 12): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER         => true,
        CURLOPT_NOBODY         => false,
        CURLOPT_FOLLOWLOCATION => $followRedirects,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_USERAGENT      => 'MultiTools-HealthCheck/1.0',
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $raw    = curl_exec($ch);
    $err    = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $hlen   = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $time   = (float) curl_getinfo($ch, CURLINFO_TOTAL_TIME);
    curl_close($ch);

    if ($raw === false) {
        return ['ok' => false, 'status' => 0, 'headers' => '', 'body' => '', 'error' => $err, 'time' => $time];
    }
    return [
        'ok'      => true,
        'status'  => $status,
        'headers' => substr($raw, 0, $hlen),
        'body'    => substr($raw, $hlen),
        'error'   => '',
        'time'    => $time,
    ];
}

function mt_check(string $durum, string $baslik, string $detay): array
{
    return ['durum' => $durum, 'baslik' => $baslik, 'detay' => $detay];
}

/**
 * Tum kontrolleri calistirir. Yavas oldugu icin yalnizca "Kontrol" sekmesinde
 * ve kullanici istedigi anda cagrilir.
 */
function mt_run_checks(): array
{
    $c    = mt_config();
    $base = rtrim($c['site_url'], '/');
    $out  = [];

    // --- 1. Site ayakta mi -------------------------------------------------
    $r = mt_fetch($base . '/');
    if (!$r['ok']) {
        $out[] = mt_check('hata', 'Site erisimi', 'Siteye ulasilamadi: ' . $r['error']);
    } elseif ($r['status'] === 200) {
        $ms = (int) round($r['time'] * 1000);
        $d  = $ms < 800 ? 'ok' : ($ms < 2000 ? 'uyari' : 'hata');
        $out[] = mt_check($d, 'Site erisimi', "HTTP 200 - yanit suresi {$ms} ms");
    } else {
        $out[] = mt_check('hata', 'Site erisimi', 'Beklenmeyen durum kodu: ' . $r['status']);
    }

    // --- 2. SSL sertifikasi ------------------------------------------------
    $host = (string) parse_url($base, PHP_URL_HOST);
    $ctx  = stream_context_create(['ssl' => ['capture_peer_cert' => true, 'verify_peer' => false, 'verify_peer_name' => false]]);
    $sock = @stream_socket_client("ssl://{$host}:443", $errno, $errstr, 8, STREAM_CLIENT_CONNECT, $ctx);
    if ($sock === false) {
        $out[] = mt_check('hata', 'SSL sertifikasi', 'Baglanti kurulamadi: ' . $errstr);
    } else {
        $params = stream_context_get_params($sock);
        $cert   = openssl_x509_parse($params['options']['ssl']['peer_certificate']);
        fclose($sock);
        $kalan = (int) floor(($cert['validTo_time_t'] - time()) / 86400);
        $d = $kalan <= 0 ? 'hata' : ($kalan < 15 ? 'uyari' : 'ok');
        $veren = $cert['issuer']['O'] ?? $cert['issuer']['CN'] ?? 'bilinmiyor';
        $out[] = mt_check($d, 'SSL sertifikasi', "{$kalan} gun kaldi - veren: {$veren}");
    }

    // --- 3. www yonlendirmesi ----------------------------------------------
    $r = mt_fetch('https://www.' . $host . '/');
    if (!$r['ok']) {
        $out[] = mt_check('bilgi', 'www yonlendirmesi', 'www alt alan adi yanit vermiyor (sorun degil).');
    } elseif (in_array($r['status'], [301, 308], true)) {
        $out[] = mt_check('ok', 'www yonlendirmesi', 'www adresi kalici olarak ana adrese yonlendiriliyor.');
    } elseif ($r['status'] === 200) {
        $out[] = mt_check('hata', 'www yonlendirmesi',
            'www adresi de 200 donuyor. Ayni icerik iki adreste yayinlaniyor - arama motorlari icin yinelenen icerik.');
    } else {
        $out[] = mt_check('uyari', 'www yonlendirmesi', 'Beklenmeyen durum: ' . $r['status']);
    }

    // --- 4. HTTP -> HTTPS ---------------------------------------------------
    $r = mt_fetch('http://' . $host . '/');
    $d = ($r['ok'] && in_array($r['status'], [301, 308], true)) ? 'ok' : 'uyari';
    $out[] = mt_check($d, 'HTTPS yonlendirmesi',
        $d === 'ok' ? 'http adresleri https e yonlendiriliyor.' : 'http adresi kalici yonlendirme dondurmedi.');

    // --- 5. SEO dosyalari ---------------------------------------------------
    foreach ([
        '/robots.txt'  => 'Sitemap:',
        '/sitemap.xml' => '<urlset',
        '/ads.txt'     => null,
    ] as $yol => $beklenen) {
        $r = mt_fetch($base . $yol);
        if (!$r['ok'] || $r['status'] !== 200) {
            $out[] = mt_check('hata', $yol, 'Erisilemedi (durum: ' . ($r['status'] ?: 'baglanti yok') . ')');
            continue;
        }
        if ($yol === '/sitemap.xml') {
            $adet = substr_count($r['body'], '<loc>');
            $out[] = mt_check($adet > 0 ? 'ok' : 'hata', $yol, "{$adet} adres listeleniyor");
        } elseif ($yol === '/ads.txt') {
            $satir = count(array_filter(explode("\n", trim($r['body']))));
            $out[] = mt_check($satir > 0 ? 'ok' : 'bilgi', $yol,
                $satir > 0 ? "{$satir} satir tanimli" : 'Bos - AdSense kimligi henuz girilmemis.');
        } else {
            $var = $beklenen === null || str_contains($r['body'], $beklenen);
            $out[] = mt_check($var ? 'ok' : 'uyari', $yol, $var ? 'Gecerli' : "Beklenen icerik yok: {$beklenen}");
        }
    }

    // --- 6. Yapilandirma sizintisi (KRITIK) ---------------------------------
    $sizinti = [];
    foreach (['/mt-config.php', '/mt-lib/lib.php', '/schema.sql', '/mt-config.example.php'] as $yol) {
        $r = mt_fetch($base . $yol);
        if ($r['ok'] && $r['status'] === 200) {
            $sizinti[] = $yol;
        }
    }
    $out[] = $sizinti === []
        ? mt_check('ok', 'Gizli dosya guvenligi', 'Yapilandirma ve kutuphane dosyalari web den erisilemiyor.')
        : mt_check('hata', 'Gizli dosya guvenligi',
            'ACIL: su dosyalar web den indirilebiliyor: ' . implode(', ', $sizinti));

    // --- 7. Analitik toplayici ----------------------------------------------
    $r = mt_fetch($base . '/mt/collect.php');
    $out[] = ($r['ok'] && $r['status'] === 405)
        ? mt_check('ok', 'Analitik toplayici', 'Calisiyor (GET istegi dogru sekilde reddedildi).')
        : mt_check('uyari', 'Analitik toplayici', 'Beklenmeyen yanit: ' . ($r['status'] ?: 'ulasilamadi'));

    // --- 8. Sitemap ornek adres kontrolu ------------------------------------
    $r = mt_fetch($base . '/sitemap.xml');
    if ($r['ok'] && $r['status'] === 200) {
        preg_match_all('#<loc>([^<]+)</loc>#', $r['body'], $m);
        $urls = $m[1] ?? [];
        if ($urls !== []) {
            shuffle($urls);
            $ornek  = array_slice($urls, 0, 5);
            $kirik  = [];
            foreach ($ornek as $u) {
                $rr = mt_fetch($u);
                if (!$rr['ok'] || $rr['status'] !== 200) {
                    $kirik[] = $u . ' (' . ($rr['status'] ?: 'ulasilamadi') . ')';
                }
            }
            $out[] = $kirik === []
                ? mt_check('ok', 'Sitemap adresleri', count($ornek) . ' rastgele adres denendi, hepsi calisiyor.')
                : mt_check('hata', 'Sitemap adresleri', 'Kirik: ' . implode(' | ', $kirik));
        }
    }

    // --- 9. Veritabani ------------------------------------------------------
    try {
        $db  = mt_db();
        $say = (int) $db->query('SELECT COUNT(*) FROM mt_events')->fetchColumn();
        $mb  = $db->prepare(
            'SELECT ROUND(SUM(data_length + index_length) / 1048576, 2)
             FROM information_schema.TABLES WHERE table_schema = ? AND table_name LIKE "mt_%"'
        );
        $mb->execute([$c['db_name']]);
        $boyut = (float) ($mb->fetchColumn() ?: 0);
        $out[] = mt_check('ok', 'Veritabani', number_format($say, 0, ',', '.') . " olay kaydi - {$boyut} MB");
    } catch (Throwable $e) {
        $out[] = mt_check('hata', 'Veritabani', 'Sorgu basarisiz.');
    }

    return $out;
}
