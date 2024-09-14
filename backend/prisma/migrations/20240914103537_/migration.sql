-- AlterTable
ALTER TABLE `question_verification` ADD COLUMN `language` VARCHAR(20) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `results` ADD COLUMN `language` VARCHAR(20) NOT NULL DEFAULT '';
