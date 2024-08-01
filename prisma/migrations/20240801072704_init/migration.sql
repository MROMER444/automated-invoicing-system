-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('Admin', 'client') NOT NULL DEFAULT 'client';
