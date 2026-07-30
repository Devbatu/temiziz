<?php
/**
 * Yonetim panosu (Ozet sekmesi).
 *
 * Tasarim ilkesi: her sayi bir KARARA hizmet etmeli. Bu yuzden ham sayilarin
 * yanina onceki doneme gore degisim, huni oranlari ve otomatik cikarilan
 * uyarilar konuluyor. "1000 gosterim" tek basina bir sey soylemez; "1000
 * gosterim, gecen haftaya gore %40 dusus" soyler.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * Panonun tum verisini tek yerde toplar.
 * Karsilastirma icin bir onceki ESIT uzunluktaki donem de sorgulanir.
 */
function mt_dashboard_data(int $days): array
{
    $db = mt_db();

    $q = static function (string $sql, array $args = []) use ($db): array {
        $s = $db->prepare($sql);
        $s->execute($args);
        return $s->fetchAll();
    };

    // Insan trafigi (botlar ayri raporlanir)
    $insan = 'device <> "bot"';
    $simdi = "created_at > (UTC_TIMESTAMP() - INTERVAL {$days} DAY)";
    $onceki = "created_at > (UTC_TIMESTAMP() - INTERVAL " . ($days * 2) . " DAY)
               AND created_at <= (UTC_TIMESTAMP() - INTERVAL {$days} DAY)";

    $ozetSql = static fn (string $aralik): string =>
        "SELECT
            COUNT(DISTINCT visitor_hash) AS ziyaretci,
            SUM(event_type = 'pageview') AS gosterim,
            SUM(event_type = 'tool_run') AS arac,
            SUM(event_type = 'affiliate_click') AS sponsor
         FROM mt_events WHERE {$insan} AND {$aralik}";

    $d = [
        'simdi'  => $q($ozetSql($simdi))[0] ?? [],
        'onceki' => $q($ozetSql($onceki))[0] ?? [],
    ];

    // Gunluk seri — eksik gunler sifirla doldurulur, grafik kesintisiz olsun.
    $ham = $q(
        "SELECT DATE(created_at) AS gun,
                SUM(event_type = 'pageview') AS gosterim,
                COUNT(DISTINCT visitor_hash) AS ziyaretci
         FROM mt_events WHERE {$insan} AND {$simdi}
         GROUP BY gun ORDER BY gun"
    );
    $harita = [];
    foreach ($ham as $r) {
        $harita[(string) $r['gun']] = $r;
    }
    $seri = [];
    for ($i = $days - 1; $i >= 0; $i--) {
        $gun = gmdate('Y-m-d', strtotime("-{$i} day"));
        $seri[] = [
            'etiket'    => gmdate('j.n', strtotime($gun)),
            'deger'     => (int) ($harita[$gun]['gosterim'] ?? 0),
            'ziyaretci' => (int) ($harita[$gun]['ziyaretci'] ?? 0),
        ];
    }
    $d['seri'] = $seri;

    // Huni: arac sayfasini goren -> araci calistiran -> sonuc alan
    $huni = $q(
        "SELECT
            SUM(event_type = 'pageview' AND path LIKE '/tools/%/') AS gordu,
            SUM(event_type = 'tool_run')    AS calistirdi,
            SUM(event_type = 'tool_result') AS sonuc
         FROM mt_events WHERE {$insan} AND {$simdi}"
    )[0] ?? [];
    $d['huni'] = $huni;

    $d['araclar'] = $q(
        "SELECT tool_slug AS etiket, COUNT(*) AS deger, COUNT(DISTINCT visitor_hash) AS kisi
         FROM mt_events
         WHERE {$insan} AND {$simdi} AND event_type = 'tool_run' AND tool_slug IS NOT NULL
         GROUP BY tool_slug ORDER BY deger DESC LIMIT 10"
    );

    $d['sayfalar'] = $q(
        "SELECT path AS etiket, COUNT(*) AS deger
         FROM mt_events
         WHERE {$insan} AND {$simdi} AND event_type = 'pageview'
         GROUP BY path ORDER BY deger DESC LIMIT 10"
    );

    $d['kaynaklar'] = $q(
        "SELECT COALESCE(referrer_host, '(dogrudan)') AS etiket, COUNT(*) AS deger
         FROM mt_events WHERE {$insan} AND {$simdi}
         GROUP BY etiket ORDER BY deger DESC LIMIT 8"
    );

    $d['cihaz'] = $q(
        "SELECT device AS etiket, COUNT(*) AS deger
         FROM mt_events WHERE {$insan} AND {$simdi}
         GROUP BY device ORDER BY deger DESC"
    );

    $d['tarayici'] = $q(
        "SELECT COALESCE(browser, 'Bilinmiyor') AS etiket, COUNT(*) AS deger
         FROM mt_events WHERE {$insan} AND {$simdi}
         GROUP BY etiket ORDER BY deger DESC LIMIT 6"
    );

    $d['etkilesim'] = $q(
        "SELECT ROUND(AVG(duration_ms) / 1000) AS ort_sure,
                ROUND(AVG(scroll_pct)) AS ort_kaydirma,
                COUNT(*) AS olcum
         FROM mt_events
         WHERE {$insan} AND {$simdi} AND event_type = 'page_leave'"
    )[0] ?? [];

    $d['botlar'] = $q(
        "SELECT COALESCE(label, 'Bilinmiyor') AS etiket, COUNT(*) AS deger,
                COUNT(DISTINCT path) AS sayfa
         FROM mt_events
         WHERE device = 'bot' AND {$simdi}
         GROUP BY etiket ORDER BY deger DESC LIMIT 8"
    );

    // Cok goruntulenip az kullanilan araclar: arayuz sorunu isareti
    $d['dusukDonusum'] = $q(
        "SELECT t.arac AS etiket, t.gordu AS deger, COALESCE(r.calisti, 0) AS calisti
         FROM (
            SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(path, '/tools/', -1), '/', 1) AS arac,
                   COUNT(*) AS gordu
            FROM mt_events
            WHERE {$insan} AND {$simdi} AND event_type = 'pageview' AND path LIKE '/tools/%/'
            GROUP BY arac
         ) t
         LEFT JOIN (
            SELECT tool_slug, COUNT(*) AS calisti
            FROM mt_events
            WHERE {$insan} AND {$simdi} AND event_type = 'tool_run'
            GROUP BY tool_slug
         ) r ON r.tool_slug = t.arac
         WHERE t.gordu >= 3 AND COALESCE(r.calisti, 0) = 0
         ORDER BY t.gordu DESC LIMIT 5"
    );

    return $d;
}

