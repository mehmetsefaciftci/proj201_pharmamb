import express from "express";
import prisma from "../backend/lib/prisma.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * CREATE product (this pharmacy only)
 */
router.post("/", auth, async (req, res) => {
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
router.get("/", auth, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { pharmacyId: req.user.pharmacyId },
      orderBy: { name: "asc" },
    });

    res.json(products);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
