-- AlterTable
ALTER TABLE `competitions` ADD COLUMN `visibility` ENUM('PRIVATE', 'PUBLIC', 'INVITE') NOT NULL DEFAULT 'PRIVATE';
