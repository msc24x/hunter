/*
  Warnings:

  - Made the column `created_at` on table `competitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rating` on table `competitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `duration` on table `competitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `competitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `questions` required. This step will fail if there are existing NULL values in that column.

*/

update questions set created_at=current_date() where created_at is null;

update competitions set created_at=current_date() where created_at is null;
update competitions set updated_at=current_date() where updated_at is null;


-- AlterTable
ALTER TABLE `competitions` ADD COLUMN `scheduled_end_at` DATETIME(0) NULL,
    MODIFY `created_at` DATETIME(0) NOT NULL,
    MODIFY `rating` INTEGER NOT NULL DEFAULT 0,
    MODIFY `duration` INTEGER NOT NULL DEFAULT 0,
    MODIFY `updated_at` DATETIME(0) NOT NULL;

-- AlterTable
ALTER TABLE `questions` MODIFY `created_at` DATETIME(0) NOT NULL;
