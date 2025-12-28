import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

function requirePharmacist(req, res, next) {
  if (req.user.role !== "PHARMACIST") {
    return res.status(403).json({ message: "Yetkisiz islem" });
  }
  return next();
}

router.post("/warehouse/invoice", requirePharmacist, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Fatura kalemi gerekli" });
  }

  const normalizedItems = items.map((item) => {
    const barcode = item.barcode ? String(item.barcode).trim() : "";
    const qrCode = item.qrCode ? String(item.qrCode).trim() : "";
    const name = item.name ? String(item.name).trim() : "Tanimlanmamis Urun";
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
    const allowedTypes = ["GENERAL", "ANTIBIOTIC"];
    const productType = allowedTypes.includes(item.productType) ? item.productType : "GENERAL";

    return {
      barcode,
      qrCode,
      name,
      quantity,
      price,
      expiryDate,
      productType,
    };
  });

  try {
    const summary = await prisma.$transaction(async (tx) => {
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const item of normalizedItems) {
        if ((!item.barcode && !item.qrCode) || item.quantity <= 0) {
          skipped += 1;
          continue;
        }

        const existing = await tx.product.findFirst({
          where: {
            pharmacyId: req.user.pharmacyId,
            OR: [
              item.barcode ? { barcode: item.barcode } : undefined,
              item.qrCode ? { qrCode: item.qrCode } : undefined,
            ].filter(Boolean),
          },
        });

        if (existing) {
          const updateData = {
            stock: { increment: item.quantity },
          };
          if (!Number.isNaN(item.price) && item.price > 0) {
            updateData.price = item.price;
          }
          if (item.expiryDate) {
            updateData.expiryDate = item.expiryDate;
          }
          if (item.productType) {
            updateData.productType = item.productType;
          }

          await tx.product.update({
            where: { id: existing.id },
            data: updateData,
          });
          updated += 1;
          continue;
        }

        if (!item.barcode || !item.qrCode) {
          skipped += 1;
          continue;
        }

        await tx.product.create({
          data: {
            barcode: item.barcode,
            qrCode: item.qrCode,
            name: item.name,
            price: Number.isNaN(item.price) ? 0 : item.price,
            stock: item.quantity,
            lowStockThreshold: 5,
            expiryDate: item.expiryDate,
            productType: item.productType,
            pharmacyId: req.user.pharmacyId,
          },
        });
        created += 1;
      }

      return { created, updated, skipped };
    });

    res.json({ message: "Fatura aktarimi alindi", ...summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fatura aktarimi basarisiz" });
  }
});

export default router;
