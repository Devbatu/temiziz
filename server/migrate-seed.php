<?php
/**
 * Sitenin ilk blog yazilarini veritabanina tasir. Bir kez calistirilir.
 *
 * Neden: blog liste sayfasi artik veritabanindan uretiliyor. Next tarafinda
 * derlenmis yazilar veritabaninda olmadigi icin listeden dusuyor ve hicbir
 * yerden baglanti almiyordu. Hepsini tek kaynakta toplayinca hem listede
 * gorunuyorlar hem de panelden duzenlenebiliyorlar.
 *
 * Kullanim (sunucuda, domain kokunde):
 *   php migrate-seed.php
 */
declare(strict_types=1);

define('MT_APP', true);
require __DIR__ . '/mt-lib/lib.php';
require __DIR__ . '/mt-lib/blog.php';

$jsonPath = __DIR__ . '/seed-posts.json';
if (!is_file($jsonPath)) {
    exit("HATA: seed-posts.json bulunamadi.\n");
}

$posts = json_decode((string) file_get_contents($jsonPath), true, 512, JSON_THROW_ON_ERROR);
$db = mt_db();

$eklenen = 0;
$atlanan = 0;

foreach ($posts as $p) {
    // Zaten varsa dokunma - kullanicinin panelden yaptigi duzenlemeleri ezmeyelim.
    $st = $db->prepare('SELECT COUNT(*) FROM mt_posts WHERE slug = ?');
    $st->execute([$p['slug']]);
    if ((int) $st->fetchColumn() > 0) {
        $atlanan++;
        continue;
    }

    $db->prepare(
        'INSERT INTO mt_posts
            (slug, title, category, excerpt, body, related_tools, reading_time,
             status, published_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, "published", ?, UTC_TIMESTAMP())'
    )->execute([
        $p['slug'],
        $p['title'],
        $p['category'],
        $p['excerpt'],
        $p['body'],
        $p['tools'],
        (int) $p['reading_time'],
        $p['date'] . ' 09:00:00',
    ]);
    $eklenen++;
    echo "  + {$p['slug']}\n";
}

echo "\n{$eklenen} yazi eklendi, {$atlanan} tanesi zaten vardi.\n";

$sonuc = mt_rebuild_all();
echo "Statik sayfalar uretildi: {$sonuc['ok']} basarili, {$sonuc['fail']} basarisiz.\n";
