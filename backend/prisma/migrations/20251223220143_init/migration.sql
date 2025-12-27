-- Migration rewritten to match the current Prisma schema.

CREATE TABLE `Pharmacy` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Pharmacy_name_city_key` (`name`, `city`),
  INDEX `Pharmacy_city_idx` (`city`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `role` ENUM('PHARMACIST', 'STAFF') NOT NULL DEFAULT 'STAFF',
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `pharmacyId` INT NOT NULL,
  UNIQUE INDEX `User_email_key` (`email`),
  INDEX `User_pharmacyId_idx` (`pharmacyId`),
  INDEX `User_role_idx` (`role`),
  PRIMARY KEY (`id`),
  CONSTRAINT `User_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Product` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `barcode` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `lowStockThreshold` INT NOT NULL DEFAULT 5,
  `expiryDate` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `pharmacyId` INT NOT NULL,
  UNIQUE INDEX `Product_pharmacyId_barcode_key` (`pharmacyId`, `barcode`),
  INDEX `Product_pharmacyId_idx` (`pharmacyId`),
  INDEX `Product_name_idx` (`name`),
  INDEX `Product_expiryDate_idx` (`expiryDate`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Product_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Sale` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `total` DECIMAL(10, 2) NOT NULL,
  `paymentType` ENUM('CASH', 'CARD', 'OTHER') NOT NULL DEFAULT 'CASH',
  `status` ENUM('COMPLETED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'COMPLETED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `pharmacyId` INT NOT NULL,
  `userId` INT NOT NULL,
  INDEX `Sale_pharmacyId_createdAt_idx` (`pharmacyId`, `createdAt`),
  INDEX `Sale_status_idx` (`status`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Sale_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Sale_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SaleItem` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `quantity` INT NOT NULL,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `lineTotal` DECIMAL(10, 2) NOT NULL,
  `saleId` INT NOT NULL,
  `productId` INT NOT NULL,
  INDEX `SaleItem_saleId_idx` (`saleId`),
  INDEX `SaleItem_productId_idx` (`productId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `SaleItem_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CashRegister` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `openingCash` DECIMAL(10, 2) NOT NULL,
  `closingCash` DECIMAL(10, 2) NULL,
  `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `closedAt` DATETIME(3) NULL,
  `pharmacyId` INT NOT NULL,
  `openedById` INT NOT NULL,
  INDEX `CashRegister_pharmacyId_status_idx` (`pharmacyId`, `status`),
  PRIMARY KEY (`id`),
  CONSTRAINT `CashRegister_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CashRegister_openedById_fkey` FOREIGN KEY (`openedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Invoice` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `invoiceNo` VARCHAR(191) NOT NULL,
  `status` ENUM('SENT', 'ERROR') NOT NULL DEFAULT 'SENT',
  `pdfUrl` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `pharmacyId` INT NOT NULL,
  `saleId` INT NOT NULL,
  UNIQUE INDEX `Invoice_saleId_key` (`saleId`),
  INDEX `Invoice_pharmacyId_createdAt_idx` (`pharmacyId`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Invoice_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Invoice_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
