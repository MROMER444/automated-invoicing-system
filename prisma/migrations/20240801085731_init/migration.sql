/*
  Warnings:

  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Address` DROP FOREIGN KEY `Address_userId_fkey`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `address` VARCHAR(191) NOT NULL DEFAULT '';

-- DropTable
DROP TABLE `Address`;
