/*
  Warnings:

  - You are about to drop the `zain_service_rev_share_percentage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `zain_service_rev_share_percentage` DROP FOREIGN KEY `zain_service_rev_share_percentage_service_id_fkey`;

-- DropTable
DROP TABLE `zain_service_rev_share_percentage`;

-- CreateTable
CREATE TABLE `Services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Service_name_id` INTEGER NOT NULL,
    `Service_Id` INTEGER NOT NULL,
    `Sp_Id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Services` ADD CONSTRAINT `Services_Service_name_id_fkey` FOREIGN KEY (`Service_name_id`) REFERENCES `sp_monthly_rev_data`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
