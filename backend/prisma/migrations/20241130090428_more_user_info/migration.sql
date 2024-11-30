-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(100) NULL,
    ADD COLUMN `blog_url` VARCHAR(100) NULL,
    ADD COLUMN `github_url` VARCHAR(100) NULL,
    ADD COLUMN `linkedin_url` VARCHAR(100) NULL;
