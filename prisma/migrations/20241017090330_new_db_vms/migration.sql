-- CreateTable
CREATE TABLE `sp_monthly_rev_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `SP_Name` VARCHAR(191) NOT NULL,
    `Service_Name` VARCHAR(191) NOT NULL,
    `ShortCode` INTEGER NOT NULL,
    `Opt_In` INTEGER NOT NULL,
    `Opt_Out` INTEGER NOT NULL,
    `Out_Of_Balance` INTEGER NOT NULL,
    `Charged_Units` INTEGER NOT NULL,
    `Total_Revenue` VARCHAR(191) NOT NULL,
    `Date` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
