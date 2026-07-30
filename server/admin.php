<?php
/**
 * Yonetim paneli. public_html/mt/admin.php olarak yayinlanir.
 *
 * Guvenlik: parola hash'li saklanir, oturum cerezi HttpOnly + Secure +
 * SameSite=Strict, her POST'ta CSRF anahtari, basarisiz girislerde IP bazli
 * kilit, tum sorgular hazir ifade, tum cikti kacisli.
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

$config = mt_config();

$mtLibDir = dirname($mtLib);
require $mtLibDir . '/blog.php';
require $mtLibDir . '/admin-blog.php';
require $mtLibDir . '/admin-detail.php';
require $mtLibDir . '/charts.php';
require $mtLibDir . '/admin-dashboard.php';
require $mtLibDir . '/audit.php';
require $mtLibDir . '/admin-audit.php';

/* ─────────────────────────── Oturum ─────────────────────────── */

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_name('mtadmin');
session_start();

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
/**
 * Barindirici (LiteSpeed) sunucu duzeyinde bir CSP basligi ayarliyor ve
 * `Header set` PHP'nin gonderdigini EZIYOR. Bu yuzden ayni politika hem
 * baslik hem de <meta http-equiv> olarak basilir; meta surumu sunucu
 * yapilandirmasindan bagimsiz olarak tarayicida uygulanir.
 */
$mtNonce = base64_encode(random_bytes(16));
$mtCsp   = "default-src 'self'; script-src 'self' 'nonce-{$mtNonce}'; "
    . "style-src 'self' 'unsafe-inline'; img-src 'self' data:";
header('Content-Security-Policy: ' . $mtCsp);
header('Cache-Control: no-store');

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function mt_logged_in(): bool
{
    return !empty($_SESSION['admin']) && ($_SESSION['ua'] ?? '') === ($_SERVER['HTTP_USER_AGENT'] ?? '');
}

function mt_csrf_ok(): bool
{
    return hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''));
}

if (($_GET['cikis'] ?? '') === '1') {
    if (!empty($_SESSION['admin'])) { mt_audit('cikis'); }
    $_SESSION = [];
    session_destroy();
    header('Location: admin.php');
    exit;
}

/* ─────────────────────────── Giris ─────────────────────────── */

$error = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && !mt_logged_in()) {
    $ipHash = mt_visitor_hash();
    $db     = mt_db();

    $stmt = $db->prepare(
        'SELECT COUNT(*) FROM mt_login_attempts
         WHERE ip_hash = ? AND success = 0 AND attempted_at > (UTC_TIMESTAMP() - INTERVAL 15 MINUTE)'
    );
    $stmt->execute([$ipHash]);

    if ((int) $stmt->fetchColumn() >= 5) {
        mt_audit('giris_kilitli');
        $error = 'Cok fazla basarisiz deneme. 15 dakika sonra tekrar deneyin.';
    } elseif (!mt_csrf_ok()) {
        $error = 'Oturum dogrulamasi basarisiz. Sayfayi yenileyip tekrar deneyin.';
    } else {
        usleep(random_int(150000, 350000));
        $ok = password_verify((string) ($_POST['sifre'] ?? ''), $config['admin_hash']);
        $db->prepare('INSERT INTO mt_login_attempts (ip_hash, attempted_at, success) VALUES (?, UTC_TIMESTAMP(), ?)')
           ->execute([$ipHash, $ok ? 1 : 0]);

        if ($ok) {
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            $_SESSION['ua']    = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $_SESSION['csrf']  = bin2hex(random_bytes(32));
            mt_audit('giris_basarili');
            header('Location: admin.php');
            exit;
        }
        mt_audit('giris_basarisiz');
        $error = 'Parola hatali.';
    }
}

/* ─────────────────────── Giris yapilmadiysa ─────────────────────── */

