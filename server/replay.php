<?php
/**
 * Etkileşim kaydı alıcısı. public_html/mt/replay.php olarak yayınlanır.
 *
 * Gövde `collect.php`ye göre büyük olduğu için ayrı uç: sınırlar ve hız
 * denetimi farklı. Kaydedilen veri yalnızca fare yolu, tıklama/hover
 * etiketleri ve kaydırma konumudur — metin içermez (bkz. Recorder.ts).
 */
declare(strict_types=1);

define('MT_APP', true);

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
    exit('{"ok":false}');
}
require $mtLib;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$config = mt_config();

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

// 64 KB üstü gövde okunmaz; istemci de bu sınırın altında gönderir.
$raw = file_get_contents('php://input', false, null, 0, 65536);
$in  = json_decode((string) $raw, true);
if (!is_array($in) || !isset($in['frames']) || !is_array($in['frames'])) {
    http_response_code(400);
    exit('{"ok":false}');
}

$hash = mt_visitor_hash();
// Kayıt gövdesi ağır; saatlik sınır olay ucundan daha sıkı.
if (!mt_rate_ok($hash . ':rep', 30)) {
    http_response_code(429);
    exit('{"ok":false,"error":"rate"}');
}

$ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
if (mt_device($ua) === 'bot') {
    exit('{"ok":true,"skipped":"bot"}');
}

$path = (string) ($in['path'] ?? '/');
if ($path === '' || $path[0] !== '/' || !preg_match('#^/[A-Za-z0-9/_.\-]{0,254}$#', $path)) {
    $path = '/';
}

$sayi = static fn (mixed $v, int $enB): int => is_numeric($v) ? max(0, min((int) $v, $enB)) : 0;

/**
 * Kareler yeniden doğrulanır: yalnızca bilinen tür kodları ve sınırlı
 * uzunlukta etiketler kabul edilir. Etiketten HTML üretmeyeceğiz ama yine de
 * beklenmeyen içerik saklamıyoruz.
 */
$temiz = [];
foreach ($in['frames'] as $f) {
    if (!is_array($f) || count($f) < 2 || !is_int($f[0])) {
        continue;
    }
    $t = $sayi($f[1] ?? 0, 12 * 3600 * 1000);
    switch ($f[0]) {
        case 0: // fare
        case 1: // tıklama
            $satir = [$f[0], $t, $sayi($f[2] ?? 0, 1000), $sayi($f[3] ?? 0, 1000)];
            if ($f[0] === 1) {
                $satir[] = mb_substr(preg_replace('/[^\p{L}\p{N} .,:%\/_\-()]/u', '', (string) ($f[4] ?? '')) ?? '', 0, 40);
            }
            $temiz[] = $satir;
            break;
        case 2: // hover
            $ad = mb_substr(preg_replace('/[^\p{L}\p{N} .,:%\/_\-()]/u', '', (string) ($f[2] ?? '')) ?? '', 0, 40);
            if ($ad !== '') {
                $temiz[] = [2, $t, $ad, $sayi($f[3] ?? 0, 60000)];
            }
            break;
        case 3: // kaydırma
            $temiz[] = [3, $t, $sayi($f[2] ?? 0, 1000)];
            break;
        case 4: // eylem işareti — "aracı çalıştırdı", "3 dosya seçildi"
            $ad = mb_substr(preg_replace('/[^\p{L}\p{N} .,:%\/_\-()]/u', '', (string) ($f[2] ?? '')) ?? '', 0, 60);
            if ($ad !== '') {
                $temiz[] = [4, $t, $ad];
            }
            break;
    }
    if (count($temiz) >= 400) {
        break;
    }
}

if (count($temiz) < 4) {
    exit('{"ok":true,"skipped":"short"}');
}

try {
    mt_db()->prepare(
        'INSERT INTO mt_replays
            (visitor_hash, path, viewport_w, viewport_h, doc_h, duration_ms,
             frame_count, browser, os, device, frames, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())'
    )->execute([
        $hash,
        $path,
        $sayi($in['vw'] ?? 0, 20000),
        $sayi($in['vh'] ?? 0, 20000),
        $sayi($in['dh'] ?? 0, 200000),
        $sayi($in['duration'] ?? 0, 12 * 3600 * 1000),
        count($temiz),
        mt_browser($ua),
        mt_os($ua),
        mt_device($ua),
        json_encode($temiz, JSON_UNESCAPED_UNICODE),
        // created_at
    ]);
} catch (Throwable $e) {
    error_log('replay hatasi: ' . $e->getMessage());
    http_response_code(500);
    exit('{"ok":false}');
}

/**
 * Saklama sınırı: yalnızca en yeni 300 kayıt tutulur. Paylaşımlı hostingde
 * veritabanının şişmesini önler ve eski kayıtların bir değeri yoktur.
 */
if (random_int(1, 20) === 1) {
    try {
        mt_db()->exec(
            'DELETE FROM mt_replays WHERE id < (
                SELECT MIN(id) FROM (
                    SELECT id FROM mt_replays ORDER BY id DESC LIMIT 300
                ) AS son
             )'
        );
    } catch (Throwable) {
        // Temizlik başarısız olsa da kayıt alınmış olması yeterli.
    }
}

echo '{"ok":true}';
