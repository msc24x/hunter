-- AlterTable
ALTER TABLE `questions` ADD COLUMN `choice_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `position` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `type` TINYINT UNSIGNED NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `question_choice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `text` VARCHAR(150) NULL,
    `group_number` TINYINT UNSIGNED NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `question_id` INTEGER NOT NULL,
    `is_correct` BOOLEAN NOT NULL,

    UNIQUE INDEX `question_choice_question_id_key`(`question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_question_choice` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_question_choice_AB_unique`(`A`, `B`),
    INDEX `_question_choice_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `question_choice` ADD CONSTRAINT `question_choice_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_question_choice` ADD CONSTRAINT `_question_choice_A_fkey` FOREIGN KEY (`A`) REFERENCES `question_choice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_question_choice` ADD CONSTRAINT `_question_choice_B_fkey` FOREIGN KEY (`B`) REFERENCES `results`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
