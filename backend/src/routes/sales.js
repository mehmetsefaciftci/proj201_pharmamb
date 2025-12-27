import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { items, paymentType } = req.body;
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

  try {
    const allowedPaymentTypes = ["CASH", "CARD", "OTHER"];
    const safePaymentType = allowedPaymentTypes.includes(paymentType)
      ? paymentType
      : "CASH";

    const sale = await prisma.$transaction(async (tx) => {
      const saleItemsData = [];
      let total = 0;

      for (const item of normalizedItems) {
        const product = await tx.product.findFirst({
          where: {
            pharmacyId: req.user.pharmacyId,
            ...(item.productId ? { id: item.productId } : { barcode: item.barcode }),
          },
        });

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
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
    console.error(error);
    res.status(500).json({ message: "Sunucu hatasi" });
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

router.get("/daily-summary", async (req, res) => {
  const dateParam = req.query.date;
  const start = dateParam ? new Date(dateParam) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  try {
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

export default router;
