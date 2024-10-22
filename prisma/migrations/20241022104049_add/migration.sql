-- CreateTable
CREATE TABLE `monthly_statistic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Total_Gross_Revenue` DOUBLE NOT NULL,
    `Total_Invoice_to_Zain` DOUBLE NOT NULL,
    `Total_CMC_Tax_Amount` DOUBLE NOT NULL,
    `Zain_Net_Revenue` DOUBLE NOT NULL,
    `Date` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
