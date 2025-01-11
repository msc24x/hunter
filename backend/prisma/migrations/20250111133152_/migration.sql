-- AlterTable
ALTER TABLE `results` ADD COLUMN `evaluated_by_id` INTEGER NULL,
    MODIFY `evaluated_at` DATETIME(0) NULL;

-- AddForeignKey
ALTER TABLE `results` ADD CONSTRAINT `results_evaluated_by_id_fkey` FOREIGN KEY (`evaluated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
