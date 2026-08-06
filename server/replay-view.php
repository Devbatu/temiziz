<?php
/**
 * Etkileşim kaydı oynatıcısı. public_html/mt/replay-view.php
 *
 * Nasıl çalışır: sayfanın kendisi bir iframe içinde açılır, üzerine kaydedilen
 * fare yolu imleç olarak canlandırılır. Böylece ağır bir DOM kayıt kütüphanesi
 * (rrweb ~100 KB) siteye eklenmeden video benzeri oynatma elde edilir.
 *
 * Sınır: iframe sayfanın GÜNCEL halini gösterir, kayıt anındaki halini değil.
 * Ziyaretçinin araca yazdığı metin de görünmez — o veri hiç toplanmıyor.
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
    exit('Kurulum tamamlanmamis.');
}
require $mtLib;
$config = mt_config();

session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'secure' => true,
    'httponly' => true, 'samesite' => 'Strict',
]);
session_name('mtadmin');
session_start();

if (empty($_SESSION['admin']) || ($_SESSION['ua'] ?? '') !== ($_SERVER['HTTP_USER_AGENT'] ?? '')) {
    http_response_code(403);
    exit('Yetkisiz.');
}

$id = (int) ($_GET['id'] ?? 0);
$st = mt_db()->prepare('SELECT * FROM mt_replays WHERE id = ?');
$st->execute([$id]);
$k = $st->fetch();
if (!$k) {
    http_response_code(404);
    exit('Kayit bulunamadi.');
}

// Satır içi betik için nonce: CSP'yi 'unsafe-inline' ile gevşetmek yerine
// yalnızca bu betiğe izin veriyoruz.
$nonce = base64_encode(random_bytes(16));
$siteUrl = rtrim($config['site_url'], '/');

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');
/**
 * Barindirici sunucu duzeyinde bir CSP basligi ayarliyor ve `Header set`
 * PHP'nin gonderdigini eziyor; bu yuzden ayni politika asagida
 * <meta http-equiv> olarak da basilir. Nonce her istekte degistigi icin
 * politika .htaccess'e tasinamaz.
 */
$mtCsp = "default-src 'self'; "
    . "script-src 'self' 'nonce-{$nonce}'; style-src 'self' 'unsafe-inline'; "
    . "img-src 'self' data:; frame-src 'self' {$siteUrl}";
header('Content-Security-Policy: ' . $mtCsp);
// Yonetim sayfasi hicbir kosulda indekslenmemeli.
header('X-Robots-Tag: noindex, nofollow, noarchive');

