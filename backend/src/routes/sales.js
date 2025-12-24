import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { productId, quantity } = req.body;
  const parsedProductId = Number(productId);
  const parsedQuantity = Number(quantity);

  if (!parsedProductId || !parsedQuantity || parsedQuantity <= 0) {
    return res.status(400).json({ message: "Gecersiz giris" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: parsedProductId, pharmacyId: req.user.pharmacyId },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (product.stock < parsedQuantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: product.stock - parsedQuantity,
        },
      });

      const sale = await tx.sale.create({
        data: {
          productId: product.id,
          quantity: parsedQuantity,
          unitPrice: product.price,
        },
      });

      return sale;
    });

    res.status(201).json({
      message: "Satis tamamlandi",
      sale: result,
    });
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
      where: {
        product: {
          pharmacyId: req.user.pharmacyId,
        },
      },
      include: {
        product: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        saleDate: "desc",
      },
    });

    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Satislar getirilemedi" });
  }
});

export default router;
