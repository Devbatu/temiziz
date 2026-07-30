<?php
/**
 * "Kayitlar" sekmesi: yonetim islem gecmisi + ziyaretci konum/operator bilgisi.
 *
 * Sitede uyelik olmadigi icin ziyaretciler anonimdir; kimlik gosterilemez.
 * Gosterilebilecek en yakin bilgi konum, operator ve tam referans adresidir.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

function mt_audit_render(int $days): void
{
    $db = mt_db();
    $q = static function (string $sql, array $args = []) use ($db): array {
        $s = $db->prepare($sql);
        $s->execute($args);
        return $s->fetchAll();
    };

    $kayitlar = $q(
        'SELECT action, detail, ip_hash, browser, os, created_at
         FROM mt_audit ORDER BY id DESC LIMIT 80'
    );

    $ulkeler = $q(
        'SELECT g.country AS etiket, g.country_code AS kod, COUNT(DISTINCT e.visitor_hash) AS deger
         FROM mt_events e JOIN mt_geo g ON g.visitor_hash = e.visitor_hash
         WHERE e.device <> "bot" AND e.created_at > (UTC_TIMESTAMP() - INTERVAL ? DAY)
           AND g.country IS NOT NULL
         GROUP BY g.country, g.country_code ORDER BY deger DESC LIMIT 12',
        [$days]
    );

    $sehirler = $q(
        'SELECT CONCAT(COALESCE(g.city, "?"), ", ", COALESCE(g.country, "?")) AS etiket,
                COUNT(DISTINCT e.visitor_hash) AS deger
         FROM mt_events e JOIN mt_geo g ON g.visitor_hash = e.visitor_hash
         WHERE e.device <> "bot" AND e.created_at > (UTC_TIMESTAMP() - INTERVAL ? DAY)
           AND g.city IS NOT NULL
         GROUP BY etiket ORDER BY deger DESC LIMIT 12',
        [$days]
    );

    $operatorler = $q(
        'SELECT g.isp AS etiket, COUNT(DISTINCT e.visitor_hash) AS deger,
                MAX(g.is_hosting) AS sunucu, MAX(g.is_proxy) AS vekil
         FROM mt_events e JOIN mt_geo g ON g.visitor_hash = e.visitor_hash
         WHERE e.device <> "bot" AND e.created_at > (UTC_TIMESTAMP() - INTERVAL ? DAY)
           AND g.isp IS NOT NULL
         GROUP BY g.isp ORDER BY deger DESC LIMIT 12',
        [$days]
    );

    $referanslar = $q(
        'SELECT referrer_url AS etiket, COUNT(*) AS deger,
                COUNT(DISTINCT visitor_hash) AS kisi
         FROM mt_events
         WHERE device <> "bot" AND referrer_url IS NOT NULL
           AND created_at > (UTC_TIMESTAMP() - INTERVAL ? DAY)
         GROUP BY referrer_url ORDER BY deger DESC LIMIT 15',
        [$days]
    );
    ?>

    <div class="card">
      <h2>Yonetim islem gecmisi</h2>
      <p class="note" style="margin-bottom:12px">
        Panelde yapilan her islem burada iz birakir. IP ham olarak saklanmaz;
        gunluk degisen tuzla hashlenir &mdash; ayni oturumun islemlerini
        gruplamaya yeter, kisiyi kalici olarak isaretlemez.
      </p>
      <?php if ($kayitlar === []): ?>
        <p class="empty">Henuz kayit yok.</p>
      <?php else: ?>
        <div style="overflow-x:auto">
        <table>
          <tr><th>Zaman (UTC)</th><th>Islem</th><th>Ayrinti</th><th>Oturum</th><th>Tarayici</th></tr>
          <?php foreach ($kayitlar as $k):
              $risk = mt_audit_risk((string) $k['action']);
              $renk = match ($risk) {
                  'yuksek' => '#f87171',
                  'orta'   => '#fbbf24',
                  default  => '#c8d0e4',
              }; ?>
            <tr>
              <td style="white-space:nowrap"><?= h((string) $k['created_at']) ?></td>
              <td style="color:<?= $renk ?>;font-weight:<?= $risk === 'yuksek' ? '700' : '400' ?>">
                <?= h(mt_audit_label((string) $k['action'])) ?>
              </td>
              <td><?= h((string) $k['detail']) ?: '<span style="color:var(--muted)">&ndash;</span>' ?></td>
              <td><code><?= h(substr((string) $k['ip_hash'], 0, 8)) ?></code></td>
              <td><?= h((string) ($k['browser'] ?? '-')) ?> / <?= h((string) ($k['os'] ?? '-')) ?></td>
            </tr>
          <?php endforeach; ?>
        </table>
        </div>
      <?php endif; ?>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Ziyaretciler nereden geliyor</h2>
      <p class="note" style="margin-bottom:14px">
        Sitede uyelik olmadigi icin ziyaretcilerin kimligi yoktur ve gosterilemez.
        Asagidaki bilgiler IP adresinden cozulur; <strong>ham IP hicbir zaman
        saklanmaz</strong>, yalnizca cozulmus konum tutulur. Konum yaklasiktir:
        operatorun kayitli oldugu bolgeyi gosterir, kisinin adresini degil.
      </p>

      <div class="grid g2">
        <div>
          <h2 style="font-size:12px">Ulke</h2>
          <?= mt_chart_bars(array_map(static fn (array $r): array => [
              'etiket' => (string) $r['etiket'],
              'deger'  => (int) $r['deger'],
          ], $ulkeler), '#5b8cff') ?>
        </div>
        <div>
          <h2 style="font-size:12px">Sehir</h2>
          <?= mt_chart_bars(array_map(static fn (array $r): array => [
              'etiket' => (string) $r['etiket'],
              'deger'  => (int) $r['deger'],
          ], $sehirler), '#8b5cf6') ?>
        </div>
      </div>

      <h2 style="font-size:12px;margin-top:18px">Internet servis saglayici</h2>
      <?= mt_chart_bars(array_map(static fn (array $r): array => [
          'etiket' => (string) $r['etiket'],
          'deger'  => (int) $r['deger'],
          'ek'     => ((int) $r['sunucu'] ? 'veri merkezi' : ((int) $r['vekil'] ? 'vekil/VPN' : '')),
      ], $operatorler), '#34d399') ?>
      <p class="note" style="margin-top:10px">
        &ldquo;Veri merkezi&rdquo; isaretli satirlar genellikle bot veya tarama
        araclarindan gelir; gercek kullanici trafigi degildir.
      </p>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>Tam referans adresleri</h2>
      <p class="note" style="margin-bottom:12px">
        Ziyaretcinin hangi <strong>sayfadan</strong> geldigi. Ozet sekmesindeki
        &ldquo;com.linkedin.android&rdquo; gibi kayitlar yalnizca alan adini gosterir;
        burada tam adres var, yani hangi paylasimdan geldigi gorunur.
      </p>
      <?php if ($referanslar === []): ?>
        <p class="empty">
          Henuz tam referans kaydi yok. Bu veri bu guncellemeden sonraki
          ziyaretlerde toplanmaya baslar.
        </p>
      <?php else: ?>
        <div style="overflow-x:auto">
        <table>
          <tr><th>Kaynak adres</th><th class="n">Ziyaret</th><th class="n">Kisi</th></tr>
          <?php foreach ($referanslar as $r): ?>
            <tr>
              <td style="max-width:520px;overflow-wrap:anywhere">
                <a href="<?= h((string) $r['etiket']) ?>" target="_blank" rel="noopener noreferrer">
                  <?= h((string) $r['etiket']) ?>
                </a>
              </td>
              <td class="n"><?= (int) $r['deger'] ?></td>
              <td class="n"><?= (int) $r['kisi'] ?></td>
            </tr>
          <?php endforeach; ?>
        </table>
        </div>
      <?php endif; ?>
    </div>

    <p class="note" style="margin-top:16px">
      <strong>Neden daha fazlasi yok:</strong> sitede hesap sistemi olmadigi icin
      ziyaretcilerin adi, e-postasi veya kalici kimligi yoktur. Bunu eklemek
      kalici cerez ve acik riza gerektirir, ayrica araclara girilen verilerin
      kisiyle eslesmesi anlamina gelir &mdash; sitede verdigimiz gizlilik sozuyle
      celisir. Davranis ayrintisi icin <a href="?s=davranis">Davranis</a>
      sekmesindeki oturum yolculuklarina bakabilirsiniz.
    </p>
    <?php
}
