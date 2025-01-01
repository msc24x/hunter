/*
  Warnings:

  - You are about to drop the column `group_number` on the `question_choice` table. All the data in the column will be lost.
  - You are about to drop the column `choice_type` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `question_choice` DROP COLUMN `group_number`;

-- AlterTable
ALTER TABLE `questions` DROP COLUMN `choice_type`,
    ADD COLUMN `case_sensitive` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `char_limit` INTEGER NULL;
