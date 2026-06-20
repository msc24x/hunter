-- AlterTable
ALTER TABLE `community_member` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `competitions` ADD COLUMN `randomize_questions` BOOLEAN NOT NULL DEFAULT true;
