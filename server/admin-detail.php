<?php
/**
 * Davranis analitigi: ziyaretci yolculuklari, donusum hunisi, etkilesim.
 *
 * "Kim geldi, ne yapti" sorusunu ekran kaydi olmadan yanitlar. Oturumlar
 * sunucu tarafinda TURETILIR: ayni ziyaretci hash'ine ait olaylar zaman
 * sirasina dizilir ve 30 dakikadan uzun bosluk yeni oturum sayilir. Boylece
 * tarayicida hicbir kimlik saklamaya gerek kalmaz.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

/** Oturum siniri: bu sureden uzun sessizlik yeni oturum baslatir. */
const MT_SESSION_GAP = 1800; // 30 dakika

/**
 * Son ziyaretleri oturumlara bolerek dondurur.
 *
 * @return array<int, array{
 *   basladi:string, bitti:string, sure:int, adim:int, cihaz:string,
 *   tarayici:string, os:string, kaynak:string, olaylar:array<int,array>
 * }>
 */
function mt_journeys(int $limitSessions = 25, int $days = 7): array
{
    $rows = mt_db()->prepare(
        'SELECT visitor_hash, event_type, path, tool_slug, label, duration_ms, scroll_pct,
                browser, os, device, referrer_host, created_at
         FROM mt_events
         WHERE device <> "bot" AND created_at > (UTC_TIMESTAMP() - INTERVAL ? DAY)
         ORDER BY visitor_hash, created_at, id'
    );
    $rows->execute([$days]);

    $sessions = [];
    $current  = null;
    $lastHash = null;
    $lastTime = 0;

    foreach ($rows as $r) {
        $t = strtotime((string) $r['created_at']);
        $yeniOturum = $r['visitor_hash'] !== $lastHash || ($t - $lastTime) > MT_SESSION_GAP;

        if ($yeniOturum) {
            if ($current !== null) {
                $sessions[] = $current;
            }
            $current = [
                'basladi'  => (string) $r['created_at'],
                'bitti'    => (string) $r['created_at'],
                'sure'     => 0,
                'adim'     => 0,
                'cihaz'    => (string) $r['device'],
                'tarayici' => (string) ($r['browser'] ?? '-'),
                'os'       => (string) ($r['os'] ?? '-'),
                'kaynak'   => (string) ($r['referrer_host'] ?? '(dogrudan)'),
                'olaylar'  => [],
            ];
        }

        $current['bitti'] = (string) $r['created_at'];
        $current['sure']  = strtotime($current['bitti']) - strtotime($current['basladi']);
        if ($r['event_type'] !== 'page_leave') {
            $current['adim']++;
        }
        $current['olaylar'][] = $r;

        $lastHash = $r['visitor_hash'];
        $lastTime = $t;
    }
    if ($current !== null) {
        $sessions[] = $current;
    }

    // En yeni oturumlar once; ilgi cekici olan son ziyaretlerdir.
    usort($sessions, static fn (array $a, array $b): int => strcmp($b['basladi'], $a['basladi']));
    return array_slice($sessions, 0, $limitSessions);
}

/**
 * Arac donusum hunisi: sayfayi goren / araci calistiran / sonuc alan.
 * Nerede kayip yasandigini gosterir.
 */
function mt_funnel(int $days = 7): array
{
    $rows = mt_db()->prepare(
        'SELECT
            COALESCE(tool_slug, SUBSTRING_INDEX(SUBSTRING_INDEX(path, "/tools/", -1), "/", 1)) AS arac,
            SUM(event_type = "pageview")    AS goruntuleme,
            SUM(event_type = "tool_run")    AS calistirma,
            SUM(event_type = "tool_result") AS sonuc,
            SUM(event_type = "tool_error")  AS hata
         FROM mt_events
         WHERE device <> "bot"
           AND (path LIKE "/tools/%" OR tool_slug IS NOT NULL)
           AND created_at > (UTC_TIMESTAMP() - INTERVAL ? DAY)
         GROUP BY arac
         HAVING goruntuleme > 0 OR calistirma > 0
         ORDER BY goruntuleme DESC, calistirma DESC
         LIMIT 25'
    );
    $rows->execute([$days]);
    return $rows->fetchAll();
}

/** Sayfa basina etkilesim: ortalama sure ve kaydirma derinligi. */
function mt_engagement(int $days = 7): array
{
    $rows = mt_db()->prepare(
        'SELECT path,
                COUNT(*) AS olcum,
                ROUND(AVG(duration_ms) / 1000) AS ort_saniye,
                ROUND(AVG(scroll_pct)) AS ort_kaydirma
         FROM mt_events
         WHERE event_type = "page_leave" AND device <> "bot"
           AND created_at > (UTC_TIMESTAMP() - INTERVAL ? DAY)
         GROUP BY path
         HAVING olcum >= 1
         ORDER BY olcum DESC
         LIMIT 20'
    );
    $rows->execute([$days]);
    return $rows->fetchAll();
}

