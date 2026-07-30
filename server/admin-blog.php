<?php
/**
 * Yonetim panelinin blog bolumu: yazi listesi, olusturma, duzenleme, silme.
 *
 * Yayinlanan her yazi ayni anda statik HTML olarak diske yazilir; boylece
 * ziyaretciye PHP degil hazir sayfa servis edilir.
 */
declare(strict_types=1);

if (!defined('MT_APP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * Blog ile ilgili POST eylemlerini isler.
 * Isledi ise ['mesaj', 'tur'] doner, yoksa null.
 */
function mt_blog_post(string $eylem): ?array
{
    $db = mt_db();

    if ($eylem === 'yazi_kaydet') {
        $id      = (int) ($_POST['id'] ?? 0);
        $baslik  = trim((string) ($_POST['baslik'] ?? ''));
        $govde   = (string) ($_POST['govde'] ?? '');
        $kategori = trim((string) ($_POST['kategori'] ?? 'Genel')) ?: 'Genel';
        $ozet    = trim((string) ($_POST['ozet'] ?? ''));
        $durum   = ($_POST['durum'] ?? 'draft') === 'published' ? 'published' : 'draft';
        $slugIn  = trim((string) ($_POST['slug'] ?? ''));

        if ($baslik === '' || mb_strlen($baslik) > 200) {
            return ['Baslik zorunlu ve en fazla 200 karakter olmali.', 'hata'];
        }
        if (trim($govde) === '') {
            return ['Yazi icerigi bos olamaz.', 'hata'];
        }

        // Ozet verilmediyse ilk cumlelerden uret.
        if ($ozet === '') {
            $duz  = trim(preg_replace('/\s+/', ' ', strip_tags(mt_markdown($govde))) ?? '');
            $ozet = mb_substr($duz, 0, 180);
        }
        $ozet = mb_substr($ozet, 0, 300);

        // Okuma suresi: dakikada ~200 kelime.
        $kelime  = max(1, str_word_count(strip_tags(mt_markdown($govde)), 0, 'çğıöşüÇĞİÖŞÜ'));
        $sure    = max(1, min(60, (int) ceil($kelime / 200)));

        // Yalnizca gecerli slug bicimindeki araclari kabul et.
        $araclar = implode(',', array_filter(
            array_map('trim', explode(',', (string) ($_POST['araclar'] ?? ''))),
            static fn (string $a): bool => $a !== '' && preg_match('/^[a-z0-9-]+$/', $a) === 1
        ));

        $slug = mt_unique_slug(mt_slugify($slugIn !== '' ? $slugIn : $baslik), $id ?: null);

        if ($id > 0) {
            $eski = $db->prepare('SELECT slug, status FROM mt_posts WHERE id = ?');
            $eski->execute([$id]);
            $onceki = $eski->fetch();
            if (!$onceki) {
                return ['Yazi bulunamadi.', 'hata'];
            }
            $db->prepare(
                'UPDATE mt_posts SET slug = ?, title = ?, category = ?, excerpt = ?, body = ?,
                        related_tools = ?, reading_time = ?, status = ?, updated_at = UTC_TIMESTAMP()
                 WHERE id = ?'
            )->execute([$slug, $baslik, $kategori, $ozet, $govde, $araclar, $sure, $durum, $id]);

            // Slug degistiyse veya taslaga alindiysa eski dosyayi temizle.
            if ($onceki['slug'] !== $slug || $durum !== 'published') {
                mt_remove_post_files((string) $onceki['slug']);
            }
        } else {
            $db->prepare(
                'INSERT INTO mt_posts (slug, title, category, excerpt, body, related_tools,
                        reading_time, status, published_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())'
            )->execute([$slug, $baslik, $kategori, $ozet, $govde, $araclar, $sure, $durum]);
            $id = (int) $db->lastInsertId();
        }

        $st = $db->prepare('SELECT * FROM mt_posts WHERE id = ?');
        $st->execute([$id]);
        $yazi = $st->fetch();

        if ($durum === 'published') {
            if (!mt_write_post($yazi)) {
                return ['Yazi kaydedildi ama statik sayfa yazilamadi. Dosya izinlerini kontrol edin.', 'hata'];
            }
        }
        mt_write_index();
        mt_write_sitemap();

        mt_audit($id > 0 ? 'yazi_guncelle' : 'yazi_olustur', $slug);

        return [
            $durum === 'published'
                ? 'Yazi yayinlandi: /blog/' . $slug . '/'
                : 'Taslak kaydedildi.',
            'ok',
        ];
    }

    if ($eylem === 'yazi_sil') {
        $id = (int) ($_POST['id'] ?? 0);
        $st = $db->prepare('SELECT slug FROM mt_posts WHERE id = ?');
        $st->execute([$id]);
        $slug = $st->fetchColumn();
        if ($slug === false) {
            return ['Yazi bulunamadi.', 'hata'];
        }
        $db->prepare('DELETE FROM mt_posts WHERE id = ?')->execute([$id]);
        mt_remove_post_files((string) $slug);
        mt_write_index();
        mt_write_sitemap();
        mt_audit('yazi_sil', (string) $slug);
        return ['Yazi silindi.', 'ok'];
    }

    if ($eylem === 'yazi_yenile') {
        $sonuc = mt_rebuild_all();
        mt_audit('yazi_yenile', $sonuc['ok'] . ' yazi');
        return [
            "{$sonuc['ok']} yazi yeniden olusturuldu"
            . ($sonuc['fail'] > 0 ? ", {$sonuc['fail']} tanesi basarisiz." : '.'),
            $sonuc['fail'] > 0 ? 'hata' : 'ok',
        ];
    }

    return null;
}

/** Blog sekmesini cizer. */
function mt_blog_render(string $csrf): void
{
    $db  = mt_db();
    $id  = (int) ($_GET['duzenle'] ?? 0);
    $yeni = ($_GET['yeni'] ?? '') === '1';

    $yazi = ['id' => 0, 'slug' => '', 'title' => '', 'category' => 'Genel',
             'excerpt' => '', 'body' => '', 'status' => 'draft', 'related_tools' => ''];
    if ($id > 0) {
        $st = $db->prepare('SELECT * FROM mt_posts WHERE id = ?');
        $st->execute([$id]);
        $bulunan = $st->fetch();
        if ($bulunan) {
            $yazi = $bulunan;
        }
    }

    if ($yeni || $id > 0): ?>
      <div class="card">
        <h2><?= $id > 0 ? 'Yaziyi duzenle' : 'Yeni yazi' ?></h2>
        <form method="post">
          <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
          <input type="hidden" name="eylem" value="yazi_kaydet">
          <input type="hidden" name="id" value="<?= (int) $yazi['id'] ?>">

          <label>Baslik</label>
          <input type="text" name="baslik" required maxlength="200"
                 value="<?= h((string) $yazi['title']) ?>" placeholder="PDF Dosya Boyutu Nasil Kucultulur?">

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label>Kategori</label>
              <input type="text" name="kategori" maxlength="60"
                     value="<?= h((string) $yazi['category']) ?>" placeholder="PDF">
            </div>
            <div>
              <label>URL (bos birakilirsa baslikan uretilir)</label>
              <input type="text" name="slug" maxlength="90"
                     value="<?= h((string) $yazi['slug']) ?>" placeholder="pdf-boyutu-kucultme">
            </div>
          </div>

          <label>Ozet (bos birakilirsa metinden uretilir) &mdash; arama sonuclarinda gorunur</label>
          <input type="text" name="ozet" maxlength="300" value="<?= h((string) $yazi['excerpt']) ?>">

          <label>Ilgili araclar (virgulle ayirin) &mdash; yazi sonunda kart olarak gosterilir</label>
          <input type="text" name="araclar" maxlength="400"
                 value="<?= h((string) ($yazi['related_tools'] ?? '')) ?>"
                 placeholder="merge-pdf, compress-pdf, image-compressor">

          <label>Icerik &mdash; Markdown: <code>## Baslik</code>, <code>**kalin**</code>,
                 <code>- madde</code>, <code>[metin](adres)</code></label>
          <textarea name="govde" required rows="18"><?= h((string) $yazi['body']) ?></textarea>

          <label>Durum</label>
          <select name="durum">
            <option value="draft" <?= $yazi['status'] === 'draft' ? 'selected' : '' ?>>Taslak (yayinlanmaz)</option>
            <option value="published" <?= $yazi['status'] === 'published' ? 'selected' : '' ?>>Yayinla</option>
          </select>

          <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" type="submit">Kaydet</button>
            <a class="btn g" href="?s=blog">Vazgec</a>
          </div>
        </form>
      </div>
    <?php else:
      $yazilar = $db->query('SELECT * FROM mt_posts ORDER BY published_at DESC')->fetchAll(); ?>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px">
          <h2 style="margin:0">Yazilar (<?= count($yazilar) ?>)</h2>
          <div style="display:flex;gap:8px">
            <a class="btn" href="?s=blog&yeni=1">+ Yeni yazi</a>
            <form method="post" style="display:inline">
              <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
              <input type="hidden" name="eylem" value="yazi_yenile">
              <button class="btn g" type="submit" title="Site yeniden yuklendiyse yazilari geri getirir">
                Tumunu yeniden olustur
              </button>
            </form>
          </div>
        </div>

        <?php if ($yazilar === []): ?>
          <p class="empty">Henuz yazi yok. &ldquo;Yeni yazi&rdquo; ile baslayin.</p>
        <?php else: ?>
          <div style="overflow-x:auto">
          <table>
            <tr><th>Baslik</th><th>Kategori</th><th>Durum</th><th>Tarih</th><th></th></tr>
            <?php foreach ($yazilar as $y): ?>
              <tr>
                <td>
                  <?php if ($y['status'] === 'published'): ?>
                    <a href="/blog/<?= h((string) $y['slug']) ?>/" target="_blank"><?= h((string) $y['title']) ?></a>
                  <?php else: ?>
                    <?= h((string) $y['title']) ?>
                  <?php endif; ?>
                </td>
                <td><?= h((string) $y['category']) ?></td>
                <td><?= $y['status'] === 'published'
                      ? '<span style="color:#34d399">Yayinda</span>'
                      : '<span style="color:#8d97b4">Taslak</span>' ?></td>
                <td><?= h(date('d.m.Y', strtotime((string) $y['published_at']))) ?></td>
                <td class="n" style="white-space:nowrap">
                  <a href="?s=blog&duzenle=<?= (int) $y['id'] ?>">Duzenle</a>
                  <form method="post" style="display:inline;margin-left:8px"
                        data-onay="Bu yazi kalici olarak silinsin mi?">
                    <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
                    <input type="hidden" name="eylem" value="yazi_sil">
                    <input type="hidden" name="id" value="<?= (int) $y['id'] ?>">
                    <button type="submit"
                            style="background:none;border:0;color:#f87171;cursor:pointer;font-size:13.5px;padding:0">
                      Sil
                    </button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </table>
          </div>
        <?php endif; ?>

        <p class="note" style="margin-top:16px">
          Yayinlanan yazi aninda <code>/blog/&lt;url&gt;/</code> adresinde statik HTML olarak olusturulur;
          blog listesi ve <code>sitemap-blog.xml</code> otomatik guncellenir.
          Siteyi bastan yuklerseniz &ldquo;Tumunu yeniden olustur&rdquo; ile yazilar geri gelir.
        </p>
      </div>
    <?php endif;
}
