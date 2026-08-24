/*
  Warnings:

  - You are about to drop the column `createAt` on the `Job` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `DeadLetterJob` DROP FOREIGN KEY `DeadLetterJob_jobId_fkey`;

-- AlterTable
ALTER TABLE `Job` DROP COLUMN `createAt`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `scheduledAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE `DeadLetterJob` ADD CONSTRAINT `DeadLetterJob_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