$frames = json_decode((string) $k['frames'], true) ?: [];
$sure   = (int) $k['duration_ms'];
?><!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="<?= h($mtCsp) ?>">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Kayit oynatici</title>
<style>
  :root{--bg:#0b0f1c;--card:#141a2e;--line:#232b45;--fg:#e9edf7;--muted:#8d97b4;--accent:#5b8cff}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);
       font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
  .wrap{max-width:1180px;margin:0 auto;padding:18px 16px 60px}
  .top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:14px}
  h1{font-size:18px;margin:0}
  .meta{color:var(--muted);font-size:12.5px}
  a.btn,button.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid var(--line);
       border-radius:9px;background:transparent;color:var(--fg);font-size:13.5px;cursor:pointer;text-decoration:none}
  button.btn.pri{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}
  .stage{position:relative;background:#000;border:1px solid var(--line);border-radius:12px;overflow:hidden}
  /* iframe bir VIDEO KARESI gibi davranmali: icindeki baglantiya tiklanirsa
     cerceve baska sayfaya gider ve kayit bozulur. pointer-events kapatiliyor,
     ustune de ayrica saydam bir kalkan koyuluyor (eski tarayicilarda
     pointer-events iframe'de guvenilir degil). */
  .stage iframe{display:block;border:0;background:#fff;transform-origin:0 0;
       pointer-events:none;user-select:none}
  #kalkan{position:absolute;inset:0;z-index:4;cursor:default;background:transparent}
  #cursor{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;
          background:rgba(91,140,255,.85);box-shadow:0 0 0 4px rgba(91,140,255,.22);
          pointer-events:none;z-index:5}
  #ripple{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;
          border:2px solid #fbbf24;opacity:0;pointer-events:none;z-index:6}
  .ctrl{display:flex;align-items:center;gap:12px;margin-top:12px;background:var(--card);
        border:1px solid var(--line);border-radius:11px;padding:11px 14px}
  input[type=range]{flex:1;accent-color:var(--accent)}
  #clock{font-variant-numeric:tabular-nums;color:var(--muted);font-size:12.5px;min-width:88px}
  #note{margin-top:10px;min-height:22px;font-size:13px;color:#8fd3ff}
  .log{margin-top:14px;background:var(--card);border:1px solid var(--line);border-radius:11px;
       padding:12px 14px;max-height:230px;overflow:auto}
  .log h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 8px}
  .log ol{margin:0;padding-left:20px}
  .log li{margin:3px 0;font-size:13px;color:#c8d0e4}
  .log li b{color:#8fd3ff}
  .log li.on{background:rgba(91,140,255,.16);border-radius:5px;
             margin-left:-6px;padding:1px 6px;color:#fff}
  .warn{margin-top:14px;color:var(--muted);font-size:12.5px;line-height:1.65;
        border-top:1px solid var(--line);padding-top:12px}
</style>
</head>
<body>
<div class="wrap">

  <div class="top">
    <div>
      <h1><?= h((string) $k['path']) ?></h1>
      <div class="meta">
        <?= h((string) $k['created_at']) ?> UTC &middot;
        <?= h(mt_sure((float) ($sure / 1000))) ?> &middot;
        <?= (int) $k['frame_count'] ?> kare &middot;
        <?= h((string) $k['device']) ?> &middot;
        <?= h((string) ($k['browser'] ?? '-')) ?>/<?= h((string) ($k['os'] ?? '-')) ?> &middot;
        ekran <?= (int) $k['viewport_w'] ?>&times;<?= (int) $k['viewport_h'] ?>
      </div>
    </div>
    <a class="btn" href="admin.php?s=davranis">&larr; Davranis</a>
  </div>

  <div class="stage" id="stage">
    <?php
    /*
     * `allow-scripts` NEDEN ACIK: arac bilesenleri yalnizca istemcide yukleniyor.
     * Betikler kapaliyken sayfa sonsuza kadar "Arac yukleniyor..." iskeletinde
     * kaliyor ve kaydin ustunde ziyaretcinin gordugu ekran yerine bos bir
     * cerceve gorunuyordu.
     *
     * SAHTE KAYIT SORUNU: betikler acilinca sitenin kendi izleyicisi de iframe
     * icinde calisir ve her izleme yeni bir ziyaret + yeni bir kayit uretirdi.
     * Bu yuzden sayfa `?mtreplay=1` ile aciliyor; izleyici bu bayragi gorunce
     * tamamen devre disi kaliyor (bkz. components/analytics/Tracker.tsx).
     *
     * `allow-same-origin` de gerekli: Next.js hidrasyonu ve tema betigi
     * localStorage'a eristigi icin opak kokende hata veriyor. Cerceve zaten
     * kendi sitemizin sayfasini gosteriyor ve uzerinde tiklamayi engelleyen
     * bir kalkan var.
     */
    $onizleme = $siteUrl . (string) $k['path'];
    $onizleme .= (str_contains($onizleme, '?') ? '&' : '?') . 'mtreplay=1';
    ?>
    <iframe id="frame" title="Kayit onizleme"
            sandbox="allow-scripts allow-same-origin"
            tabindex="-1" aria-hidden="true"
            src="<?= h($onizleme) ?>"></iframe>
    <div id="kalkan"></div>
    <div id="cursor"></div>
    <div id="ripple"></div>
  </div>

  <div class="ctrl">
    <button class="btn pri" id="play">&#9654; Oynat</button>
    <button class="btn" id="speed" data-x="1">1&times;</button>
    <input type="range" id="seek" min="0" max="<?= max($sure, 1) ?>" value="0" step="50">
    <span id="clock">0.0 / <?= number_format($sure / 1000, 1, ',', '') ?> sn</span>
  </div>
  <div id="note"></div>

  <div class="log">
    <h2>Etkilesim dokumu</h2>
    <ol id="events"></ol>
  </div>

  <p class="warn">
    <strong>Bu oynatici ne gosterir:</strong> fare yolu, tiklamalar, uzerinde beklenen
    dugme/baglanti ve kaydirma konumu. Arka plandaki sayfa <em>canli</em> yuklenir, yani
    sayfanin bugunku halini gorursunuz &mdash; kayit anindaki halini degil.<br>
    <strong>Ne gostermez:</strong> ziyaretcinin araclara yazdigi metin, dosya icerigi veya
    sonuc panellerindeki cikti. Bu veriler hic toplanmaz; toplanmasi halinde JSON aracina
    yapistirilan API anahtarlari veya AI ozgecmis aracina girilen kisisel bilgiler kayda
    gecerdi.
  </p>
</div>

<script nonce="<?= h($nonce) ?>">
(function () {
  var FRAMES = <?= json_encode($frames, JSON_UNESCAPED_UNICODE) ?>;
  var TOTAL  = <?= max($sure, 1) ?>;
  var VW = <?= max((int) $k['viewport_w'], 320) ?>;
  var VH = <?= max((int) $k['viewport_h'], 400) ?>;
  var DH = <?= max((int) $k['doc_h'], (int) $k['viewport_h'], 400) ?>;

  var stage  = document.getElementById('stage');
  var frame  = document.getElementById('frame');
  var cursor = document.getElementById('cursor');
  var ripple = document.getElementById('ripple');
  var playBtn = document.getElementById('play');
  var speedBtn = document.getElementById('speed');
  var seek   = document.getElementById('seek');
  var clock  = document.getElementById('clock');
  var note   = document.getElementById('note');
  var list   = document.getElementById('events');

  /**
   * iframe kaydedilen ekran genisliginde olusturulur, sonra sahneye sigacak
   * sekilde olceklenir. Boylece duzen ziyaretcinin gordugu gibi kalir.
   */
  function layout() {
    var w = stage.clientWidth;
    var scale = Math.min(1, w / VW);
    frame.style.width = VW + 'px';
    /* iframe BELGENIN TAM BOYUNDA olusturulur. Yalnizca ekran yuksekligi
       kadar yapilirsa sayfanin alt kismi hic render edilmez ve kaydirma
       canlandirildiginda ekrana siyahlik gelir. Sahne (overflow:hidden)
       ziyaretcinin ekranini temsil eden pencere gorevi gorur. */
    frame.style.height = DH + 'px';
    stage.style.height = Math.round(VH * scale) + 'px';
    return scale;
  }
  var scale = layout();
  window.addEventListener('resize', function () { scale = layout(); yerlestir(); });

  // Etkilesim dokumu
  var TUR = { 1: 'Tikladi', 2: 'Uzerinde bekledi', 3: 'Kaydirdi' };
  var satirlar = [];   // dokumdeki <li> ogeleri, zamana gore vurgulanir
  FRAMES.forEach(function (f) {
    if (f[0] === 0) return; // fare hareketini dokume yazmiyoruz, cok kalabalik
    var li = document.createElement('li');
    var sn = (f[1] / 1000).toFixed(1) + ' sn';
    if (f[0] === 1) {
      li.innerHTML = sn + ' &mdash; <b>Tikladi</b>' + (f[4] ? ': ' + escapeHtml(f[4]) : '');
    } else if (f[0] === 2) {
      li.innerHTML = sn + ' &mdash; <b>Uzerinde bekledi</b> (' +
        (f[3] / 1000).toFixed(1) + ' sn): ' + escapeHtml(f[2]);
    } else {
      li.textContent = sn + ' — Kaydirdi: %' + Math.round(f[2] / 10);
    }
    li.dataset.t = f[1];
    satirlar.push(li);
    list.appendChild(li);
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var t = 0;
  var playing = false;
  var lastTick = 0;
  var rate = 1;
  var shownClick = -1;
  var kaydirmaPx = 0;   // sayfanin o anki kaydirma konumu (olceklenmemis px)
  var sonFare = null;
  var etkinSatir = -1;

  /** iframe'i ve imleci o anki kaydirma konumuna gore yerlestirir. */
  function yerlestir() {
    frame.style.transform = 'scale(' + scale + ') translateY(' + (-kaydirmaPx) + 'px)';
    if (sonFare) {
      var docY = (sonFare[3] / 1000) * DH;
      cursor.style.left = ((sonFare[2] / 1000) * VW * scale) + 'px';
      cursor.style.top  = ((docY - kaydirmaPx) * scale) + 'px';
    }
  }

  function apply(time) {
    var mouse = null, scroll = null, hover = null;
    for (var i = 0; i < FRAMES.length; i++) {
      var f = FRAMES[i];
      if (f[1] > time) break;
      if (f[0] === 0) mouse = f;
      else if (f[0] === 3) scroll = f;
      else if (f[0] === 2 && time - f[1] < f[3]) hover = f;
      else if (f[0] === 1 && time - f[1] < 600) {
        if (shownClick !== i) { shownClick = i; flash(f); }
      }
    }

    /* Kaydirma: iframe icini kaydirmak yerine tam boy iframe'i yukari
       kaydiriyoruz; sandbox altinda icerige erisebildigimiz garanti degil. */
    kaydirmaPx = scroll ? (scroll[2] / 1000) * Math.max(DH - VH, 0) : 0;
    if (mouse) { sonFare = mouse; }
    yerlestir();

    note.textContent = hover ? 'Uzerinde bekliyor: ' + hover[2] : '';
    seek.value = time;
    clock.textContent = (time / 1000).toFixed(1) + ' / ' + (TOTAL / 1000).toFixed(1) + ' sn';
    dokumuIsaretle(time);
  }

  /** Dokumde o ana denk gelen son satiri vurgular ve gorunur alana getirir. */
  function dokumuIsaretle(time) {
    var yeni = -1;
    for (var i = 0; i < satirlar.length; i++) {
      if (+satirlar[i].dataset.t <= time) { yeni = i; } else { break; }
    }
    if (yeni === etkinSatir) { return; }
    if (satirlar[etkinSatir]) { satirlar[etkinSatir].classList.remove('on'); }
    etkinSatir = yeni;
    if (satirlar[yeni]) {
      satirlar[yeni].classList.add('on');
      var kutu = satirlar[yeni].parentNode.parentNode;   // .log
      var ust  = satirlar[yeni].offsetTop - kutu.offsetTop;
      if (ust < kutu.scrollTop || ust > kutu.scrollTop + kutu.clientHeight - 30) {
        kutu.scrollTop = ust - kutu.clientHeight / 2;
      }
    }
  }

  function flash(f) {
    var docY = (f[3] / 1000) * DH;
    ripple.style.left = ((f[2] / 1000) * VW * scale) + 'px';
    ripple.style.top  = ((docY - kaydirmaPx) * scale) + 'px';
    ripple.style.transition = 'none';
    ripple.style.opacity = '1';
    ripple.style.transform = 'scale(.4)';
    requestAnimationFrame(function () {
      ripple.style.transition = 'opacity .6s, transform .6s';
      ripple.style.opacity = '0';
      ripple.style.transform = 'scale(1.6)';
    });
  }

  function tick(now) {
    if (!playing) return;
    if (!lastTick) lastTick = now;
    t += (now - lastTick) * rate;
    lastTick = now;
    if (t >= TOTAL) { t = TOTAL; stop(); }
    apply(t);
    if (playing) requestAnimationFrame(tick);
  }

  function start() {
    if (t >= TOTAL) { t = 0; shownClick = -1; etkinSatir = -1; }
    playing = true;
    lastTick = 0;
    gecisAyarla(250 / rate);
    playBtn.innerHTML = '&#10073;&#10073; Duraklat';
    requestAnimationFrame(tick);
  }
  function stop() {
    playing = false;
    gecisAyarla(0);
    playBtn.innerHTML = '&#9654; Oynat';
  }

  /**
   * Kayit 250 ms araliklarla ornekleniyor; imlec ve sayfa bu sureye yayilarak
   * kayarsa hareket akici gorunur. Hiz carpani artinca sure de kisalmali,
   * yoksa imlec goruntunun gerisinde kalir. Ileri/geri sarmada 0 verilir ki
   * imlec araya animasyon koymadan dogru yere atlasin.
   */
  function gecisAyarla(ms) {
    var g = ms > 0 ? ms + 'ms linear' : '0s';
    cursor.style.transition = 'left ' + g + ', top ' + g;
    frame.style.transition  = 'transform ' + g;
  }
  gecisAyarla(0);

  playBtn.addEventListener('click', function () { playing ? stop() : start(); });
  speedBtn.addEventListener('click', function () {
    var d = [1, 2, 4], x = +speedBtn.dataset.x;
    rate = d[(d.indexOf(x) + 1) % d.length];
    speedBtn.dataset.x = rate;
    speedBtn.textContent = rate + '×';
    if (playing) { gecisAyarla(250 / rate); }
  });
  seek.addEventListener('input', function () {
    gecisAyarla(0);
    t = +seek.value;
    shownClick = -1;
    apply(t);
  });

  frame.addEventListener('load', function () { apply(t); });
  apply(0);
})();
</script>
</body>
</html>
