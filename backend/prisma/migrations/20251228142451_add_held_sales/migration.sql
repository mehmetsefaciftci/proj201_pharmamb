-- CreateTable
CREATE TABLE `HeldSale` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `pharmacyId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,
    `prescriptionId` INTEGER NULL,

    INDEX `HeldSale_pharmacyId_createdAt_idx`(`pharmacyId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HeldSaleItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `heldSaleId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,

    INDEX `HeldSaleItem_heldSaleId_idx`(`heldSaleId`),
    INDEX `HeldSaleItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HeldSale` ADD CONSTRAINT `HeldSale_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeldSale` ADD CONSTRAINT `HeldSale_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeldSale` ADD CONSTRAINT `HeldSale_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeldSaleItem` ADD CONSTRAINT `HeldSaleItem_heldSaleId_fkey` FOREIGN KEY (`heldSaleId`) REFERENCES `HeldSale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeldSaleItem` ADD CONSTRAINT `HeldSaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
