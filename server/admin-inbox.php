<?php
/**
 * Yonetim paneli: iletisim mesajlari ve blog yorumlari.
 *
 * Ziyaretciden gelen her sey buradan yonetilir. Yorumlar 'bekliyor'
 * durumunda gelir; onaylandiginda ilgili yazinin statik HTML'i yeniden
 * uretilir, boylece yorum sitede gorunur hale gelir.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

/** Formdan gelen islemleri yurutur. Panelin POST akisindan cagrilir. */
function mt_inbox_post(string $eylem, array $post): ?array
{
    $db = mt_db();

    /* ─────────────────────────── mesajlar ─────────────────────────── */

    if ($eylem === 'mesaj_durum') {
        $id    = (int) ($post['id'] ?? 0);
        $durum = (string) ($post['durum'] ?? '');
        if (!in_array($durum, ['yeni', 'okundu', 'arsiv'], true)) {
            return ['Gecersiz durum.', 'hata'];
        }
        $db->prepare('UPDATE mt_messages SET durum = ? WHERE id = ?')->execute([$durum, $id]);
        mt_audit('mesaj_durum', "#{$id} -> {$durum}");
        return ['Mesaj durumu guncellendi.', 'ok'];
    }

    if ($eylem === 'mesaj_sil') {
        $id = (int) ($post['id'] ?? 0);
        $db->prepare('DELETE FROM mt_messages WHERE id = ?')->execute([$id]);
        mt_audit('mesaj_sil', "#{$id}");
        return ['Mesaj silindi.', 'ok'];
    }

    /* ─────────────────────────── yorumlar ─────────────────────────── */

    if ($eylem === 'yorum_durum') {
        $id    = (int) ($post['id'] ?? 0);
        $durum = (string) ($post['durum'] ?? '');
        if (!in_array($durum, ['bekliyor', 'onayli', 'spam'], true)) {
            return ['Gecersiz durum.', 'hata'];
        }
        $db->prepare('UPDATE mt_comments SET durum = ? WHERE id = ?')->execute([$durum, $id]);
        mt_audit('yorum_durum', "#{$id} -> {$durum}");
        // Durum degisimi yayinlanmis sayfayi etkiler; o yaziyi yeniden uret.
        $mesaj = 'Yorum durumu guncellendi.';
        if (mt_yorum_yaziyi_yenile($id)) {
            $mesaj .= ' Yazi sayfasi yenilendi.';
        }
        return [$mesaj, 'ok'];
    }

    if ($eylem === 'yorum_sil') {
        $id = (int) ($post['id'] ?? 0);
        // Silmeden once hangi yaziya ait oldugunu ogren; sonra yeniden uret.
        $st = $db->prepare('SELECT post_id FROM mt_comments WHERE id = ?');
        $st->execute([$id]);
        $postId = (int) $st->fetchColumn();
        $db->prepare('DELETE FROM mt_comments WHERE id = ?')->execute([$id]);
        mt_audit('yorum_sil', "#{$id}");
        if ($postId > 0) {
            mt_yaziyi_yeniden_uret($postId);
        }
        return ['Yorum silindi ve yazi sayfasi yenilendi.', 'ok'];
    }

    return null;
}

/** Yorum kimliginden yola cikarak ilgili yaziyi yeniden uretir. */
function mt_yorum_yaziyi_yenile(int $yorumId): bool
{
    $st = mt_db()->prepare('SELECT post_id FROM mt_comments WHERE id = ?');
    $st->execute([$yorumId]);
    $postId = (int) $st->fetchColumn();
    return $postId > 0 && mt_yaziyi_yeniden_uret($postId);
}

function mt_yaziyi_yeniden_uret(int $postId): bool
{
    $st = mt_db()->prepare('SELECT * FROM mt_posts WHERE id = ? AND status = "published"');
    $st->execute([$postId]);
    $yazi = $st->fetch();
    return $yazi ? mt_write_post($yazi) : false;
}

/** Kisa tarih gosterimi. */
function mt_kisa_tarih(?string $t): string
{
    return $t ? date('d.m.Y H:i', strtotime($t)) : '-';
}

