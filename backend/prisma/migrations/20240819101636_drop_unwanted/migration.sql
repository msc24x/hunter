/*
  Warnings:

  - You are about to drop the column `duration` on the `competitions` table. All the data in the column will be lost.
  - You are about to drop the column `start_schedule` on the `competitions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `competitions` DROP COLUMN `duration`,
    DROP COLUMN `start_schedule`;
