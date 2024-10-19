-- CreateTable
CREATE TABLE `zain_service_rev_share_percentage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sp_name_id` INTEGER NOT NULL,
    `Service_Name` VARCHAR(191) NOT NULL,
    `Zain_share` VARCHAR(191) NOT NULL,
    `Bawaba_share` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `zain_service_rev_share_percentage` ADD CONSTRAINT `zain_service_rev_share_percentage_sp_name_id_fkey` FOREIGN KEY (`sp_name_id`) REFERENCES `sp_monthly_rev_data`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
