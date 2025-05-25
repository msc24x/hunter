-- CreateTable
CREATE TABLE `competition_invite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `accepted_at` DATETIME(0) NULL,
    `email` VARCHAR(330) NULL,
    `user_id` INTEGER NOT NULL,
    `competition_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `competition_invite` ADD CONSTRAINT `competition_invite_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competition_invite` ADD CONSTRAINT `competition_invite_competition_id_fkey` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
