/*
  Warnings:

  - A unique constraint covering the columns `[Service_Name]` on the table `rev_share` will be added. If there are existing duplicate values, this will fail.
  - Made the column `Service_Name` on table `rev_share` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `rev_share` MODIFY `Service_Name` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `rev_share_Service_Name_key` ON `rev_share`(`Service_Name`);

-- AddForeignKey
ALTER TABLE `sp_monthly_rev_data` ADD CONSTRAINT `sp_monthly_rev_data_Service_Name_fkey` FOREIGN KEY (`Service_Name`) REFERENCES `rev_share`(`Service_Name`) ON DELETE RESTRICT ON UPDATE CASCADE;
