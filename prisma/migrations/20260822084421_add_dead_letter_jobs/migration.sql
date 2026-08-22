/*
  Warnings:

  - The values [RETRY] on the enum `Job_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Job` MODIFY `status` ENUM('PENDING', 'QUEUED', 'PROCESSING', 'SUCCESS', 'COMPLETED', 'FAILED', 'RETRYING', 'DEAD_LETTER') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `DeadLetterJob` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `error` VARCHAR(191) NULL,
    `attempts` INTEGER NOT NULL,
    `failedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DeadLetterJob_jobId_key`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DeadLetterJob` ADD CONSTRAINT `DeadLetterJob_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
