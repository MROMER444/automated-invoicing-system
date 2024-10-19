/*
  Warnings:

  - You are about to drop the column `Bawaba_share` on the `sp_monthly_rev_data` table. All the data in the column will be lost.
  - You are about to drop the column `Zain_share` on the `sp_monthly_rev_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `sp_monthly_rev_data` DROP COLUMN `Bawaba_share`,
    DROP COLUMN `Zain_share`;