/**
 * Veriden otomatik gozlem cikarir.
 *
 * Amac: kullanicinin tablolara bakip cikarim yapmasini beklemek yerine
 * dikkat edilmesi gereken seyi dogrudan soylemek.
 */
function mt_dashboard_insights(array $d, int $days): array
{
    $out = [];
    $s = $d['simdi'];
    $gosterim = (int) ($s['gosterim'] ?? 0);
    $arac     = (int) ($s['arac'] ?? 0);

    if ($gosterim === 0) {
        return [['uyari', 'Bu aralikta hic ziyaret yok. Siteyi tarayicida gezerek olcumun calistigini dogrulayabilirsiniz.']];
    }

    // Trafik kaynagi analizi
    $dogrudan = 0;
    $arama    = 0;
    foreach ($d['kaynaklar'] as $k) {
        if ($k['etiket'] === '(dogrudan)') {
            $dogrudan += (int) $k['deger'];
        } elseif (preg_match('/google|bing|yandex|duckduckgo/i', (string) $k['etiket'])) {
            $arama += (int) $k['deger'];
        }
    }
    $toplamKaynak = array_sum(array_map(static fn ($k) => (int) $k['deger'], $d['kaynaklar']));
    if ($toplamKaynak > 0 && $arama / $toplamKaynak < 0.1) {
        $out[] = ['uyari', 'Trafigin neredeyse tamami dogrudan geliyor, arama motorundan gelen yok denecek kadar az. '
            . 'Search Console kurulumu ve sitemap gonderimi bu yuzden en oncelikli is.'];
    } elseif ($arama > 0) {
        $out[] = ['iyi', 'Arama motorundan ' . mt_n($arama) . ' ziyaret geldi &mdash; indekslenme calisiyor.'];
    }

    // Arac donusumu
    $gordu = (int) ($d['huni']['gordu'] ?? 0);
    if ($gordu >= 5) {
        $oran = (int) round(($arac / max($gordu, 1)) * 100);
        if ($oran < 15) {
            $out[] = ['uyari', 'Arac sayfasini acan ' . mt_n($gordu) . ' kisiden yalnizca %' . $oran
                . ' araci calistirdi. Arayuz beklentiyi karsilamiyor olabilir.'];
        } else {
            $out[] = ['iyi', 'Arac sayfasini acanlarin %' . $oran . ' kadari araci gercekten calistirdi.'];
        }
    }

    // Hic kullanilmayan ama goruntulenen araclar
    if ($d['dusukDonusum'] !== []) {
        $liste = implode(', ', array_map(static fn ($r) => (string) $r['etiket'], $d['dusukDonusum']));
        $out[] = ['uyari', 'Su araclar goruntulendi ama hic calistirilmadi: ' . $liste
            . '. Sayfayi acip kendiniz denemekte fayda var.'];
    }

    // Etkilesim
    $sure = (int) ($d['etkilesim']['ort_sure'] ?? 0);
    if ((int) ($d['etkilesim']['olcum'] ?? 0) >= 5) {
        if ($sure < 15) {
            $out[] = ['uyari', 'Ortalama sayfada kalma suresi ' . $sure . ' saniye. Ziyaretciler aradigini bulamiyor olabilir.'];
        } else {
            $out[] = ['iyi', 'Ortalama kalma suresi ' . mt_sure((float) $sure) . ' &mdash; icerik ilgi goruyor.'];
        }
    }

    // Bot / SEO
    $googlebot = 0;
    foreach ($d['botlar'] as $b) {
        if (str_contains((string) $b['etiket'], 'Googlebot')) {
            $googlebot += (int) $b['deger'];
        }
    }
    if ($googlebot === 0) {
        $out[] = ['uyari', 'Googlebot bu aralikta siteyi hic taramadi. Search Console dogrulamasi yapilmadigi surece indekslenme baslamaz.'];
    } else {
        $out[] = ['iyi', 'Googlebot ' . mt_n($googlebot) . ' kez tarama yapti.'];
    }

    // Gelir
    if ((int) ($s['sponsor'] ?? 0) === 0 && $gosterim > 30) {
        $out[] = ['bilgi', 'Henuz sponsorlu baglantiya tiklanmadi. Trafik artmadan gelir beklemek gerceksiz; once siralama.'];
    }

    return $out;
}