/* ─────────────────────────── Cizim ─────────────────────────── */

/** Olay turunu okunur bir etikete cevirir. */
function mt_event_label(array $e): string
{
    $yol = (string) $e['path'];
    return match ((string) $e['event_type']) {
        'pageview'        => 'Sayfayi acti: ' . $yol,
        'page_leave'      => sprintf(
            'Ayrildi (%s, %%%d gordu)',
            mt_sure((int) ($e['duration_ms'] ?? 0) / 1000),
            (int) ($e['scroll_pct'] ?? 0)
        ),
        'tool_run'        => 'ARACI CALISTIRDI: ' . ($e['tool_slug'] ?? '?'),
        'tool_result'     => 'Sonuc aldi (' . ($e['label'] ?? '-') . '): ' . ($e['tool_slug'] ?? '?'),
        'tool_error'      => 'HATA aldi: ' . ($e['tool_slug'] ?? '?'),
        'affiliate_click' => 'SPONSORLU BAGLANTIYA TIKLADI: ' . ($e['label'] ?? '-'),
        'outbound'        => 'Siteden ayrilan baglantiya tikladi',
        default           => (string) $e['event_type'],
    };
}



/** Oynatilabilir etkilesim kayitlari. */
function mt_replay_list(int $limit = 30): array
{
    $st = mt_db()->prepare(
        'SELECT id, path, duration_ms, frame_count, browser, os, device, viewport_w, created_at
         FROM mt_replays ORDER BY id DESC LIMIT ?'
    );
    $st->bindValue(1, $limit, PDO::PARAM_INT);
    $st->execute();
    return $st->fetchAll();
}

