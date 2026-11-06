CREATE TABLE IF NOT EXISTS `ins_student_upload_layout_migrations` (
  `migration_key` VARCHAR(100) NOT NULL,
  `completed_at` DATETIME NOT NULL,
  PRIMARY KEY (`migration_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
