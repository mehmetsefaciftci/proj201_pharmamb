import express from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";

const router = express.Router();

function requirePharmacist(req, res, next) {
  if (req.user.role !== "PHARMACIST") {
    return res.status(403).json({ message: "Yetkisiz islem" });
  }
  return next();
}

function buildDailyRange(dateParam) {
  const start = dateParam ? new Date(dateParam) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

router.post("/", async (req, res) => {
  const { items, paymentType, prescriptionId } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Satis kalemi gerekli" });
  }

  const normalizedItems = items
    .map((item) => ({
      productId: item.productId ? Number(item.productId) : null,
      barcode: item.barcode ? String(item.barcode).trim() : null,
      quantity: Number(item.quantity),
    }))
    .filter((item) => item.quantity > 0 && (item.productId || item.barcode));

  if (normalizedItems.length === 0) {
    return res.status(400).json({ message: "Gecersiz urun secimi" });
  }

  const parsedPrescriptionId = prescriptionId ? Number(prescriptionId) : null;

  try {
    const allowedPaymentTypes = ["CASH", "CARD", "OTHER"];
    const safePaymentType = allowedPaymentTypes.includes(paymentType)
      ? paymentType
      : "CASH";

    const sale = await prisma.$transaction(async (tx) => {
      let prescription = null;
      if (parsedPrescriptionId) {
        prescription = await tx.prescription.findFirst({
          where: { id: parsedPrescriptionId, pharmacyId: req.user.pharmacyId },
        });

        if (!prescription) {
          throw new Error("PRESCRIPTION_NOT_FOUND");
        }
      }

      const saleItemsData = [];
      let total = 0;

      for (const item of normalizedItems) {
        const product = await tx.product.findFirst({
          where: {
            pharmacyId: req.user.pharmacyId,
            ...(item.productId
              ? { id: item.productId }
              : { OR: [{ barcode: item.barcode }, { qrCode: item.barcode }] }),
          },
        });

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        if (product.productType === "ANTIBIOTIC" && !prescription) {
          throw new Error("PRESCRIPTION_REQUIRED");
        }

        if (product.stock < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const lineTotal = Number(product.price) * item.quantity;
        total += lineTotal;

        saleItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal,
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });
      }

      const createdSale = await tx.sale.create({
        data: {
          total,
          paymentType: safePaymentType,
          pharmacyId: req.user.pharmacyId,
          userId: req.user.userId,
          prescriptionId: prescription?.id || null,
          items: { create: saleItemsData },
        },
        include: {
          items: {
            include: { product: { select: { name: true, barcode: true } } },
          },
        },
      });

      return createdSale;
    });

    res.status(201).json(sale);
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Urun bulunamadi" });
    }
    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({ message: "Yetersiz stok" });
    }
    if (error.message === "PRESCRIPTION_REQUIRED") {
      return res.status(400).json({ message: "Recetesiz antibiyotik satilamaz" });
    }
    if (error.message === "PRESCRIPTION_NOT_FOUND") {
      return res.status(404).json({ message: "Recete bulunamadi" });
    }
    console.error(error);
    res.status(500).json({ message: "Sunucu hatasi" });
  }
});