function mt_detail_render(int $days): void
{
    $journeys   = mt_journeys(25, $days);
    $funnel     = mt_funnel($days);
    $engagement = mt_engagement($days);
    ?>


    <div class="card">
      <h2>Etkilesim kayitlari &mdash; oynatilabilir</h2>
      <p class="note" style="margin-bottom:12px">
        Fare yolu, tiklamalar, uzerinde beklenen dugmeler ve kaydirma kaydedilir;
        oynaticida sayfanin uzerinde imlec animasyonu olarak izlenir.
        <strong>Yazilan metin kaydedilmez.</strong> En yeni 300 kayit tutulur.
      </p>
      <?php $kayitlar = mt_replay_list(30); ?>
      <?php if ($kayitlar === []): ?>
        <p class="empty">
          Henuz kayit yok. Bu veri bu guncellemeden sonraki ziyaretlerde toplanir
          ve en az dort etkilesim gerektirir (kisa ziyaretler kaydedilmez).
        </p>
      <?php else: ?>
        <div style="overflow-x:auto">
        <table>
          <tr><th>Zaman (UTC)</th><th>Sayfa</th><th class="n">Sure</th><th class="n">Kare</th>
              <th>Cihaz</th><th></th></tr>
          <?php foreach ($kayitlar as $r): ?>
            <tr>
              <td style="white-space:nowrap"><?= h((string) $r['created_at']) ?></td>
              <td><?= h((string) $r['path']) ?></td>
              <td class="n"><?= h(mt_sure((float) ((int) $r['duration_ms'] / 1000))) ?></td>
              <td class="n"><?= (int) $r['frame_count'] ?></td>
              <td><?= h((string) $r['device']) ?> &middot; <?= h((string) ($r['browser'] ?? '-')) ?>
                  &middot; <?= (int) $r['viewport_w'] ?>px</td>
              <td class="n" style="white-space:nowrap">
                <a class="btn" style="padding:5px 11px;font-size:12.5px"
                   href="replay-view.php?id=<?= (int) $r['id'] ?>">&#9654; Oynat</a>
              </td>
            </tr>
          <?php endforeach; ?>
        </table>
        </div>
      <?php endif; ?>
    </div>

    <div class="card" style="margin-top:13px">
      <h2>Donusum hunisi &mdash; araclar</h2>
      <p class="note" style="margin-bottom:12px">
        Sayfayi acan kisi araci gercekten calistirdi mi, sonuc alabildi mi?
        Dusuk oranli satirlar ya arayuzun anlasilmadigini ya da aracin ise yaramadigini gosterir.
      </p>
      <?php if ($funnel === []): ?>
        <p class="empty">Bu aralikta arac verisi yok.</p>
      <?php else: ?>
        <div style="overflow-x:auto">
        <table>
          <tr><th>Arac</th><th class="n">Goruntuleme</th><th class="n">Calistirma</th>
              <th class="n">Sonuc</th><th class="n">Hata</th><th class="n">Donusum</th></tr>
          <?php foreach ($funnel as $f):
              $g = (int) $f['goruntuleme'];
              $c = (int) $f['calistirma'];
              $oran = $g > 0 ? round(($c / $g) * 100) : 0;
              $renk = $oran >= 40 ? '#34d399' : ($oran >= 15 ? '#fbbf24' : '#f87171'); ?>
            <tr>
              <td><?= h((string) $f['arac']) ?></td>
              <td class="n"><?= $g ?></td>
              <td class="n"><?= $c ?></td>
              <td class="n"><?= (int) $f['sonuc'] ?></td>
              <td class="n"><?= (int) $f['hata'] > 0
                    ? '<span style="color:#f87171">' . (int) $f['hata'] . '</span>' : '0' ?></td>
              <td class="n"><span style="color:<?= $renk ?>"><?= $g > 0 ? '%' . $oran : '-' ?></span></td>
            </tr>
          <?php endforeach; ?>
        </table>
        </div>
      <?php endif; ?>
    </div>

    <div class="card" style="margin-top:13px">
      <h2>Sayfa etkilesimi</h2>
      <p class="note" style="margin-bottom:12px">
        Ortalama kalma suresi ve icerigin ne kadarinin goruldugu.
        Kisa sure + dusuk kaydirma, sayfanin beklentiyi karsilamadigini gosterir.
      </p>
      <?php if ($engagement === []): ?>
        <p class="empty">Henuz olcum yok. Bu veri ziyaretci sayfadan ayrilirken toplanir.</p>
      <?php else: ?>
        <table>
          <tr><th>Yol</th><th class="n">Olcum</th><th class="n">Ort. sure</th><th class="n">Ort. kaydirma</th></tr>
          <?php foreach ($engagement as $e): ?>
            <tr>
              <td><?= h((string) $e['path']) ?></td>
              <td class="n"><?= (int) $e['olcum'] ?></td>
              <td class="n"><?= h(mt_sure((float) $e['ort_saniye'])) ?></td>
              <td class="n">%<?= (int) $e['ort_kaydirma'] ?></td>
            </tr>
          <?php endforeach; ?>
        </table>
      <?php endif; ?>
    </div>

    <div class="card" style="margin-top:13px">
      <h2>Ziyaretci yolculuklari (son <?= count($journeys) ?> oturum)</h2>
      <p class="note" style="margin-bottom:14px">
        Her oturum tek bir ziyaretcinin site icindeki adimlarini sirasiyla gosterir.
        Kimlik bilgisi yoktur: ziyaretci gunluk degisen bir hash ile gruplanir,
        30 dakikadan uzun sessizlik yeni oturum sayilir.
      </p>

      <?php if ($journeys === []): ?>
        <p class="empty">Bu aralikta ziyaret yok.</p>
      <?php else: ?>
        <?php foreach ($journeys as $i => $s): ?>
          <div style="border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px">
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:13px;color:var(--muted)">
              <strong style="color:var(--fg)">Oturum <?= $i + 1 ?></strong>
              <span><?= h(date('d.m H:i', strtotime($s['basladi']))) ?></span>
              <span>&middot; <?= h(mt_sure((float) $s['sure'])) ?></span>
              <span>&middot; <?= (int) $s['adim'] ?> adim</span>
              <span>&middot; <?= h($s['cihaz']) ?></span>
              <span>&middot; <?= h($s['tarayici']) ?> / <?= h($s['os']) ?></span>
              <span>&middot; kaynak: <?= h($s['kaynak']) ?></span>
            </div>
            <ol style="margin:10px 0 0;padding-left:18px;font-size:13.5px">
              <?php foreach ($s['olaylar'] as $e):
                  $tur = (string) $e['event_type'];
                  $vurgu = in_array($tur, ['tool_run', 'affiliate_click'], true);
                  $hata  = $tur === 'tool_error'; ?>
                <li style="margin:4px 0;<?= $vurgu ? 'color:#8fd3ff;font-weight:600' : ($hata ? 'color:#f87171' : 'color:#c8d0e4') ?>">
                  <span style="color:var(--muted);font-variant-numeric:tabular-nums">
                    <?= h(date('H:i:s', strtotime((string) $e['created_at']))) ?>
                  </span>
                  &nbsp;<?= h(mt_event_label($e)) ?>
                </li>
              <?php endforeach; ?>
            </ol>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>

      <p class="note" style="margin-top:6px">
        <strong>Ekran kaydi bilincli olarak yok.</strong> Araclara girilen metin, dosya icerigi
        ve tus vuruslari hicbir zaman gonderilmez &mdash; aksi halde JSON aracina yapistirilan
        API anahtarlari veya AI ozgecmis aracina girilen kisisel bilgiler kayda gecerdi ve
        sitede verdigimiz &ldquo;verileriniz saklanmaz&rdquo; sozu gecersiz olurdu.
      </p>
    </div>
    <?php
}
