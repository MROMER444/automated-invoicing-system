/*
  Warnings:

  - You are about to drop the column `Charged_Units` on the `sp_monthly_rev_data` table. All the data in the column will be lost.
  - You are about to drop the column `Opt_In` on the `sp_monthly_rev_data` table. All the data in the column will be lost.
  - You are about to drop the column `Opt_Out` on the `sp_monthly_rev_data` table. All the data in the column will be lost.
  - You are about to drop the column `Out_Of_Balance` on the `sp_monthly_rev_data` table. All the data in the column will be lost.
  - You are about to drop the column `ShortCode` on the `sp_monthly_rev_data` table. All the data in the column will be lost.
  - You are about to drop the column `Tariff` on the `sp_monthly_rev_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `sp_monthly_rev_data` DROP COLUMN `Charged_Units`,
    DROP COLUMN `Opt_In`,
    DROP COLUMN `Opt_Out`,
    DROP COLUMN `Out_Of_Balance`,
    DROP COLUMN `ShortCode`,
    DROP COLUMN `Tariff`;
