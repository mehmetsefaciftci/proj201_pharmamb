import express from "express";
import prisma from "../lib/prisma.js";


const router = express.Router();

/**
 * CREATE product (this pharmacy only)
 */
router.post("/", async (req, res) => {
  try {
    const { barcode, name, price, stock, expiryDate } = req.body;

    const product = await prisma.product.create({
      data: {
        barcode,
        name,
        price: Number(price),
        stock: Number(stock),
        expiryDate: new Date(expiryDate),
        pharmacyId: req.user.pharmacyId,
      },
    });

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * LIST products (this pharmacy only)
 */
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        pharmacy: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});


export default router;
