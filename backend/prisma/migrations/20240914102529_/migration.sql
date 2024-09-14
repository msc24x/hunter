/*
  Warnings:

  - A unique constraint covering the columns `[question_id]` on the table `question_verification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `question_verification_question_id_key` ON `question_verification`(`question_id`);
