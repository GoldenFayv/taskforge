-- CreateTable
CREATE TABLE `JobExecution` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `attempt` INTEGER NOT NULL,
    `status` ENUM('PROCESSING', 'FAILED', 'COMPLETED') NOT NULL,
    `error` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `durationMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JobExecution_jobId_idx`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `JobExecution` ADD CONSTRAINT `JobExecution_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
