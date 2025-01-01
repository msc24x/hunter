-- DropForeignKey
ALTER TABLE `question_choice` DROP FOREIGN KEY `question_choice_question_id_fkey`;

-- DropIndex
DROP INDEX `question_choice_question_id_key` ON `question_choice`;
