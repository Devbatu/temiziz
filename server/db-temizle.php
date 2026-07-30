<?php
/**
 * Eski projenin (Ephesus) tablolarini temizler.
 *
 * Yalnizca "mt_" onekiyle BASLAMAYAN tablolari siler; MultiTools tablolari
 * korunur. Silmeden once ~/backups/ altinda mysqldump yedegi alinmis olmalidir.
 *
 * Kullanim (domain kokunde):  php db-temizle.php
 */
declare(strict_types=1);

$config = require __DIR__ . '/mt-config.php';

$db = new PDO(
    "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
    $config['db_user'],
    $config['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// PDO pozisyonel (?) ve isimli (:ad) yer tutucularin ayni sorguda
// karistirilmasina izin vermez; ikisi de isimli.
$stmt = $db->prepare(
    'SELECT table_name FROM information_schema.TABLES
     WHERE table_schema = :sema AND table_name NOT LIKE :onek'
);
$stmt->execute([':sema' => $config['db_name'], ':onek' => 'mt\_%']);
$tablolar = $stmt->fetchAll(PDO::FETCH_COLUMN);

if ($tablolar === []) {
    echo "Silinecek eski tablo yok.\n";
} else {
    echo 'Silinecek tablo: ' . count($tablolar) . "\n";

    // Laravel tablolarinda yabanci anahtar kisitlari var; silme sirasiyla
    // ugrasmamak icin kontrolleri gecici olarak kapatiyoruz.
    $db->exec('SET FOREIGN_KEY_CHECKS = 0');
    $silindi = 0;
    foreach ($tablolar as $t) {
        // Tablo adlari information_schema'dan geliyor, yine de beklenen
        // karakter kumesi disindakileri reddediyoruz.
        if (!preg_match('/^[A-Za-z0-9_]+$/', (string) $t)) {
            echo "  atlandi (beklenmeyen ad): {$t}\n";
            continue;
        }
        $db->exec('DROP TABLE IF EXISTS `' . $t . '`');
        $silindi++;
    }
    $db->exec('SET FOREIGN_KEY_CHECKS = 1');
    echo "Silindi: {$silindi}\n";
}

echo "\nKalan tablolar:\n";
foreach ($db->query('SHOW TABLES') as $row) {
    echo '  ' . $row[0] . "\n";
}

$boyut = $db->prepare(
    'SELECT ROUND(SUM(data_length + index_length) / 1024) FROM information_schema.TABLES
     WHERE table_schema = ?'
);
$boyut->execute([$config['db_name']]);
echo "\nVeritabani boyutu: " . (int) $boyut->fetchColumn() . " KB\n";
