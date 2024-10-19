/*
  Warnings:

  - Added the required column `Bawaba_share` to the `sp_monthly_rev_data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Zain_share` to the `sp_monthly_rev_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `sp_monthly_rev_data` ADD COLUMN `Bawaba_share` DOUBLE NOT NULL,
    ADD COLUMN `Zain_share` DOUBLE NOT NULL;
