<?php
/**
 * Ag araclari ucu. `public_html/mt/net.php` olarak yayinlanir.
 *
 * Statik yayinda Next.js sunucu rotalari bulunmadigi icin WHOIS, IP, SSL,
 * ping, port, durum ve kanonik denetimi araclari calismiyordu; sayfalar
 * "bu surumde kullanilamiyor" paneli gosteriyordu. Ayni sunucuda PHP zaten
 * calistigi icin bu sorgular burada karsilanir.
 *
 * Guvenlik: yalnizca kendi sitemizden gelen isteklere yanit verilir, hedef
 * adres ozel ag araliklarina karsi denetlenir (SSRF korumasi) ve ziyaretci
 * basina saatlik sinir uygulanir.
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
    exit('{"error":"Servis kullanilamiyor."}');
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
    exit('{"error":"Gecersiz koken."}');
}
header('Access-Control-Allow-Origin: ' . $siteUrl);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit('{"error":"Yalnizca POST."}');
}

$hata = static function (string $mesaj, int $kod = 400): never {
    http_response_code($kod);
    exit(json_encode(['error' => $mesaj], JSON_UNESCAPED_UNICODE));
};

// Dis sunuculara baglanti kuruyoruz; sinir olay ucundan siki tutulur.
if (!mt_rate_ok(mt_visitor_hash() . ':net', 40)) {
    $hata('Cok fazla sorgu yaptiniz. Birkac dakika sonra tekrar deneyin.', 429);
}

$in = json_decode((string) file_get_contents('php://input', false, null, 0, 4096), true);
if (!is_array($in)) {
    $hata('Istek bicimi hatali.');
}

$eylem = (string) ($in['action'] ?? '');

/*
 * Kanonik denetimi tam bir adres alir ('url'), digerleri yalnizca alan adi
 * ('host'). Asagidaki dogrulama host uzerinden calistigi icin, url gelen
 * durumda alan adini adresten cikariyoruz; aksi halde istek eylem ayrimina
 * ulasmadan "gecersiz alan adi" diye reddediliyordu.
 */
$host = strtolower(trim((string) ($in['host'] ?? '')));
if ($host === '' && !empty($in['url'])) {
    $host = strtolower((string) (parse_url(
        preg_match('#^https?://#i', (string) $in['url'])
            ? (string) $in['url']
            : 'https://' . $in['url'],
        PHP_URL_HOST
    ) ?? ''));
}
// Kullanici tam URL yapistirmis olabilir.
$host  = preg_replace('#^https?://#', '', $host) ?? $host;
$host  = explode('/', $host)[0];
$host  = preg_replace('/:\d+$/', '', $host) ?? $host;

if ($host === '' || !preg_match('/^[a-z0-9.-]{1,253}$/', $host)) {
    $hata('Gecerli bir alan adi veya IP girin.');
}

/**
 * SSRF korumasi: hedef ozel bir ag adresine cozumleniyorsa reddet.
 * Aksi halde bu uc, ic aga sorgu yapmak icin kullanilabilirdi.
 */
function mt_hedef_guvenli(string $host): bool
{
    $ipler = [];
    if (filter_var($host, FILTER_VALIDATE_IP)) {
        $ipler[] = $host;
    } else {
        foreach ((array) @dns_get_record($host, DNS_A + DNS_AAAA) as $r) {
            if (!empty($r['ip']))   { $ipler[] = $r['ip']; }
            if (!empty($r['ipv6'])) { $ipler[] = $r['ipv6']; }
        }
        $tek = @gethostbyname($host);
        if ($tek !== $host) { $ipler[] = $tek; }
    }
    if ($ipler === []) {
        return false;
    }
    foreach ($ipler as $ip) {
        $genel = filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
        if ($genel === false) {
            return false;
        }
    }
    return true;
}

if ($eylem !== 'canonical' && !mt_hedef_guvenli($host)) {
    $hata('Bu adres sorgulanamaz (cozumlenemedi veya ozel ag adresi).');
}

/* ───────────────────────────────── WHOIS ───────────────────────────────── */