/* ───────────────────────────── mesajlar ekrani ───────────────────────── */

function mt_mesajlar_render(string $csrf): void
{
    $db = mt_db();

    $filtre = (string) ($_GET['durum'] ?? 'hepsi');
    $kosul  = in_array($filtre, ['yeni', 'okundu', 'arsiv'], true) ? 'WHERE durum = :d' : '';
    $st = $db->prepare(
        "SELECT * FROM mt_messages {$kosul} ORDER BY created_at DESC LIMIT 200"
    );
    $st->execute($kosul !== '' ? [':d' => $filtre] : []);
    $mesajlar = $st->fetchAll();

    $sayim = [];
    foreach ($db->query('SELECT durum, COUNT(*) n FROM mt_messages GROUP BY durum') as $r) {
        $sayim[$r['durum']] = (int) $r['n'];
    }
    $toplam = array_sum($sayim);
    ?>
    <div class="card">
      <h2>Gelen mesajlar</h2>
      <p class="note">
        İletişim formundan gelen mesajlar. Toplam <?= (int) $toplam ?> mesaj —
        <?= (int) ($sayim['yeni'] ?? 0) ?> yeni,
        <?= (int) ($sayim['okundu'] ?? 0) ?> okundu,
        <?= (int) ($sayim['arsiv'] ?? 0) ?> arşivde.
      </p>

      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <?php foreach ([
            'hepsi'  => 'Hepsi',
            'yeni'   => 'Yeni',
            'okundu' => 'Okundu',
            'arsiv'  => 'Arşiv',
        ] as $k => $ad): ?>
          <a class="btn<?= $filtre === $k ? ' pri' : '' ?>" href="?s=mesajlar&durum=<?= h($k) ?>">
            <?= h($ad) ?><?= $k !== 'hepsi' ? ' (' . (int) ($sayim[$k] ?? 0) . ')' : '' ?>
          </a>
        <?php endforeach; ?>
      </div>
    </div>

    <?php if ($mesajlar === []): ?>
      <div class="card"><p class="note">Bu filtrede mesaj yok.</p></div>
    <?php endif; ?>

    <?php foreach ($mesajlar as $m): ?>
      <div class="card">
        <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:flex-start">
          <div style="min-width:0">
            <strong><?= h($m['ad']) ?></strong>
            <span class="note">&lt;<?= h($m['eposta']) ?>&gt;</span>
            <div class="note" style="margin-top:3px">
              <?= h(mt_kisa_tarih($m['created_at'])) ?> · durum: <?= h($m['durum']) ?>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <a class="btn" href="mailto:<?= h($m['eposta']) ?>?subject=<?= rawurlencode('Re: ' . ($m['konu'] !== '' ? $m['konu'] : 'İletişim')) ?>">Yanıtla</a>
            <?php foreach (['okundu' => 'Okundu', 'arsiv' => 'Arşivle'] as $d => $etiket): ?>
              <?php if ($m['durum'] !== $d): ?>
                <form method="post" style="display:inline">
                  <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
                  <input type="hidden" name="eylem" value="mesaj_durum">
                  <input type="hidden" name="id" value="<?= (int) $m['id'] ?>">
                  <input type="hidden" name="durum" value="<?= h($d) ?>">
                  <button class="btn" type="submit"><?= h($etiket) ?></button>
                </form>
              <?php endif; ?>
            <?php endforeach; ?>
            <form method="post" style="display:inline" data-onay="Bu mesaj kalıcı olarak silinsin mi?">
              <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
              <input type="hidden" name="eylem" value="mesaj_sil">
              <input type="hidden" name="id" value="<?= (int) $m['id'] ?>">
              <button class="btn r" type="submit">Sil</button>
            </form>
          </div>
        </div>
        <?php if ($m['konu'] !== ''): ?>
          <p style="margin-top:12px"><strong>Konu:</strong> <?= h($m['konu']) ?></p>
        <?php endif; ?>
        <p style="margin-top:8px;white-space:pre-wrap;line-height:1.65"><?= h($m['mesaj']) ?></p>
      </div>
    <?php endforeach;
}

/* ───────────────────────────── yorumlar ekrani ───────────────────────── */

