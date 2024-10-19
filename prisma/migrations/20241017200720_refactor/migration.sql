/*
  Warnings:

  - You are about to drop the `Services` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Services` DROP FOREIGN KEY `Services_Service_name_id_fkey`;

-- AlterTable
ALTER TABLE `sp_monthly_rev_data` ADD COLUMN `Bawaba_share` DOUBLE NOT NULL DEFAULT 0.7,
    ADD COLUMN `Zain_share` DOUBLE NOT NULL DEFAULT 0.3;

-- DropTable
DROP TABLE `Services`;
