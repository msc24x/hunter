/*
  Warnings:

  - Made the column `email` on table `competition_invite` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `competition_invite` MODIFY `email` VARCHAR(330) NOT NULL;