const MT_WHOIS = [
    'com' => 'whois.verisign-grs.com', 'net' => 'whois.verisign-grs.com',
    'org' => 'whois.pir.org',          'io'  => 'whois.nic.io',
    'dev' => 'whois.nic.google',       'app' => 'whois.nic.google',
    'co'  => 'whois.nic.co',           'tr'  => 'whois.nic.tr',
    'info' => 'whois.afilias.net',     'biz' => 'whois.nic.biz',
    'me'  => 'whois.nic.me',           'xyz' => 'whois.nic.xyz',
];

function mt_whois_sorgu(string $sunucu, string $sorgu): string
{
    $fp = @fsockopen($sunucu, 43, $eno, $estr, 8);
    if (!$fp) {
        return '';
    }
    stream_set_timeout($fp, 8);
    fwrite($fp, $sorgu . "\r\n");
    $veri = '';
    while (!feof($fp) && strlen($veri) < 65536) {
        $veri .= fread($fp, 4096) ?: '';
    }
    fclose($fp);
    return $veri;
}

function mt_whois(string $host): array
{
    $parcalar = explode('.', $host);
    $tld = end($parcalar);
    if (!isset(MT_WHOIS[$tld])) {
        throw new RuntimeException(".{$tld} uzantisi icin WHOIS sunucusu tanimli degil.");
    }
    $ham = mt_whois_sorgu(MT_WHOIS[$tld], $host);
    if ($ham === '') {
        throw new RuntimeException('WHOIS sunucusuna baglanilamadi.');
    }

    // .com/.net kayitlari incedir; kayit sirketinin sunucusu daha ayrintili verir.
    if (preg_match('/Registrar WHOIS Server:\s*(\S+)/i', $ham, $m)) {
        $ayrintili = mt_whois_sorgu($m[1], $host);
        if (strlen($ayrintili) > strlen($ham) / 2) {
            $ham = $ayrintili;
        }
    }

    $alan = static function (array $adlar) use ($ham): ?string {
        foreach ($adlar as $ad) {
            if (preg_match('/^\s*' . preg_quote($ad, '/') . '\s*:\s*(.+)$/im', $ham, $m)) {
                return trim($m[1]);
            }
        }
        return null;
    };

    preg_match_all('/^\s*(?:Name Server|nserver)\s*:\s*(.+)$/im', $ham, $ns);
    preg_match_all('/^\s*(?:Domain Status|status)\s*:\s*(\S+)/im', $ham, $st);

    return [
        'host'        => $host,
        'available'   => (bool) preg_match('/no match|not found|no data found|no entries found/i', $ham),
        'registrar'   => $alan(['Registrar', 'Sponsoring Registrar']),
        'created'     => $alan(['Creation Date', 'Created Date', 'created', 'Domain Registration Date']),
        'updated'     => $alan(['Updated Date', 'Last Modified']),
        // Kayit sirketleri bitis tarihini farkli adlarla dondurur; .com/.net
        // yonlendirmesinden sonra gelen yanit genellikle uzun bicimi kullanir.
        'expires'     => $alan([
            'Registry Expiry Date', 'Registrar Registration Expiration Date',
            'Expiry Date', 'Expiration Date', 'Domain Expiration Date', 'paid-till',
        ]),
        'status'      => array_slice(array_values(array_unique($st[1])), 0, 6),
        'nameServers' => array_values(array_unique(array_map(
            static fn (string $s): string => strtolower(trim($s)),
            $ns[1]
        ))),
        'raw'         => mb_substr($ham, 0, 6000),
    ];
}

/* ────────────────────────────────── IP ────────────────────────────────── */

function mt_ip(string $host): array
{
    $alanlar = 'status,message,query,country,countryCode,regionName,city,zip,lat,lon,'
        . 'timezone,isp,org,as,reverse,mobile,proxy,hosting';
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true]]);
    $ham = @file_get_contents(
        'http://ip-api.com/json/' . rawurlencode($host) . '?fields=' . $alanlar,
        false,
        $ctx
    );
    $veri = json_decode((string) $ham, true);
    if (!is_array($veri)) {
        throw new RuntimeException('IP servisi yanit vermedi.');
    }
    if (($veri['status'] ?? '') !== 'success') {
        throw new RuntimeException(
            ($veri['message'] ?? '') === 'private range'
                ? 'Ozel ag adresi sorgulanamaz.'
                : 'IP bilgisi bulunamadi.'
        );
    }
    return $veri;
}

