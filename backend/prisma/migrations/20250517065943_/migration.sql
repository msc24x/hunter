-- AlterTable
ALTER TABLE `competitions` ADD COLUMN `hidden_scoreboard` BOOLEAN NOT NULL DEFAULT false;

UPDATE `competitions` SET `visibility` = 'PUBLIC' WHERE `public` = TRUE;