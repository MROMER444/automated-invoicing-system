/*
  Warnings:

  - You are about to drop the column `revShareId` on the `sp_monthly_rev_data` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `sp_monthly_rev_data` DROP FOREIGN KEY `sp_monthly_rev_data_revShareId_fkey`;

-- AlterTable
ALTER TABLE `sp_monthly_rev_data` DROP COLUMN `revShareId`;