/* ────────────────────────────────── SSL ────────────────────────────────── */

function mt_ssl(string $host): array
{
    $ctx = stream_context_create(['ssl' => [
        'capture_peer_cert' => true,
        'verify_peer'       => false,
        'verify_peer_name'  => false,
        'SNI_enabled'       => true,
        'peer_name'         => $host,
    ]]);
    $fp = @stream_socket_client(
        'ssl://' . $host . ':443',
        $eno, $estr, 10, STREAM_CLIENT_CONNECT, $ctx
    );
    if (!$fp) {
        throw new RuntimeException('Sunucu 443 portunda yanit vermedi.');
    }
    $params = stream_context_get_params($fp);
    $sertifika = $params['options']['ssl']['peer_certificate'] ?? null;
    fclose($fp);
    if ($sertifika === null) {
        throw new RuntimeException('Sertifika alinamadi.');
    }

    $s = openssl_x509_parse($sertifika);
    if ($s === false) {
        throw new RuntimeException('Sertifika cozumlenemedi.');
    }

    $bitis = (int) ($s['validTo_time_t'] ?? 0);
    $kalan = (int) ceil(($bitis - time()) / 86400);

    // Alternatif adlar "DNS:a.com, DNS:b.com" bicimindedir.
    $altAdlar = [];
    if (!empty($s['extensions']['subjectAltName'])) {
        foreach (explode(',', (string) $s['extensions']['subjectAltName']) as $p) {
            $p = trim(str_replace('DNS:', '', $p));
            if ($p !== '') { $altAdlar[] = $p; }
        }
    }

    // Gecerlilik dogrulamasi ayri bir baglantiyla yapilir: yukarida
    // verify_peer kapali, cunku sertifikayi hatali olsa da gostermek istiyoruz.
    $dogrulandi = false;
    $dogrulamaHatasi = null;
    $ctx2 = stream_context_create(['ssl' => [
        'verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host,
    ]]);
    $fp2 = @stream_socket_client(
        'ssl://' . $host . ':443', $e2, $s2, 10, STREAM_CLIENT_CONNECT, $ctx2
    );
    if ($fp2) {
        $dogrulandi = true;
        fclose($fp2);
    } else {
        $dogrulamaHatasi = $s2 !== '' ? $s2 : 'Zincir dogrulanamadi.';
    }

    return [
        'host'       => $host,
        'subject'    => $s['subject']['CN'] ?? $host,
        'issuer'     => $s['issuer']['O'] ?? ($s['issuer']['CN'] ?? 'Bilinmiyor'),
        'validFrom'  => gmdate('D, d M Y H:i:s \G\M\T', (int) ($s['validFrom_time_t'] ?? 0)),
        'validTo'    => gmdate('D, d M Y H:i:s \G\M\T', $bitis),
        'daysLeft'   => $kalan,
        'expired'    => $kalan <= 0,
        'authorized' => $dogrulandi,
        'authorizationError' => $dogrulamaHatasi,
        'protocol'   => null,
        'altNames'   => array_slice(array_values(array_unique($altAdlar)), 0, 20),
        'serialNumber' => $s['serialNumberHex'] ?? ($s['serialNumber'] ?? null),
    ];
}

/* ─────────────────────────── ping / port / durum ─────────────────────────── */

/**
 * ICMP ping paylasimli hostingde kullanilamaz (yetki gerekir), bu yuzden
 * TCP baglanti suresi olculur. Kullanici acisindan anlami ayni: sunucu
 * ayakta mi ve ne kadar surede yanit veriyor.
 */
function mt_ping(string $host): array
{
    $olcumler = [];
    foreach ([443, 80] as $port) {
        for ($i = 0; $i < 3; $i++) {
            $t0 = microtime(true);
            $fp = @fsockopen($host, $port, $eno, $estr, 5);
            if ($fp) {
                $olcumler[] = round((microtime(true) - $t0) * 1000, 1);
                fclose($fp);
            }
        }
        if ($olcumler !== []) {
            return [
                'host'    => $host,
                'port'    => $port,
                'alive'   => true,
                'times'   => $olcumler,
                'min'     => min($olcumler),
                'max'     => max($olcumler),
                'avg'     => round(array_sum($olcumler) / count($olcumler), 1),
                'method'  => 'TCP baglanti suresi',
            ];
        }
    }
    return ['host' => $host, 'alive' => false, 'times' => [], 'method' => 'TCP baglanti suresi'];
}

