/*
  Warnings:

  - The values [QUEUED,SUCCESS,DEAD_LETTER] on the enum `Job_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Job` MODIFY `status` ENUM('PENDING', 'PROCESSING', 'RETRYING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';
