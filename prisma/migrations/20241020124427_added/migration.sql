-- DropForeignKey
ALTER TABLE `sp_monthly_rev_data` DROP FOREIGN KEY `sp_monthly_rev_data_Service_Name_fkey`;

-- AddForeignKey
ALTER TABLE `sp_monthly_rev_data` ADD CONSTRAINT `sp_monthly_rev_data_Service_Name_fkey` FOREIGN KEY (`Service_Name`) REFERENCES `rev_share`(`Service_Name`) ON DELETE CASCADE ON UPDATE CASCADE;
