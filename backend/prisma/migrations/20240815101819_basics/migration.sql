/*
  Warnings:

  - You are about to drop the column `created_on` on the `competitions` table. All the data in the column will be lost.
    updated to rename now
  - You are about to drop the column `date_created` on the `questions` table. All the data in the column will be lost.
    updated to rename now
  - You are about to drop the column `password_hash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `salt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `session` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `competitions` RENAME COLUMN `created_on` TO `created_at`;

ALTER TABLE `competitions`
    ADD COLUMN `deleted_at` DATETIME(0) NULL,
    ADD COLUMN `updated_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `questions` RENAME COLUMN `date_created` TO `created_at`;

ALTER TABLE `questions` ADD COLUMN `deleted_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `password_hash`,
    DROP COLUMN `salt`;

-- CreateIndex
CREATE UNIQUE INDEX `session_user_id_key` ON `session`(`user_id`);

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_host_user_id_fkey` FOREIGN KEY (`host_user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `results` ADD CONSTRAINT `results_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