if (!mt_logged_in()) {
    ?><!doctype html><html lang="tr"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="<?= h($mtCsp) ?>">
    <meta name="robots" content="noindex,nofollow"><title>Giris</title>
    <style>
      body{margin:0;background:#0b0f1c;color:#e9edf7;font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
      form{max-width:340px;margin:14vh auto;background:#141a2e;border:1px solid #232b45;border-radius:16px;padding:26px}
      h1{font-size:20px;margin:0 0 16px}
      input{width:100%;padding:11px 13px;border-radius:10px;border:1px solid #232b45;background:#0e1425;color:#e9edf7;font-size:15px;box-sizing:border-box}
      button{width:100%;margin-top:10px;padding:11px;border:0;border-radius:10px;background:#5b8cff;color:#fff;font-weight:700;font-size:15px;cursor:pointer}
      .err{background:#3b1220;color:#ffb4c4;padding:10px 12px;border-radius:9px;margin-bottom:12px;font-size:14px}
    </style></head><body>
    <form method="post" autocomplete="off">
      <h1>Yonetim Paneli</h1>
      <?php if ($error !== ''): ?><div class="err"><?= h($error) ?></div><?php endif; ?>
      <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
      <input type="password" name="sifre" placeholder="Parola" required autofocus>
      <button type="submit">Giris</button>
    </form></body></html><?php
    exit;
}

/* ═══════════════════════ Buradan sonrasi korumali ═══════════════════════ */

$db      = mt_db();
$section = (string) ($_GET['s'] ?? 'ozet');
$notice  = '';
$noticeType = 'ok';

$q = function (string $sql, array $args = []) use ($db): array {
    $s = $db->prepare($sql);
    $s->execute($args);
    return $s->fetchAll();
};

/* ─────────────────────── POST islemleri ─────────────────────── */

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && mt_csrf_ok()) {
    $eylem = (string) ($_POST['eylem'] ?? '');

    $blogSonuc = mt_blog_post($eylem);
    if ($blogSonuc !== null) {
        [$notice, $noticeType] = $blogSonuc;
        $section = 'blog';
    }

    if ($eylem === 'parola') {
        $yeni  = (string) ($_POST['yeni'] ?? '');
        $tekrar = (string) ($_POST['tekrar'] ?? '');
        $mevcut = (string) ($_POST['mevcut'] ?? '');

        if (!password_verify($mevcut, $config['admin_hash'])) {
            $notice = 'Mevcut parola hatali.'; $noticeType = 'hata';
        } elseif (strlen($yeni) < 8) {
            $notice = 'Yeni parola en az 8 karakter olmali.'; $noticeType = 'hata';
        } elseif ($yeni !== $tekrar) {
            $notice = 'Yeni parolalar eslesmiyor.'; $noticeType = 'hata';
        } else {
            $path = mt_config_path();
            $src  = (string) file_get_contents($path);
            $hash = password_hash($yeni, PASSWORD_DEFAULT);
            // preg_replace KULLANMA: bcrypt hash "$2y$" ile baslar ve
            // degistirme metnindeki $2 geri-referans sanilip yutulur.
            $new = preg_replace_callback(
                '/([\'"]admin_hash[\'"]\s*=>\s*)[\'"][^\'"]*[\'"]/',
                static fn (array $m): string => $m[1] . var_export($hash, true),
                $src, 1, $n
            );
            if ($n === 1 && file_put_contents($path, $new) !== false) {
                $kontrol = require $path;
                if (password_verify($yeni, $kontrol['admin_hash'])) {
                    mt_audit('parola_degisti');
                    $notice = 'Parola guncellendi.';
                } else {
                    file_put_contents($path, $src);
                    $notice = 'Parola yazildi ama dogrulanamadi; degisiklik geri alindi.'; $noticeType = 'hata';
                }
            } else {
                $notice = 'Yapilandirma dosyasi yazilamadi.'; $noticeType = 'hata';
            }
        }
        $section = 'ayarlar';
    }

    if ($eylem === 'temizle') {
        $gun = (int) ($_POST['gun'] ?? 0);
        if (in_array($gun, [90, 180, 365], true)) {
            $s = $db->prepare('DELETE FROM mt_events WHERE created_at < (UTC_TIMESTAMP() - INTERVAL ? DAY)');
            $s->execute([$gun]);
            mt_audit('veri_temizle', $gun . ' gunden eski, ' . $s->rowCount() . ' kayit');
            $notice = $s->rowCount() . ' eski kayit silindi.';
        } else {
            $notice = 'Gecersiz sure.'; $noticeType = 'hata';
        }
        $section = 'veri';
    }

    if ($eylem === 'sifirla') {
        if ((string) ($_POST['onay'] ?? '') === 'SIFIRLA') {
            $db->exec('TRUNCATE TABLE mt_events');
            mt_audit('veri_sifirla');
            $notice = 'Tum analitik veriler silindi.';
        } else {
            $notice = 'Onay metni hatali; hicbir sey silinmedi.'; $noticeType = 'hata';
        }
        $section = 'veri';
    }
}

/* ─────────────────────── CSV disa aktarim ─────────────────────── */

if (($_GET['disaaktar'] ?? '') === '1') {
    mt_audit('csv_indir');
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="multitools-olaylar-' . gmdate('Ymd') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // Excel icin BOM
    fputcsv($out, ['tarih', 'tur', 'yol', 'arac', 'etiket', 'kaynak', 'cihaz', 'ulke']);
    $s = $db->query(
        'SELECT created_at, event_type, path, tool_slug, label, referrer_host, device, country
         FROM mt_events ORDER BY id DESC LIMIT 50000'
    );
    while ($r = $s->fetch()) {
        fputcsv($out, $r);
    }
    fclose($out);
    exit;
}

/* ─────────────────────── Veri toplama ─────────────────────── */

$days = (int) ($_GET['gun'] ?? 7);
if (!in_array($days, [1, 7, 30, 90], true)) {
    $days = 7;
}

$stats = [];

$olaylar = [];
if ($section === 'olaylar') {
    $olaylar = $q('SELECT created_at, event_type, path, tool_slug, label, referrer_host, device, country
                   FROM mt_events ORDER BY id DESC LIMIT 100');
}

$checks = [];
if ($section === 'kontrol' && ($_GET['calistir'] ?? '') === '1') {
    require dirname($mtLib) . '/checks.php';
    $checks = mt_run_checks();
}


$sekmeler = [
    'ozet'    => 'Ozet',
    'davranis' => 'Davranis',
    'kayitlar' => 'Kayitlar',
    'blog'    => 'Blog',
    'olaylar' => 'Canli olaylar',
    'kontrol' => 'Site kontrolu',
    'veri'    => 'Veri',
    'ayarlar' => 'Ayarlar',
];
?><!doctype html>
<html lang="tr">
<head>
<meta http-equiv="Content-Security-Policy" content="<?= h($mtCsp) ?>">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Yonetim Paneli</title>
<style>
  :root{--bg:#0b0f1c;--card:#141a2e;--line:#232b45;--fg:#e9edf7;--muted:#8d97b4;--accent:#5b8cff;
        --ok:#34d399;--uyari:#fbbf24;--hata:#f87171;--bilgi:#60a5fa}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}
  .wrap{max-width:1120px;margin:0 auto;padding:22px 16px 70px}
  h1{font-size:21px;margin:0}
  h2{font-size:13px;margin:0 0 12px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.07em}
  .top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:18px}
  .nav{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px}
  .nav a{padding:7px 14px;border:1px solid var(--line);border-radius:10px;text-decoration:none;color:var(--muted);font-size:13.5px}
  .nav a.on{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:600}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}
  .grid{display:grid;gap:13px}
  .g4{grid-template-columns:repeat(auto-fit,minmax(175px,1fr))}
  .g2{grid-template-columns:repeat(auto-fit,minmax(330px,1fr))}
  .kpi{font-size:29px;font-weight:800}
  .kpi-l{color:var(--muted);font-size:13px;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:13.5px}
  th{text-align:left;color:var(--muted);font-weight:600;padding:6px 8px;border-bottom:1px solid var(--line)}
  td{padding:6px 8px;border-bottom:1px solid var(--line)}
  td.n{text-align:right;font-variant-numeric:tabular-nums}
  a{color:var(--accent)}
  .bars{display:flex;align-items:flex-end;gap:3px;height:110px}
  .bars div{flex:1;background:linear-gradient(180deg,var(--accent),#8b5cf6);border-radius:3px 3px 0 0;min-height:2px}
  .empty{color:var(--muted);font-size:14px;padding:12px 0}
  .chk{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);align-items:flex-start}
  .chk:last-child{border-bottom:0}
  .dot{width:9px;height:9px;border-radius:50%;margin-top:7px;flex:0 0 9px}
  .d-ok{background:var(--ok)}.d-uyari{background:var(--uyari)}.d-hata{background:var(--hata)}.d-bilgi{background:var(--bilgi)}
  .chk b{font-size:14px;font-weight:600}
  .chk p{margin:2px 0 0;color:var(--muted);font-size:13px}
  .btn{display:inline-block;padding:9px 16px;border:0;border-radius:10px;background:var(--accent);
       color:#fff;font-weight:600;font-size:14px;cursor:pointer;text-decoration:none}
  .btn.g{background:transparent;border:1px solid var(--line);color:var(--fg)}
  .btn.r{background:#b91c1c}
  input[type=password],input[type=text],textarea,select{width:100%;padding:10px 12px;border-radius:9px;
       border:1px solid var(--line);background:#0e1425;color:var(--fg);font-size:14px;font-family:inherit;box-sizing:border-box}
  textarea{font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.6;resize:vertical}
  label{display:block;font-size:13px;color:var(--muted);margin:12px 0 5px}
  .msg{padding:11px 14px;border-radius:10px;margin-bottom:16px;font-size:14px}
  .msg.ok{background:#0d2f24;color:#8ff0c4}
  .msg.hata{background:#3b1220;color:#ffb4c4}
  .note{color:var(--muted);font-size:12.5px;line-height:1.6}
  code{background:#0e1425;padding:2px 6px;border-radius:5px;font-size:12.5px}
  /* ── Pano bilesenleri ───────────────────────────────────────── */
  .kpis{display:grid;gap:13px;grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
  .kpi-card{position:relative;background:var(--card);border:1px solid var(--line);
            border-radius:14px;padding:16px 18px 14px;overflow:hidden}
  .kpi-bar{position:absolute;inset:0 auto 0 0;width:3px}
  .kpi-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
  .kpi-num{font-size:29px;font-weight:800;line-height:1.1;letter-spacing:-.02em}
  .kpi-lbl{color:var(--fg);font-size:13.5px;font-weight:600;margin-top:4px}
  .kpi-prev{color:var(--muted);font-size:11.5px;margin-top:2px}
  .dlt{font-size:12px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap}
  .dlt.up{background:rgba(52,211,153,.13);color:#34d399}
  .dlt.down{background:rgba(248,113,113,.13);color:#f87171}
  .dlt.flat{background:rgba(141,151,180,.13);color:var(--muted)}

  .insights{margin:0;padding:0;list-style:none}
  .insights li{position:relative;padding:9px 0 9px 26px;font-size:13.5px;line-height:1.6;
               border-bottom:1px solid var(--line);color:#c8d0e4}
  .insights li:last-child{border-bottom:0}
  .insights li::before{position:absolute;left:2px;top:9px;font-size:13px}
  .ins-uyari::before{content:"A0";color:var(--uyari)}
  .ins-iyi::before{content:"¹3";color:var(--ok)}
  .ins-bilgi::before{content:"9";color:var(--bilgi)}

  .bars-h{display:flex;flex-direction:column;gap:9px}
  .bar-row{display:grid;grid-template-columns:minmax(90px,34%) 1fr auto;gap:10px;align-items:center}
  .bar-label{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#c8d0e4}
  .bar-label a{color:#c8d0e4;text-decoration:none}
  .bar-label a:hover{color:var(--accent);text-decoration:underline}
  .bar-track{height:8px;background:#0e1425;border-radius:20px;overflow:hidden}
  .bar-fill{display:block;height:100%;border-radius:20px}
  .bar-val{font-size:12.5px;font-variant-numeric:tabular-nums;color:var(--fg);min-width:44px;text-align:right}
  .bar-val em{color:var(--muted);font-style:normal;font-size:11px}

  .funnel{display:flex;flex-direction:column;gap:12px}
  .fn-row{display:grid;grid-template-columns:1fr;gap:5px}
  .fn-label{font-size:13px;color:#c8d0e4}
  .fn-track{height:22px;background:#0e1425;border-radius:7px;overflow:hidden}
  .fn-fill{display:block;height:100%;border-radius:7px}
  .fn-val{font-size:12.5px;color:var(--muted);font-variant-numeric:tabular-nums}
  .fn-val em{font-style:normal;color:var(--ok);font-weight:700;margin-left:4px}

  .donut{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
  .legend{list-style:none;margin:0;padding:0;font-size:13px;flex:1;min-width:130px}
  .legend li{display:flex;align-items:center;gap:7px;padding:3px 0;color:#c8d0e4}
  .legend i{width:9px;height:9px;border-radius:3px;flex:0 0 9px}
  .legend b{margin-left:auto;color:var(--muted);font-weight:600;font-variant-numeric:tabular-nums}

  .mini-kpis{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}
  .mini-kpis div{background:#0e1425;border:1px solid var(--line);border-radius:11px;padding:12px}
  .mini-kpis span{display:block;font-size:20px;font-weight:800}
  .mini-kpis em{display:block;font-style:normal;color:var(--muted);font-size:11.5px;margin-top:3px;line-height:1.4}

</style>
</head>
<body><div class="wrap">

<div class="top">
  <h1>Yonetim Paneli</h1>
  <a class="btn g" href="?cikis=1">Cikis</a>
</div>

<div class="nav">
  <?php foreach ($sekmeler as $key => $ad): ?>
    <a class="<?= $section === $key ? 'on' : '' ?>" href="?s=<?= h($key) ?>"><?= h($ad) ?></a>
  <?php endforeach; ?>
</div>

<?php if ($notice !== ''): ?>
  <div class="msg <?= h($noticeType) ?>"><?= h($notice) ?></div>
<?php endif; ?>

<?php if ($section === 'ozet'): ?>

  <div class="nav">
    <?php foreach ([1 => 'Bugun', 7 => '7 gun', 30 => '30 gun', 90 => '90 gun'] as $d => $et): ?>
      <a class="<?= $days === $d ? 'on' : '' ?>" href="?s=ozet&gun=<?= $d ?>"><?= h($et) ?></a>
    <?php endforeach; ?>
  </div>

  <?php mt_dashboard_render($days); ?>

<?php elseif ($section === 'davranis'): ?>

  <div class="nav">
    <?php foreach ([1 => 'Bugun', 7 => '7 gun', 30 => '30 gun'] as $d => $et): ?>
      <a class="<?= $days === $d ? 'on' : '' ?>" href="?s=davranis&gun=<?= $d ?>"><?= h($et) ?></a>
    <?php endforeach; ?>
  </div>

  <?php mt_detail_render($days); ?>

<?php elseif ($section === 'kayitlar'): ?>

  <div class="nav">
    <?php foreach ([1 => 'Bugun', 7 => '7 gun', 30 => '30 gun'] as $d => $et): ?>
      <a class="<?= $days === $d ? 'on' : '' ?>" href="?s=kayitlar&gun=<?= $d ?>"><?= h($et) ?></a>
    <?php endforeach; ?>
  </div>

  <?php mt_audit_render($days); ?>

<?php elseif ($section === 'blog'): ?>

  <?php mt_blog_render($_SESSION['csrf']); ?>

<?php elseif ($section === 'olaylar'): ?>

  <div class="card">
    <h2>Son 100 olay</h2>
    <?php if (empty($olaylar)): ?>
      <p class="empty">Henuz olay kaydedilmedi. Siteyi tarayicinizda gezdiginizde burada gorunur.</p>
    <?php else: ?>
      <div style="overflow-x:auto">
        <table>
          <tr><th>Zaman (UTC)</th><th>Tur</th><th>Yol</th><th>Arac</th><th>Kaynak</th><th>Cihaz</th></tr>
          <?php foreach ($olaylar as $r): ?>
            <tr>
              <td><?= h($r['created_at']) ?></td>
              <td><?= h($r['event_type']) ?></td>
              <td><?= h($r['path']) ?></td>
              <td><?= h($r['tool_slug'] ?? '-') ?></td>
              <td><?= h($r['referrer_host'] ?? '(dogrudan)') ?></td>
              <td><?= h($r['device']) ?></td>
            </tr>
          <?php endforeach; ?>
        </table>
      </div>
    <?php endif; ?>
  </div>

<?php elseif ($section === 'kontrol'): ?>

  <div class="card">
    <h2>Site saglik kontrolu</h2>
    <?php if ($checks === []): ?>
      <p class="note">
        Siteye disaridan bakan bir istemci gibi 9 kontrol yapilir: erisim ve hiz, SSL suresi,
        www ve HTTPS yonlendirmeleri, robots/sitemap/ads.txt, gizli dosya sizintisi, analitik
        toplayici, sitemap adreslerinden rastgele ornek ve veritabani durumu.
      </p>
      <p style="margin-top:14px"><a class="btn" href="?s=kontrol&calistir=1">Kontrolleri calistir</a></p>
      <p class="note" style="margin-top:10px">Yaklasik 10-20 saniye surer.</p>
    <?php else: ?>
      <?php
      $sayac = ['ok' => 0, 'uyari' => 0, 'hata' => 0, 'bilgi' => 0];
      foreach ($checks as $c2) { $sayac[$c2['durum']]++; }
      ?>
      <p class="note" style="margin-bottom:8px">
        <?= (int) $sayac['ok'] ?> basarili &middot; <?= (int) $sayac['uyari'] ?> uyari &middot;
        <?= (int) $sayac['hata'] ?> hata &middot; <?= (int) $sayac['bilgi'] ?> bilgi
      </p>
      <?php foreach ($checks as $c2): ?>
        <div class="chk">
          <span class="dot d-<?= h($c2['durum']) ?>"></span>
          <span><b><?= h($c2['baslik']) ?></b><p><?= h($c2['detay']) ?></p></span>
        </div>
      <?php endforeach; ?>
      <p style="margin-top:16px"><a class="btn g" href="?s=kontrol&calistir=1">Yeniden calistir</a></p>
    <?php endif; ?>
  </div>

<?php elseif ($section === 'veri'): ?>

  <div class="grid g2">
    <div class="card">
      <h2>Disa aktar</h2>
      <p class="note">Son 50.000 olay CSV olarak indirilir (Excel uyumlu).</p>
      <p style="margin-top:12px"><a class="btn" href="?disaaktar=1">CSV indir</a></p>
    </div>

    <div class="card">
      <h2>Eski kayitlari temizle</h2>
      <p class="note">Veritabanini kucuk tutmak icin belirtilen sureden eski olaylari siler.</p>
      <form method="post" style="margin-top:12px">
        <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
        <input type="hidden" name="eylem" value="temizle">
        <?php foreach ([90, 180, 365] as $g): ?>
          <button class="btn g" name="gun" value="<?= $g ?>" type="submit"
                  data-onay="<?= $g ?> gunden eski kayitlar silinsin mi?">
            <?= $g ?> gunden eski
          </button>
        <?php endforeach; ?>
      </form>
    </div>

    <div class="card">
      <h2>Tum verileri sifirla</h2>
      <p class="note">
        Butun analitik kayitlari kalici olarak siler. Geri alinamaz.
        Onaylamak icin kutuya <code>SIFIRLA</code> yazin.
      </p>
      <form method="post" style="margin-top:12px">
        <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
        <input type="hidden" name="eylem" value="sifirla">
        <input type="text" name="onay" placeholder="SIFIRLA" autocomplete="off">
        <button class="btn r" type="submit" style="margin-top:10px"
                data-onay="Tum analitik veriler silinecek. Emin misiniz?">Sifirla</button>
      </form>
    </div>
  </div>

<?php elseif ($section === 'ayarlar'): ?>

  <div class="grid g2">
    <div class="card">
      <h2>Parola degistir</h2>
      <form method="post">
        <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
        <input type="hidden" name="eylem" value="parola">
        <label>Mevcut parola</label>
        <input type="password" name="mevcut" required autocomplete="current-password">
        <label>Yeni parola (en az 8 karakter)</label>
        <input type="password" name="yeni" required autocomplete="new-password">
        <label>Yeni parola (tekrar)</label>
        <input type="password" name="tekrar" required autocomplete="new-password">
        <button class="btn" type="submit" style="margin-top:14px">Guncelle</button>
      </form>
    </div>

    <div class="card">
      <h2>Sistem</h2>
      <table>
        <tr><td>PHP surumu</td><td class="n"><?= h(PHP_VERSION) ?></td></tr>
        <tr><td>Veritabani</td><td class="n"><?= h($config['db_name']) ?></td></tr>
        <tr><td>Site adresi</td><td class="n"><?= h($config['site_url']) ?></td></tr>
        <?php
        $satir = (int) $db->query('SELECT COUNT(*) FROM mt_events')->fetchColumn();
        $en    = $db->query('SELECT MIN(created_at) FROM mt_events')->fetchColumn();
        ?>
        <tr><td>Toplam olay</td><td class="n"><?= number_format($satir, 0, ',', '.') ?></td></tr>
        <tr><td>En eski kayit</td><td class="n"><?= h($en ? (string) $en : '-') ?></td></tr>
        <tr><td>Sunucu saati (UTC)</td><td class="n"><?= h(gmdate('Y-m-d H:i')) ?></td></tr>
      </table>
    </div>

    <div class="card" style="grid-column:1/-1">
      <h2>Reklam yapilandirmasi</h2>
      <p class="note">
        Reklam kimlikleri site derlenirken paketlenir, bu yuzden panelden degistirilemez.
        Degistirmek icin gelistirme makinesinde <code>.env</code> dosyasindaki
        <code>NEXT_PUBLIC_ADSENSE_CLIENT</code> ve <code>NEXT_PUBLIC_AD_*</code> degerlerini
        doldurup <code>npm run build:static</code> ile yeniden derleyin, ardindan
        <code>out/</code> klasorunu yukleyin.
        <br><br>
        Kimlik girilmediginde reklam alanlari bos kalmaz; yerine Premium tanitim karti gosterilir.
        Sponsorlu baglantilarin tiklama sayilari <b>Ozet</b> sekmesinde raporlanir.
      </p>
    </div>
  </div>

<?php endif; ?>

<p class="note" style="margin-top:24px">
  Ziyaretci kimlikleri gunluk degisen bir tuz ile hashlenir; ham IP adresi saklanmaz.
  Reklam geliri icin AdSense panelini, odemeler icin odeme saglayicinizin panelini kullanin.
</p>

</div>
<script nonce="<?= h($mtNonce) ?>">
/* data-onay tasiyan dugme veya form gonderimi once onay ister.
   Satir ici onclick yerine burada duruyor: CSP satir ici betigi engelliyor. */
document.addEventListener('click', function (e) {
  var d = e.target.closest('[data-onay]');
  if (d && !window.confirm(d.getAttribute('data-onay'))) { e.preventDefault(); }
}, true);
document.addEventListener('submit', function (e) {
  var f = e.target.closest('form[data-onay]');
  if (f && !window.confirm(f.getAttribute('data-onay'))) { e.preventDefault(); }
}, true);
</script>
</body></html>