/* ─────────────────────────── Cizim ─────────────────────────── */

function mt_dashboard_render(int $days): void
{
    $d = mt_dashboard_data($days);
    $s = $d['simdi'];
    $o = $d['onceki'];
    $insights = mt_dashboard_insights($d, $days);

    $kpi = [
        ['Tekil ziyaretci', (int) ($s['ziyaretci'] ?? 0), (int) ($o['ziyaretci'] ?? 0), '#5b8cff'],
        ['Sayfa gosterimi', (int) ($s['gosterim'] ?? 0), (int) ($o['gosterim'] ?? 0), '#8b5cf6'],
        ['Arac kullanimi',  (int) ($s['arac'] ?? 0),      (int) ($o['arac'] ?? 0),      '#34d399'],
        ['Sponsor tiklama', (int) ($s['sponsor'] ?? 0),   (int) ($o['sponsor'] ?? 0),   '#fbbf24'],
    ];
    ?>

    <div class="kpis">
      <?php foreach ($kpi as [$etiket, $simdi, $onceki, $renk]): ?>
        <div class="kpi-card">
          <span class="kpi-bar" style="background:<?= $renk ?>"></span>
          <div class="kpi-top">
            <span class="kpi-num"><?= mt_n($simdi) ?></span>
            <?= mt_delta($simdi, $onceki) ?>
          </div>
          <div class="kpi-lbl"><?= h($etiket) ?></div>
          <div class="kpi-prev">onceki <?= $days ?> gun: <?= mt_n($onceki) ?></div>
        </div>
      <?php endforeach; ?>
    </div>

    <?php if ($insights !== []): ?>
      <div class="card" style="margin-top:14px">
        <h2>Dikkat edilmesi gerekenler</h2>
        <ul class="insights">
          <?php foreach ($insights as [$tur, $metin]): ?>
            <li class="ins-<?= h($tur) ?>"><?= $metin ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php endif; ?>

    <div class="card" style="margin-top:14px">
      <h2>Gunluk sayfa gosterimi</h2>
      <?= mt_chart_area($d['seri']) ?>
    </div>

    <div class="grid g2" style="margin-top:14px">
      <div class="card">
        <h2>Arac donusum hunisi</h2>
        <?= mt_chart_funnel([
            ['etiket' => 'Arac sayfasi goruntulendi', 'deger' => (int) ($d['huni']['gordu'] ?? 0)],
            ['etiket' => 'Arac calistirildi',          'deger' => (int) ($d['huni']['calistirdi'] ?? 0)],
            ['etiket' => 'Sonuc alindi (kopyala/indir)', 'deger' => (int) ($d['huni']['sonuc'] ?? 0)],
        ]) ?>
        <p class="note" style="margin-top:12px">
          Her adimin yanindaki yuzde, bir onceki adimdan gecen kisi oranidir.
        </p>
      </div>

      <div class="card">
        <h2>Etkilesim</h2>
        <?php $olcum = (int) ($d['etkilesim']['olcum'] ?? 0); ?>
        <?php if ($olcum === 0): ?>
          <p class="empty">Henuz olcum yok. Bu veri ziyaretci sayfadan ayrilirken toplanir.</p>
        <?php else: ?>
          <div class="mini-kpis">
            <div><span><?= h(mt_sure((float) ($d['etkilesim']['ort_sure'] ?? 0))) ?></span><em>ortalama kalma suresi</em></div>
            <div><span>%<?= (int) ($d['etkilesim']['ort_kaydirma'] ?? 0) ?></span><em>ortalama kaydirma derinligi</em></div>
            <div><span><?= mt_n($olcum) ?></span><em>olculen sayfa ziyareti</em></div>
          </div>
          <p class="note" style="margin-top:12px">
            Kaydirma derinligi, icerigin ne kadarinin gercekten goruldugunu gosterir.
            Reklam yerlesimi icin de olcut: %25'in altinda kalan alanlar nadiren goruluyor.
          </p>
        <?php endif; ?>
      </div>
    </div>

    <div class="grid g2" style="margin-top:14px">
      <div class="card">
        <h2>En cok kullanilan araclar</h2>
        <?= mt_chart_bars(array_map(static fn (array $r): array => [
            'etiket'   => (string) $r['etiket'],
            'deger'    => (int) $r['deger'],
            'ek'       => (int) $r['kisi'] . ' kisi',
            'baglanti' => '/tools/' . $r['etiket'] . '/',
        ], $d['araclar']), '#34d399') ?>
      </div>

      <div class="card">
        <h2>En cok goruntulenen sayfalar</h2>
        <?= mt_chart_bars(array_map(static fn (array $r): array => [
            'etiket'   => (string) $r['etiket'],
            'deger'    => (int) $r['deger'],
            'baglanti' => (string) $r['etiket'],
        ], $d['sayfalar']), '#8b5cf6') ?>
      </div>

      <div class="card">
        <h2>Trafik kaynaklari</h2>
        <?= mt_chart_bars($d['kaynaklar'], '#5b8cff') ?>
      </div>

      <div class="card">
        <h2>Arama motoru botlari</h2>
        <?= mt_chart_bars(array_map(static fn (array $r): array => [
            'etiket' => (string) $r['etiket'],
            'deger'  => (int) $r['deger'],
            'ek'     => (int) $r['sayfa'] . ' sayfa',
        ], $d['botlar']), '#22d3ee') ?>
        <p class="note" style="margin-top:10px">
          Botlar ziyaretci sayilarina dahil edilmez. Googlebot'un buradaki varligi
          indekslenmenin basladigini gosterir.
        </p>
      </div>

      <div class="card">
        <h2>Cihaz dagilimi</h2>
        <?= mt_chart_donut($d['cihaz']) ?>
      </div>

      <div class="card">
        <h2>Tarayici dagilimi</h2>
        <?= mt_chart_donut($d['tarayici']) ?>
      </div>
    </div>
    <?php
}
