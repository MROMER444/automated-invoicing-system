/*
  Warnings:

  - You are about to drop the column `Bawaba_share` on the `sp_monthly_rev_data` table. All the data in the column will be lost.
  - You are about to drop the column `Zain_share` on the `sp_monthly_rev_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `sp_monthly_rev_data` DROP COLUMN `Bawaba_share`,
    DROP COLUMN `Zain_share`,
    ADD COLUMN `revShareId` INTEGER NULL;

-- CreateTable
CREATE TABLE `rev_share` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Zain_share` DOUBLE NOT NULL,
    `Bawaba_share` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sp_monthly_rev_data` ADD CONSTRAINT `sp_monthly_rev_data_revShareId_fkey` FOREIGN KEY (`revShareId`) REFERENCES `rev_share`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
