-- AlterTable
ALTER TABLE `questions` MODIFY `title` VARCHAR(400) NULL,
    MODIFY `statement` VARCHAR(4000) NULL,
    MODIFY `sample_cases` VARCHAR(1000) NULL,
    MODIFY `sample_sols` VARCHAR(1000) NULL;
