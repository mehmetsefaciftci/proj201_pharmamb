import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { barcode, name, price, stock, expiryDate, lowStockThreshold } = req.body;

    if (!barcode || !name) {
      return res.status(400).json({ message: "Barkod ve isim zorunlu" });
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock ?? 0);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Gecersiz fiyat" });
    }

    const parsedThreshold = Number(lowStockThreshold);
    const safeThreshold = Number.isNaN(parsedThreshold) ? 5 : parsedThreshold;

    const product = await prisma.product.create({
      data: {
        barcode,
        name,
        price: parsedPrice,
        stock: parsedStock,
        lowStockThreshold: safeThreshold,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        pharmacyId: req.user.pharmacyId,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        pharmacyId: req.user.pharmacyId,
      },
      orderBy: {
        id: "desc",
      },
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Urunler getirilemedi" });
  }
});

export default router;
