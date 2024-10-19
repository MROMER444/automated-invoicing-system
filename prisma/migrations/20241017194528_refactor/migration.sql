/*
  Warnings:

  - You are about to drop the column `sp_name_id` on the `zain_service_rev_share_percentage` table. All the data in the column will be lost.
  - Added the required column `service_id` to the `zain_service_rev_share_percentage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `zain_service_rev_share_percentage` DROP FOREIGN KEY `zain_service_rev_share_percentage_sp_name_id_fkey`;

-- AlterTable
ALTER TABLE `zain_service_rev_share_percentage` DROP COLUMN `sp_name_id`,
    ADD COLUMN `service_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `zain_service_rev_share_percentage` ADD CONSTRAINT `zain_service_rev_share_percentage_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `sp_monthly_rev_data`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
