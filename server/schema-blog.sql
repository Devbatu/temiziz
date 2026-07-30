-- Blog yazilari. Kaynak dogruluk buradadir; statik HTML buradan uretilir.
CREATE TABLE IF NOT EXISTS mt_posts (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(90)  NOT NULL,
  title        VARCHAR(200) NOT NULL,
  category     VARCHAR(60)  NOT NULL DEFAULT 'Genel',
  excerpt      VARCHAR(300) NOT NULL DEFAULT '',
  body         MEDIUMTEXT   NOT NULL,
  reading_time TINYINT UNSIGNED NOT NULL DEFAULT 3,
  status       ENUM('draft','published') NOT NULL DEFAULT 'draft',
  published_at DATETIME     NOT NULL,
  updated_at   DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slug (slug),
  KEY idx_status_date (status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
