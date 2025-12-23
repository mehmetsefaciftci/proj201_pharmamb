import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

/**
 * POST /sales
 * body: { productId, quantity }
 */
router.post("/", async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ürünü bul
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      // 2. Stok kontrolü
      if (product.stock < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // 3. Stok düş
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: product.stock - quantity,
        },
      });

      // 4. Sale kaydı oluştur
      const sale = await tx.sale.create({
        data: {
          productId: product.id,
          quantity: quantity,
          unitPrice: product.price,
        },
      });

      return sale;
    });

    res.status(201).json({
      message: "Sale completed successfully",
      sale: result,
    });
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Product not found" });
    }

    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /sales
 * Returns all sales with product info
 */
router.get("/", async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
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
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});


export default router;
