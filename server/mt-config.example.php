<?php
/**
 * MultiTools yapilandirmasi.
 *
 * ONEMLI: Bu dosya public_html'in DISINDA durmalidir; aksi halde tarayiciyla
 * indirilebilir ve veritabani parolaniz aciga cikar.
 *
 * Dogru konum:  /home/KULLANICI/domains/celaning.com/mt-config.php
 * Yanlis konum: /home/KULLANICI/domains/celaning.com/public_html/mt-config.php
 */
return [
    // --- Veritabani (hPanel > Veritabanlari bolumunden) ---------------------
    'db_host' => 'localhost',
    // hPanel'de olusturulan adlar "hesapNo_" onekiyle gelir, ornek:
    // u1234567_celaning / u1234567_admin
    'db_name' => 'BURAYA_VERITABANI_ADI',
    'db_user' => 'BURAYA_VERITABANI_KULLANICISI',
    'db_pass' => 'BURAYA_VERITABANI_PAROLASI',

    // --- Site ---------------------------------------------------------------
    'site_url' => 'https://celaning.com',

    // --- Yonetim paneli parolasi -------------------------------------------
    // Duz parola YAZMAYIN. Hash uretmek icin sunucuda su komutu calistirin:
    //   php -r "echo password_hash('SECTIGINIZ_PAROLA', PASSWORD_DEFAULT), PHP_EOL;"
    // Ciktiyi (\$2y\$... ile baslar) asagiya yapistirin.
    'admin_hash' => '$2y$10$BURAYA_PASSWORD_HASH_CIKTISI',

    // --- Gizlilik -----------------------------------------------------------
    // Ziyaretci hash'lerinde kullanilan gizli tuz. Rastgele uretin:
    //   php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    // Bunu degistirirseniz gecmis tekil ziyaretci sayimi sifirlanir.
    'hash_salt' => 'BURAYA_RASTGELE_64_KARAKTER',
];
