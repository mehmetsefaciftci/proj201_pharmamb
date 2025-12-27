import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

function requirePharmacist(req, res, next) {
  if (req.user.role !== "PHARMACIST") {
    return res.status(403).json({ message: "Yetkisiz islem" });
  }
  return next();
}

router.get("/status", requirePharmacist, async (req, res) => {
  try {
    const open = await prisma.cashRegister.findFirst({
      where: {
        pharmacyId: req.user.pharmacyId,
        status: "OPEN",
      },
      orderBy: { openedAt: "desc" },
    });
    res.json({ open });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kasa durumu getirilemedi" });
  }
});

router.post("/open", requirePharmacist, async (req, res) => {
  const { openingCash } = req.body;
  const parsedCash = Number(openingCash);
  if (Number.isNaN(parsedCash) || parsedCash < 0) {
    return res.status(400).json({ message: "Gecersiz acilis tutari" });
  }

  try {
    const existing = await prisma.cashRegister.findFirst({
      where: { pharmacyId: req.user.pharmacyId, status: "OPEN" },
    });

    if (existing) {
      return res.status(400).json({ message: "Kasa zaten acik" });
    }

    const register = await prisma.cashRegister.create({
      data: {
        openingCash: parsedCash,
        pharmacyId: req.user.pharmacyId,
        openedById: req.user.userId,
      },
    });

    res.status(201).json(register);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kasa acilamadi" });
  }
});

router.post("/close", requirePharmacist, async (req, res) => {
  const { closingCash } = req.body;
  const parsedCash = Number(closingCash);
  if (Number.isNaN(parsedCash) || parsedCash < 0) {
    return res.status(400).json({ message: "Gecersiz kapanis tutari" });
  }

  try {
    const existing = await prisma.cashRegister.findFirst({
      where: { pharmacyId: req.user.pharmacyId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    if (!existing) {
      return res.status(400).json({ message: "Acik kasa bulunamadi" });
    }

    const register = await prisma.cashRegister.update({
      where: { id: existing.id },
      data: {
        status: "CLOSED",
        closingCash: parsedCash,
        closedAt: new Date(),
      },
    });

    res.json(register);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kasa kapanmadi" });
  }
});

export default router;
