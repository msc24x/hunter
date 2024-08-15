-- CreateTable
CREATE TABLE `competitions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `host_user_id` INTEGER NULL,
    `title` VARCHAR(120) NULL,
    `description` VARCHAR(456) NULL,
    `created_on` DATETIME(0) NULL,
    `rating` INTEGER NULL DEFAULT 0,
    `public` BOOLEAN NULL,
    `duration` INTEGER NULL DEFAULT 0,
    `start_schedule` VARCHAR(30) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `files` (
    `id` INTEGER NOT NULL,
    `path` VARCHAR(224) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `competition_id` INTEGER NOT NULL,
    `title` VARCHAR(150) NULL,
    `statement` VARCHAR(2048) NULL,
    `points` INTEGER NULL DEFAULT 0,
    `date_created` DATETIME(0) NULL,
    `sample_cases` VARCHAR(250) NULL,
    `sample_sols` VARCHAR(250) NULL,

    INDEX `fk_cid`(`competition_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `question_id` INTEGER NOT NULL,
    `result` INTEGER NOT NULL,
    `competition_id` INTEGER NOT NULL,
    `penalities` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(330) NULL,
    `name` VARCHAR(50) NULL,
    `password_hash` VARCHAR(120) NULL,
    `salt` VARCHAR(16) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `fk_cid` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

