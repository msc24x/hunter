/*
  Warnings:

  - Made the column `public` on table `competitions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `competitions` ADD COLUMN `practice` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `public` BOOLEAN NOT NULL DEFAULT false;