function mt_yorumlar_render(string $csrf): void
{
    $db = mt_db();

    $filtre = (string) ($_GET['durum'] ?? 'bekliyor');
    $kosul  = in_array($filtre, ['bekliyor', 'onayli', 'spam'], true) ? 'WHERE y.durum = :d' : '';
    $st = $db->prepare(
        "SELECT y.*, p.title, p.slug FROM mt_comments y
         LEFT JOIN mt_posts p ON p.id = y.post_id
         {$kosul} ORDER BY y.created_at DESC LIMIT 200"
    );
    $st->execute($kosul !== '' ? [':d' => $filtre] : []);
    $yorumlar = $st->fetchAll();

    $sayim = [];
    foreach ($db->query('SELECT durum, COUNT(*) n FROM mt_comments GROUP BY durum') as $r) {
        $sayim[$r['durum']] = (int) $r['n'];
    }
    ?>
    <div class="card">
      <h2>Blog yorumları</h2>
      <p class="note">
        Yorumlar önce <strong>bekliyor</strong> durumunda kaydedilir ve sitede görünmez.
        Onayladığınızda ilgili yazının sayfası otomatik olarak yeniden üretilir.
        Bu, spam bağlantılarının sitenize SEO zararı vermesini engeller.
      </p>

      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <?php foreach ([
            'bekliyor' => 'Bekleyen',
            'onayli'   => 'Onaylı',
            'spam'     => 'Spam',
            'hepsi'    => 'Hepsi',
        ] as $k => $ad): ?>
          <a class="btn<?= $filtre === $k ? ' pri' : '' ?>" href="?s=yorumlar&durum=<?= h($k) ?>">
            <?= h($ad) ?><?= $k !== 'hepsi' ? ' (' . (int) ($sayim[$k] ?? 0) . ')' : '' ?>
          </a>
        <?php endforeach; ?>
      </div>
    </div>

    <?php if ($yorumlar === []): ?>
      <div class="card"><p class="note">Bu filtrede yorum yok.</p></div>
    <?php endif; ?>

    <?php foreach ($yorumlar as $y): ?>
      <div class="card">
        <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:flex-start">
          <div style="min-width:0">
            <strong><?= h($y['ad']) ?></strong>
            <?php if ($y['eposta'] !== ''): ?>
              <span class="note">&lt;<?= h($y['eposta']) ?>&gt;</span>
            <?php endif; ?>
            <div class="note" style="margin-top:3px">
              <?= h(mt_kisa_tarih($y['created_at'])) ?> · durum: <?= h($y['durum']) ?>
              <?php if ($y['slug'] !== null): ?>
                · <a href="/blog/<?= h($y['slug']) ?>/" target="_blank" rel="noopener">
                    <?= h(mb_substr((string) $y['title'], 0, 50)) ?>
                  </a>
              <?php else: ?>
                · <em>yazı silinmiş</em>
              <?php endif; ?>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <?php foreach (['onayli' => 'Onayla', 'spam' => 'Spam', 'bekliyor' => 'Beklemeye al'] as $d => $etiket): ?>
              <?php if ($y['durum'] !== $d): ?>
                <form method="post" style="display:inline">
                  <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
                  <input type="hidden" name="eylem" value="yorum_durum">
                  <input type="hidden" name="id" value="<?= (int) $y['id'] ?>">
                  <input type="hidden" name="durum" value="<?= h($d) ?>">
                  <button class="btn<?= $d === 'onayli' ? ' g' : '' ?>" type="submit"><?= h($etiket) ?></button>
                </form>
              <?php endif; ?>
            <?php endforeach; ?>
            <form method="post" style="display:inline" data-onay="Bu yorum kalıcı olarak silinsin mi?">
              <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
              <input type="hidden" name="eylem" value="yorum_sil">
              <input type="hidden" name="id" value="<?= (int) $y['id'] ?>">
              <button class="btn r" type="submit">Sil</button>
            </form>
          </div>
        </div>
        <p style="margin-top:10px;white-space:pre-wrap;line-height:1.65"><?= h($y['govde']) ?></p>
      </div>
    <?php endforeach;
}
