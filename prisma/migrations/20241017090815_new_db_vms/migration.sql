/*
  Warnings:

  - Added the required column `Tariff` to the `sp_monthly_rev_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `sp_monthly_rev_data` ADD COLUMN `Tariff` VARCHAR(191) NOT NULL;
