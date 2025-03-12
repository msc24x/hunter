-- CreateTable
CREATE TABLE `competition_session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_success_at` DATETIME(0) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `competition_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `competition_session` ADD CONSTRAINT `competition_session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competition_session` ADD CONSTRAINT `competition_session_competition_id_fkey` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
