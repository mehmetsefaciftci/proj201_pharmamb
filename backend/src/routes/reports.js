import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

function requirePharmacist(req, res, next) {
  if (req.user.role !== "PHARMACIST") {
    return res.status(403).json({ message: "Yetkisiz islem" });
  }
  return next();
}

router.get("/revenue/daily", requirePharmacist, async (req, res) => {
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
    const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    res.json({ date: start.toISOString(), total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gunluk ciro getirilemedi" });
  }
});

router.get("/revenue/monthly", requirePharmacist, async (req, res) => {
  const monthParam = req.query.month;
  const base = monthParam ? new Date(`${monthParam}-01`) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);

  try {
    const sales = await prisma.sale.findMany({
      where: {
        pharmacyId: req.user.pharmacyId,
        status: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
    });
    const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    res.json({ month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Aylik ciro getirilemedi" });
  }
});

router.get("/top-products", requirePharmacist, async (req, res) => {
  const limit = Number(req.query.limit || 10);

  try {
    const items = await prisma.saleItem.findMany({
      where: {
        sale: {
          pharmacyId: req.user.pharmacyId,
          status: "COMPLETED",
        },
      },
      include: { product: { select: { name: true } } },
    });

    const counter = new Map();
    items.forEach((item) => {
      const name = item.product?.name || "Bilinmeyen";
      counter.set(name, (counter.get(name) || 0) + item.quantity);
    });

    const results = Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, quantity]) => ({ name, quantity }));

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "En cok satilanlar getirilemedi" });
  }
});

router.get("/low-stock", requirePharmacist, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { pharmacyId: req.user.pharmacyId },
    });
    res.json(products.filter((product) => product.stock <= product.lowStockThreshold));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kritik stok listesi getirilemedi" });
  }
});

export default router;
