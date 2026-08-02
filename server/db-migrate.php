<?php
/**
 * Sema guncellemelerini calistirir. Tekrar tekrar calistirilabilir (idempotent).
 *
 * NEDEN duz .sql dosyasi degil: MySQL 8, MariaDB'nin
 * "ALTER TABLE ... ADD COLUMN IF NOT EXISTS" sozdizimini desteklemiyor.
 * Bu yuzden her sutun/indeks eklemeden once information_schema'dan varligini
 * kontrol ediyoruz; boylece hem MySQL hem MariaDB'de calisir.
 *
 * Kullanim (domain kokunde):  php db-migrate.php
 */
declare(strict_types=1);

$config = require __DIR__ . '/mt-config.php';
$sema   = $config['db_name'];

$db = new PDO(
    "mysql:host={$config['db_host']};dbname={$sema};charset=utf8mb4",
    $config['db_user'],
    $config['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

function sutunVar(PDO $db, string $sema, string $tablo, string $sutun): bool
{
    $q = $db->prepare(
        'SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE table_schema = :s AND table_name = :t AND column_name = :c'
    );
    $q->execute([':s' => $sema, ':t' => $tablo, ':c' => $sutun]);
    return (int) $q->fetchColumn() > 0;
}

function indeksVar(PDO $db, string $sema, string $tablo, string $indeks): bool
{
    $q = $db->prepare(
        'SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE table_schema = :s AND table_name = :t AND index_name = :i'
    );
    $q->execute([':s' => $sema, ':t' => $tablo, ':i' => $indeks]);
    return (int) $q->fetchColumn() > 0;
}

/** tablo => [sutun adi => tanim] */
$sutunlar = [
    'mt_events' => [
        // Sayfada gecirilen sure (sayfadan ayrilirken gonderilir).
        'duration_ms' => 'INT UNSIGNED DEFAULT NULL',
        // En derin kaydirma yuzdesi: icerigin ne kadari goruldu.
        'scroll_pct'  => 'TINYINT UNSIGNED DEFAULT NULL',
        // Tarayici / isletim sistemi: kaba siniflandirma, surum tutulmaz.
        'browser'     => 'VARCHAR(24) DEFAULT NULL',
        'os'          => 'VARCHAR(24) DEFAULT NULL',
        // Ekran genisligi (kirilim noktasi icin).
        'viewport_w'  => 'SMALLINT UNSIGNED DEFAULT NULL',
        // Tam referans adresi: hangi LinkedIn paylasimi / hangi sayfa oldugunu
        // gormek icin. Yalnizca host yeterli degil.
        'referrer_url' => 'VARCHAR(400) DEFAULT NULL',
    ],
    'mt_posts' => [
        // Yazi sonunda gosterilen ilgili arac slug'lari.
        'related_tools' => "VARCHAR(400) NOT NULL DEFAULT ''",
    ],
];

$eklenen = 0;
foreach ($sutunlar as $tablo => $liste) {
    foreach ($liste as $sutun => $tanim) {
        if (sutunVar($db, $sema, $tablo, $sutun)) {
            echo "  = {$tablo}.{$sutun} zaten var\n";
            continue;
        }
        $db->exec("ALTER TABLE `{$tablo}` ADD COLUMN `{$sutun}` {$tanim}");
        echo "  + {$tablo}.{$sutun} eklendi\n";
        $eklenen++;
    }
}


/* ─────────────────────────── Yeni tablolar ─────────────────────────── */

function tabloVar(PDO $db, string $sema, string $tablo): bool
{
    $q = $db->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES
         WHERE table_schema = :s AND table_name = :t'
    );
    $q->execute([':s' => $sema, ':t' => $tablo]);
    return (int) $q->fetchColumn() > 0;
}

$yeniTablolar = [
    // Yonetim islemleri denetim kaydi.
    'mt_audit' => "CREATE TABLE mt_audit (
        id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        action     VARCHAR(40)  NOT NULL,
        detail     VARCHAR(300) NOT NULL DEFAULT '',
        ip_hash    CHAR(16)     NOT NULL,
        browser    VARCHAR(24)  DEFAULT NULL,
        os         VARCHAR(24)  DEFAULT NULL,
        created_at DATETIME     NOT NULL,
        PRIMARY KEY (id),
        KEY idx_zaman (created_at),
        KEY idx_eylem (action, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    // Ziyaretci konumu. HAM IP SAKLANMAZ; yalnizca cozulmus konum.
    'mt_geo' => "CREATE TABLE mt_geo (
        visitor_hash CHAR(16)    NOT NULL,
        country_code CHAR(2)     DEFAULT NULL,
        country      VARCHAR(60) DEFAULT NULL,
        city         VARCHAR(60) DEFAULT NULL,
        isp          VARCHAR(80) DEFAULT NULL,
        is_proxy     TINYINT(1)  NOT NULL DEFAULT 0,
        is_hosting   TINYINT(1)  NOT NULL DEFAULT 0,
        created_at   DATETIME    NOT NULL,
        PRIMARY KEY (visitor_hash),
        KEY idx_ulke (country_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    // Etkilesim kayitlari (fare yolu, tiklama, hover, kaydirma).
    // METIN ICERMEZ - bkz. components/analytics/Recorder.ts
    'mt_messages' => "CREATE TABLE mt_messages (
        id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
        ad           VARCHAR(80)  NOT NULL,
        eposta       VARCHAR(190) NOT NULL,
        konu         VARCHAR(160) NOT NULL DEFAULT '',
        mesaj        TEXT         NOT NULL,
        durum        ENUM('yeni','okundu','arsiv') NOT NULL DEFAULT 'yeni',
        visitor_hash CHAR(16)     DEFAULT NULL,
        user_agent   VARCHAR(255) DEFAULT NULL,
        created_at   DATETIME     NOT NULL,
        PRIMARY KEY (id),
        KEY idx_durum (durum, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'mt_comments' => "CREATE TABLE mt_comments (
        id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
        post_id      INT UNSIGNED NOT NULL,
        ad           VARCHAR(60)  NOT NULL,
        eposta       VARCHAR(190) NOT NULL DEFAULT '',
        govde        TEXT         NOT NULL,
        durum        ENUM('bekliyor','onayli','spam') NOT NULL DEFAULT 'bekliyor',
        visitor_hash CHAR(16)     DEFAULT NULL,
        created_at   DATETIME     NOT NULL,
        PRIMARY KEY (id),
        KEY idx_post (post_id, durum, created_at),
        KEY idx_durum (durum, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'mt_replays' => "CREATE TABLE mt_replays (
        id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        visitor_hash CHAR(16)     NOT NULL,
        path         VARCHAR(255) NOT NULL,
        viewport_w   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
        viewport_h   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
        doc_h        MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
        duration_ms  INT UNSIGNED NOT NULL DEFAULT 0,
        frame_count  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
        browser      VARCHAR(24)  DEFAULT NULL,
        os           VARCHAR(24)  DEFAULT NULL,
        device       VARCHAR(10)  DEFAULT NULL,
        frames       MEDIUMTEXT   NOT NULL,
        created_at   DATETIME     NOT NULL,
        PRIMARY KEY (id),
        KEY idx_zaman (created_at),
        KEY idx_yol (path, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
];

foreach ($yeniTablolar as $ad => $ddl) {
    if (tabloVar($db, $sema, $ad)) {
        echo "  = {$ad} tablosu zaten var
";
        continue;
    }
    $db->exec($ddl);
    echo "  + {$ad} tablosu olusturuldu
";
    $eklenen++;
}

/** tablo => [indeks adi => sutunlar] */
$indeksler = [
    // Yolculuk sorgusu ziyaretci + zaman siralar; bu indeks onu hizlandirir.
    'mt_events' => ['idx_journey' => '(visitor_hash, created_at, id)'],
];

foreach ($indeksler as $tablo => $liste) {
    foreach ($liste as $ad => $sutunlarStr) {
        if (indeksVar($db, $sema, $tablo, $ad)) {
            echo "  = {$tablo}.{$ad} indeksi zaten var\n";
            continue;
        }
        $db->exec("CREATE INDEX `{$ad}` ON `{$tablo}` {$sutunlarStr}");
        echo "  + {$tablo}.{$ad} indeksi eklendi\n";
        $eklenen++;
    }
}

echo "\n{$eklenen} degisiklik uygulandi.\n";
echo 'MySQL: ' . $db->query('SELECT VERSION()')->fetchColumn() . "\n";
