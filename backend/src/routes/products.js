import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { barcode, qrCode, name, price, stock, expiryDate, lowStockThreshold, productType } =
      req.body;

    const safeBarcode = barcode ? String(barcode).trim() : "";
    const safeQrCode = qrCode ? String(qrCode).trim() : "";

    if (!safeBarcode || !name || !safeQrCode) {
      return res.status(400).json({ message: "Barkod, karekod ve isim zorunlu" });
    }

    if (safeBarcode === safeQrCode) {
      return res.status(400).json({ message: "Barkod ve karekod farkli olmali" });
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock ?? 0);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Gecersiz fiyat" });
    }

    const parsedThreshold = Number(lowStockThreshold);
    const safeThreshold = Number.isNaN(parsedThreshold) ? 5 : parsedThreshold;

    const allowedTypes = ["GENERAL", "ANTIBIOTIC"];
    const safeType = allowedTypes.includes(productType) ? productType : "GENERAL";

    const product = await prisma.product.create({
      data: {
        barcode: safeBarcode,
        qrCode: safeQrCode,
        name,
        price: parsedPrice,
        stock: parsedStock,
        lowStockThreshold: safeThreshold,
        productType: safeType,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        pharmacyId: req.user.pharmacyId,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "Barkod veya karekod zaten kayitli" });
    }
    res.status(400).json({ error: err.message });
  }
});

router.get("/lookup", async (req, res) => {
  const code = String(req.query.code || "").trim();
  if (!code) {
    return res.status(400).json({ message: "Kod gerekli" });
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        pharmacyId: req.user.pharmacyId,
        OR: [{ barcode: code }, { qrCode: code }],
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Urun bulunamadi" });
    }

    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Urun arama basarisiz" });
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