function mt_port(string $host, int $port): array
{
    if ($port < 1 || $port > 65535) {
        throw new RuntimeException('Port 1-65535 araliginda olmali.');
    }
    $t0 = microtime(true);
    $fp = @fsockopen($host, $port, $eno, $estr, 5);
    $acik = (bool) $fp;
    if ($fp) { fclose($fp); }
    return [
        'host' => $host,
        'port' => $port,
        'open' => $acik,
        'ms'   => round((microtime(true) - $t0) * 1000, 1),
        'error' => $acik ? null : ($estr !== '' ? $estr : 'Baglanti kurulamadi'),
    ];
}

function mt_durum(string $host): array
{
    $sonuc = [];
    foreach (['https', 'http'] as $sema) {
        $url = $sema . '://' . $host . '/';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_NOBODY         => false,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_TIMEOUT        => 12,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; MultiTools/1.0)',
        ]);
        $govde = curl_exec($ch);
        $bilgi = curl_getinfo($ch);
        $cerr  = curl_error($ch);
        curl_close($ch);

        $sonuc[$sema] = [
            'url'        => $url,
            'reachable'  => $govde !== false,
            'status'     => (int) ($bilgi['http_code'] ?? 0),
            'ms'         => round(((float) ($bilgi['total_time'] ?? 0)) * 1000, 1),
            'redirect'   => $bilgi['redirect_url'] ?? null,
            'size'       => (int) ($bilgi['size_download'] ?? 0),
            'error'      => $cerr !== '' ? $cerr : null,
        ];
    }
    return ['host' => $host, 'checks' => $sonuc];
}

/* ───────────────────────────── kanonik denetimi ───────────────────────────── */

function mt_kanonik(string $url): array
{
    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . $url;
    }
    $parca = parse_url($url);
    if (empty($parca['host']) || !mt_hedef_guvenli((string) $parca['host'])) {
        throw new RuntimeException('Bu adres sorgulanamaz.');
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 5,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; MultiTools/1.0)',
    ]);
    $html  = (string) curl_exec($ch);
    $bilgi = curl_getinfo($ch);
    curl_close($ch);

    if ($html === '') {
        throw new RuntimeException('Sayfa alinamadi.');
    }

    $bul = static function (string $desen) use ($html): ?string {
        return preg_match($desen, $html, $m)
            ? trim(html_entity_decode($m[1], ENT_QUOTES, 'UTF-8'))
            : null;
    };

    $kanonik = $bul('#<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']#i')
        ?? $bul('#<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']#i');
    $son = (string) ($bilgi['url'] ?? $url);

    return [
        'requested'  => $url,
        'finalUrl'   => $son,
        'status'     => (int) ($bilgi['http_code'] ?? 0),
        'redirects'  => (int) ($bilgi['redirect_count'] ?? 0),
        'canonical'  => $kanonik,
        'selfCanonical' => $kanonik !== null && rtrim($kanonik, '/') === rtrim($son, '/'),
        'title'      => $bul('#<title[^>]*>(.*?)</title>#is'),
        'description' => $bul('#<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)["\']#i'),
        'robots'     => $bul('#<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)["\']#i'),
        'h1Count'    => preg_match_all('#<h1[\s>]#i', $html),
    ];
}

/* ──────────────────────────────── yonlendirme ──────────────────────────────── */

try {
    switch ($eylem) {
        case 'whois':     $cikti = mt_whois($host); break;
        case 'ip':        $cikti = mt_ip($host); break;
        case 'ssl':       $cikti = mt_ssl($host); break;
        case 'ping':      $cikti = mt_ping($host); break;
        case 'port':      $cikti = mt_port($host, (int) ($in['port'] ?? 0)); break;
        case 'status':    $cikti = mt_durum($host); break;
        case 'canonical': $cikti = mt_kanonik((string) ($in['url'] ?? $host)); break;
        default:          $hata('Bilinmeyen islem.');
    }
} catch (Throwable $e) {
    $hata($e->getMessage());
}

echo json_encode($cikti, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
