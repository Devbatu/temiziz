-- Yaziya bagli araclar (virgulle ayrilmis slug listesi).
-- Yazi sonunda "Bu yazida gecen araclar" kartlari olarak gosterilir:
-- hem okuyucu icin dogal bir sonraki adim, hem de blog -> arac yonunde
-- site ici baglanti kurar.
ALTER TABLE mt_posts ADD COLUMN IF NOT EXISTS related_tools VARCHAR(400) NOT NULL DEFAULT '' AFTER body;
