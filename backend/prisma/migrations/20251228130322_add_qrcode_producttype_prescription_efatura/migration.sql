/*
  Warnings:

  - A unique constraint covering the columns `[pharmacyId,qrCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `product` ADD COLUMN `productType` ENUM('GENERAL', 'ANTIBIOTIC') NOT NULL DEFAULT 'GENERAL',
    ADD COLUMN `qrCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sale` ADD COLUMN `prescriptionId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Prescription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientTc` VARCHAR(191) NOT NULL,
    `prescriptionNo` VARCHAR(191) NOT NULL,
    `status` ENUM('VERIFIED', 'PENDING') NOT NULL DEFAULT 'VERIFIED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `pharmacyId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,

    INDEX `Prescription_pharmacyId_idx`(`pharmacyId`),
    INDEX `Prescription_prescriptionNo_idx`(`prescriptionNo`),
    INDEX `Prescription_patientTc_idx`(`patientTc`),
    UNIQUE INDEX `Prescription_pharmacyId_patientTc_prescriptionNo_key`(`pharmacyId`, `patientTc`, `prescriptionNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Efatura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceNo` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'ERROR') NOT NULL DEFAULT 'DRAFT',
    `pdfUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pharmacyId` INTEGER NOT NULL,
    `saleId` INTEGER NOT NULL,

    INDEX `Efatura_pharmacyId_createdAt_idx`(`pharmacyId`, `createdAt`),
    UNIQUE INDEX `Efatura_saleId_key`(`saleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Product_pharmacyId_qrCode_key` ON `Product`(`pharmacyId`, `qrCode`);

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Efatura` ADD CONSTRAINT `Efatura_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Efatura` ADD CONSTRAINT `Efatura_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
