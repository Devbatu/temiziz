<?php
/**
 * Yonetim islemleri denetim kaydi + ziyaretci konum zenginlestirmesi.
 *
 * Denetim kaydi neden gerekli: panelde yapilan her degisiklik (yazi silme,
 * veri sifirlama, parola degistirme) iz birakmali. Aksi halde "bu yazi neden
 * kayboldu" sorusunun yanitlanabilecegi bir yer olmaz.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * Bir yonetim islemini kaydeder.
 *
 * IP ham olarak DEGIL, gunluk tuzla hashlenmis olarak saklanir: ayni oturumun
 * islemlerini gruplamaya yeter, kisiyi kalici olarak isaretlemez.
 */
function mt_audit(string $eylem, string $detay = ''): void
{
    try {
        mt_db()->prepare(
            'INSERT INTO mt_audit (action, detail, ip_hash, browser, os, created_at)
             VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())'
        )->execute([
            mb_substr($eylem, 0, 40),
            mb_substr($detay, 0, 300),
            mt_visitor_hash(),
            mt_browser((string) ($_SERVER['HTTP_USER_AGENT'] ?? '')),
            mt_os((string) ($_SERVER['HTTP_USER_AGENT'] ?? '')),
        ]);
    } catch (Throwable $e) {
        // Denetim kaydi yazilamamasi asil islemi engellememeli.
        error_log('audit hatasi: ' . $e->getMessage());
    }
}

/** Eylem kodlarini okunur etikete cevirir. */
function mt_audit_label(string $eylem): string
{
    return match ($eylem) {
        'giris_basarili'  => 'Panele giris yapildi',
        'giris_basarisiz' => 'Basarisiz giris denemesi',
        'giris_kilitli'   => 'Cok fazla deneme - gecici kilit',
        'cikis'           => 'Cikis yapildi',
        'yazi_olustur'    => 'Blog yazisi olusturuldu',
        'yazi_guncelle'   => 'Blog yazisi guncellendi',
        'yazi_sil'        => 'Blog yazisi SILINDI',
        'yazi_yenile'     => 'Blog sayfalari yeniden uretildi',
        'veri_temizle'    => 'Eski analitik kayitlar silindi',
        'veri_sifirla'    => 'TUM analitik veriler silindi',
        'parola_degisti'  => 'Yonetim parolasi degistirildi',
        'csv_indir'       => 'Analitik veri CSV olarak indirildi',
        default           => $eylem,
    };
}

/** Riskli islemler listede vurgulanir. */
function mt_audit_risk(string $eylem): string
{
    return match ($eylem) {
        'yazi_sil', 'veri_sifirla', 'parola_degisti', 'giris_kilitli' => 'yuksek',
        'giris_basarisiz', 'veri_temizle', 'csv_indir'                => 'orta',
        default                                                       => 'normal',
    };
}

/* ─────────────────── Ziyaretci konum zenginlestirmesi ─────────────────── */

/**
 * IP'den ulke/sehir/operator bilgisini cozer ve ziyaretci hash'ine baglar.
 *
 * Onemli ayrimlar:
 *  · Ham IP HICBIR ZAMAN saklanmaz; yalnizca cozulmus konum saklanir.
 *  · Sorgu ziyaretci hash'i basina gunde bir kez yapilir (hash gunluk degisir),
 *    yani her sayfa gosteriminde dis servise gidilmez.
 *  · Servis yavaslarsa 1,5 saniyede vazgecilir; olcum bundan etkilenmez.
 */
function mt_geo_enrich(string $visitorHash): void
{
    $db = mt_db();

    // Bu ziyaretci icin bugun coozulmus mu?
    $var = $db->prepare('SELECT 1 FROM mt_geo WHERE visitor_hash = ? LIMIT 1');
    $var->execute([$visitorHash]);
    if ($var->fetchColumn()) {
        return;
    }

    $ip = mt_client_ip();
    if ($ip === '0.0.0.0' || !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return;
    }

    // Once bos kayit atiyoruz: dis servis yavassa ayni ziyaretci icin
    // tekrar tekrar sorgu yapilmasin.
    try {
        $db->prepare(
            'INSERT IGNORE INTO mt_geo (visitor_hash, created_at) VALUES (?, UTC_TIMESTAMP())'
        )->execute([$visitorHash]);
    } catch (Throwable) {
        return;
    }

    $ch = curl_init(
        'http://ip-api.com/json/' . urlencode($ip)
        . '?fields=status,countryCode,country,city,isp,mobile,proxy,hosting'
    );
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT_MS     => 1500,
        CURLOPT_CONNECTTIMEOUT_MS => 800,
        CURLOPT_USERAGENT      => 'MultiTools/1.0',
    ]);
    $body = curl_exec($ch);
    curl_close($ch);

    if (!is_string($body)) {
        return;
    }
    $j = json_decode($body, true);
    if (!is_array($j) || ($j['status'] ?? '') !== 'success') {
        return;
    }

    try {
        $db->prepare(
            'UPDATE mt_geo SET country_code = ?, country = ?, city = ?, isp = ?,
                    is_proxy = ?, is_hosting = ? WHERE visitor_hash = ?'
        )->execute([
            substr((string) ($j['countryCode'] ?? ''), 0, 2) ?: null,
            mb_substr((string) ($j['country'] ?? ''), 0, 60) ?: null,
            mb_substr((string) ($j['city'] ?? ''), 0, 60) ?: null,
            mb_substr((string) ($j['isp'] ?? ''), 0, 80) ?: null,
            !empty($j['proxy']) ? 1 : 0,
            !empty($j['hosting']) ? 1 : 0,
            $visitorHash,
        ]);
    } catch (Throwable $e) {
        error_log('geo guncelleme hatasi: ' . $e->getMessage());
    }
}
