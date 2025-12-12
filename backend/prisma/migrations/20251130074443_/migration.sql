-- CreateTable
CREATE TABLE `community_permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(120) NOT NULL,
    `name` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `community_permission_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_community_memberTocommunity_permission` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_community_memberTocommunity_permission_AB_unique`(`A`, `B`),
    INDEX `_community_memberTocommunity_permission_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_community_memberTocommunity_permission` ADD CONSTRAINT `_community_memberTocommunity_permission_A_fkey` FOREIGN KEY (`A`) REFERENCES `community_member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_community_memberTocommunity_permission` ADD CONSTRAINT `_community_memberTocommunity_permission_B_fkey` FOREIGN KEY (`B`) REFERENCES `community_permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Add data
INSERT INTO `community_permission` (`code`, `name`)
VALUES ("MANAGE_COMPETITIONS", "Manage Competitions");
