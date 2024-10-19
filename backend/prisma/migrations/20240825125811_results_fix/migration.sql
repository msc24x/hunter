/*
  Warnings:

  - You are about to drop the column `competition_id` on the `results` table. All the data in the column will be lost.
  - You are about to drop the column `penalities` on the `results` table. All the data in the column will be lost.
  - Made the column `points` on table `questions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `questions` ADD COLUMN `neg_points` INTEGER NOT NULL DEFAULT 0,
    MODIFY `points` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `results` DROP COLUMN `competition_id`,
    DROP COLUMN `penalities`,
    ADD COLUMN `meta` VARCHAR(200) NULL,
    ADD COLUMN `submission` TEXT NULL;

-- AddForeignKey
ALTER TABLE `results` ADD CONSTRAINT `results_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