router.post("/hold", async (req, res) => {
  const { items, prescriptionId, note } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Satis kalemi gerekli" });
  }

  const normalizedItems = items
    .map((item) => ({
      productId: item.productId ? Number(item.productId) : null,
      barcode: item.barcode ? String(item.barcode).trim() : null,
      quantity: Number(item.quantity),
    }))
    .filter((item) => item.quantity > 0 && (item.productId || item.barcode));

  if (normalizedItems.length === 0) {
    return res.status(400).json({ message: "Gecersiz urun secimi" });
  }

  const parsedPrescriptionId = prescriptionId ? Number(prescriptionId) : null;

  try {
    const heldSale = await prisma.$transaction(async (tx) => {
      let prescription = null;
      if (parsedPrescriptionId) {
        prescription = await tx.prescription.findFirst({
          where: { id: parsedPrescriptionId, pharmacyId: req.user.pharmacyId },
        });

        if (!prescription) {
          throw new Error("PRESCRIPTION_NOT_FOUND");
        }
      }

      const heldItems = [];

      for (const item of normalizedItems) {
        const product = await tx.product.findFirst({
          where: {
            pharmacyId: req.user.pharmacyId,
            ...(item.productId
              ? { id: item.productId }
              : { OR: [{ barcode: item.barcode }, { qrCode: item.barcode }] }),
          },
        });

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        if (product.productType === "ANTIBIOTIC" && !prescription) {
          throw new Error("PRESCRIPTION_REQUIRED");
        }

        if (product.stock < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const lineTotal = Number(product.price) * item.quantity;
        heldItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal,
        });
      }

      return tx.heldSale.create({
        data: {
          note: note ? String(note).trim() : null,
          pharmacyId: req.user.pharmacyId,
          createdById: req.user.userId,
          prescriptionId: prescription?.id || null,
          items: { create: heldItems },
        },
        include: {
          items: {
            include: { product: { select: { name: true, barcode: true } } },
          },
        },
      });
    });

    res.status(201).json(heldSale);
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Urun bulunamadi" });
    }
    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({ message: "Yetersiz stok" });
    }
    if (error.message === "PRESCRIPTION_REQUIRED") {
      return res.status(400).json({ message: "Recetesiz antibiyotik satilamaz" });
    }
    if (error.message === "PRESCRIPTION_NOT_FOUND") {
      return res.status(404).json({ message: "Recete bulunamadi" });
    }
    console.error(error);
    res.status(500).json({ message: "Bekleyen satis kaydedilemedi" });
  }
});

router.get("/hold", async (req, res) => {
  try {
    const heldSales = await prisma.heldSale.findMany({
      where: { pharmacyId: req.user.pharmacyId },
      include: {
        items: {
          include: { product: { select: { name: true, barcode: true } } },
        },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(heldSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Bekleyen satislar getirilemedi" });
  }
});

router.post("/hold/:id/complete", async (req, res) => {
  const holdId = Number(req.params.id);
  if (!holdId) {
    return res.status(400).json({ message: "Gecersiz bekleyen satis" });
  }

  const { paymentType } = req.body;
  const allowedPaymentTypes = ["CASH", "CARD", "OTHER"];
  const safePaymentType = allowedPaymentTypes.includes(paymentType)
    ? paymentType
    : "CASH";

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const heldSale = await tx.heldSale.findFirst({
        where: { id: holdId, pharmacyId: req.user.pharmacyId },
        include: { items: true, prescription: true },
      });

      if (!heldSale) {
        throw new Error("HOLD_NOT_FOUND");
      }

      const saleItemsData = [];
      let total = 0;

      for (const item of heldSale.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, pharmacyId: req.user.pharmacyId },
        });

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        if (product.productType === "ANTIBIOTIC" && !heldSale.prescriptionId) {
          throw new Error("PRESCRIPTION_REQUIRED");
        }

        if (product.stock < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const lineTotal = Number(product.price) * item.quantity;
        total += lineTotal;
        saleItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal,
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });
      }

      const createdSale = await tx.sale.create({
        data: {
          total,
          paymentType: safePaymentType,
          pharmacyId: req.user.pharmacyId,
          userId: req.user.userId,
          prescriptionId: heldSale.prescriptionId || null,
          items: { create: saleItemsData },
        },
        include: {
          items: {
            include: { product: { select: { name: true, barcode: true } } },
          },
        },
      });

      await tx.heldSale.delete({ where: { id: heldSale.id } });

      return createdSale;
    });

    res.status(201).json(sale);
  } catch (error) {
    if (error.message === "HOLD_NOT_FOUND") {
      return res.status(404).json({ message: "Bekleyen satis bulunamadi" });
    }
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Urun bulunamadi" });
    }
    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({ message: "Yetersiz stok" });
    }
    if (error.message === "PRESCRIPTION_REQUIRED") {
      return res.status(400).json({ message: "Recetesiz antibiyotik satilamaz" });
    }
    console.error(error);
    res.status(500).json({ message: "Bekleyen satis tamamlanamadi" });
  }
});

