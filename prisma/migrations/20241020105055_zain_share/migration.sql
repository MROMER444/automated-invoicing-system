-- AlterTable
ALTER TABLE `rev_share` ADD COLUMN `Service_Name` VARCHAR(191) NULL,
    MODIFY `Zain_share` DOUBLE NOT NULL DEFAULT 0.3,
    MODIFY `Bawaba_share` DOUBLE NOT NULL DEFAULT 0.7;
