-- AlterTable
ALTER TABLE `competitions` ADD COLUMN `community_id` INTEGER NULL,
    ADD COLUMN `community_only` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `community` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NULL,
    `description` VARCHAR(456) NULL,
    `logo_file_path` VARCHAR(224) NULL,
    `website_link` VARCHAR(224) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` ENUM('PENDING_APPROVAL', 'APPROVED', 'NOT_APPROVED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    `admin_user_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `community_id` INTEGER NOT NULL,
    `status` ENUM('PENDING_APPROVAL', 'APPROVED', 'NOT_APPROVED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_community_id_fkey` FOREIGN KEY (`community_id`) REFERENCES `community`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community` ADD CONSTRAINT `community_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_member` ADD CONSTRAINT `community_member_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_member` ADD CONSTRAINT `community_member_community_id_fkey` FOREIGN KEY (`community_id`) REFERENCES `community`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