router.delete("/hold/:id", async (req, res) => {
  const holdId = Number(req.params.id);
  if (!holdId) {
    return res.status(400).json({ message: "Gecersiz bekleyen satis" });
  }

  try {
    const existing = await prisma.heldSale.findFirst({
      where: { id: holdId, pharmacyId: req.user.pharmacyId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Bekleyen satis bulunamadi" });
    }

    await prisma.heldSale.delete({ where: { id: existing.id } });
    res.json({ message: "Bekleyen satis silindi" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Bekleyen satis silinemedi" });
  }
});

router.get("/", async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { pharmacyId: req.user.pharmacyId },
      include: {
        items: {
          include: { product: { select: { name: true, barcode: true } } },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Satislar getirilemedi" });
  }
});

router.post("/:id/cancel", async (req, res) => {
  const saleId = Number(req.params.id);
  if (!saleId) {
    return res.status(400).json({ message: "Gecersiz satis" });
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findFirst({
        where: { id: saleId, pharmacyId: req.user.pharmacyId },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      if (existing.status !== "COMPLETED") {
        throw new Error("INVALID_STATUS");
      }

      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.sale.update({
        where: { id: existing.id },
        data: { status: "CANCELLED" },
      });
    });

    res.json(sale);
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Satis bulunamadi" });
    }
    if (error.message === "INVALID_STATUS") {
      return res.status(400).json({ message: "Satis zaten iptal/refund" });
    }
    console.error(error);
    res.status(500).json({ message: "Satis iptal edilemedi" });
  }
});

router.post("/:id/refund", async (req, res) => {
  const saleId = Number(req.params.id);
  if (!saleId) {
    return res.status(400).json({ message: "Gecersiz satis" });
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findFirst({
        where: { id: saleId, pharmacyId: req.user.pharmacyId },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      if (existing.status !== "COMPLETED") {
        throw new Error("INVALID_STATUS");
      }

      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.sale.update({
        where: { id: existing.id },
        data: { status: "REFUNDED" },
      });
    });

    res.json(sale);
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Satis bulunamadi" });
    }
    if (error.message === "INVALID_STATUS") {
      return res.status(400).json({ message: "Satis zaten iptal/refund" });
    }
    console.error(error);
    res.status(500).json({ message: "Iade islemi basarisiz" });
  }
});

router.delete("/:id", requirePharmacist, async (req, res) => {
  const saleId = Number(req.params.id);
  if (!saleId) {
    return res.status(400).json({ message: "Gecersiz satis" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, pharmacyId: req.user.pharmacyId },
        include: { items: true },
      });

      if (!sale) {
        throw new Error("NOT_FOUND");
      }

      if (sale.status === "COMPLETED") {
        for (const item of sale.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.sale.delete({ where: { id: sale.id } });
    });

    res.json({ message: "Satis silindi" });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Satis bulunamadi" });
    }
    console.error(error);
    res.status(500).json({ message: "Satis silinemedi" });
  }
});

router.post("/daily-summary/secure", requirePharmacist, async (req, res) => {
  const { password, date } = req.body;
  const { start, end } = buildDailyRange(date);

  if (!password) {
    return res.status(400).json({ message: "Parola gerekli" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.userId, pharmacyId: req.user.pharmacyId },
    });

    if (!user) {
      return res.status(404).json({ message: "Kullanici bulunamadi" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Parola hatali" });
    }

    const sales = await prisma.sale.findMany({
      where: {
        pharmacyId: req.user.pharmacyId,
        status: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    res.json({
      date: start.toISOString(),
      totalSales: sales.length,
      totalRevenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gunluk ozet getirilemedi" });
  }
});

router.get("/daily-summary", (req, res) => {
  res.status(403).json({ message: "Parola gerekli" });
});

export default router;
