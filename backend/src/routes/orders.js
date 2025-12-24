import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { supplierName, expectedAt, items, total, notes } = req.body;

    if (!supplierName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Eksik siparis bilgisi" });
    }

    const order = await prisma.purchaseOrder.create({
      data: {
        supplierName,
        expectedAt: expectedAt ? new Date(expectedAt) : null,
        total: total !== null && total !== undefined ? Number(total) : null,
        items,
        notes: notes || null,
        pharmacyId: req.user.pharmacyId,
        status: "DRAFT",
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Siparis olusturulamadi" });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        pharmacyId: req.user.pharmacyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Siparisler getirilemedi" });
  }
});

export default router;
