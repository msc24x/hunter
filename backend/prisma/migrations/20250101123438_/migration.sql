-- AddForeignKey
ALTER TABLE `question_choice` ADD CONSTRAINT `question_choice_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
