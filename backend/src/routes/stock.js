import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { pharmacyId: req.user.pharmacyId },
      orderBy: { id: "desc" },
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Stok bilgisi getirilemedi" });
  }
});

router.post("/entry", async (req, res) => {
  const { productId, barcode, quantity } = req.body;
  const parsedQty = Number(quantity);

  if (!parsedQty || parsedQty <= 0) {
    return res.status(400).json({ message: "Gecersiz miktar" });
  }

  if (!productId && !barcode) {
    return res.status(400).json({ message: "Urun secilmedi" });
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        pharmacyId: req.user.pharmacyId,
        ...(productId ? { id: Number(productId) } : { barcode: String(barcode) }),
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Urun bulunamadi" });
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { stock: { increment: parsedQty } },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Stok girisi basarisiz" });
  }
});

router.get("/low", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { pharmacyId: req.user.pharmacyId },
      orderBy: { stock: "asc" },
    });
    res.json(products.filter((product) => product.stock <= product.lowStockThreshold));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kritik stok listesi alinmadi" });
  }
});

router.get("/expiry", async (req, res) => {
  const days = Number(req.query.days || 45);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  try {
    const products = await prisma.product.findMany({
      where: {
        pharmacyId: req.user.pharmacyId,
        expiryDate: { not: null, lte: cutoff },
      },
      orderBy: { expiryDate: "asc" },
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "SKT listesi alinmadi" });
  }
});

export default router;
