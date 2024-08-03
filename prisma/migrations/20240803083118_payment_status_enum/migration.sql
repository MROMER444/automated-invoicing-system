/*
  Warnings:

  - You are about to drop the column `orderId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `paymentstatus` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_orderId_fkey`;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `paymentstatus` ENUM('Completed', 'Failed') NOT NULL;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `orderId`;
