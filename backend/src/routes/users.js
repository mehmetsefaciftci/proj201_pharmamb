import express from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";

const router = express.Router();

function requirePharmacist(req, res, next) {
  if (req.user.role !== "PHARMACIST") {
    return res.status(403).json({ message: "Yetkisiz islem" });
  }
  return next();
}

router.get("/", requirePharmacist, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { pharmacyId: req.user.pharmacyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kullanicilar getirilemedi" });
  }
});

router.post("/", requirePharmacist, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Eksik bilgi" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role === "PHARMACIST" ? "PHARMACIST" : "STAFF",
        pharmacyId: req.user.pharmacyId,
      },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Kullanici olusturulamadi" });
  }
});

router.patch("/:id", requirePharmacist, async (req, res) => {
  const userId = Number(req.params.id);
  const { role, isActive, name } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Gecersiz kullanici" });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { id: userId, pharmacyId: req.user.pharmacyId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Kullanici bulunamadi" });
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: role ? (role === "PHARMACIST" ? "PHARMACIST" : "STAFF") : undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        name: name || undefined,
      },
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Kullanici guncellenemedi" });
  }
});

router.delete("/:id", requirePharmacist, async (req, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ message: "Gecersiz kullanici" });
  }

  if (userId === req.user.userId) {
    return res.status(400).json({ message: "Kendi hesabinizi silemezsiniz" });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { id: userId, pharmacyId: req.user.pharmacyId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Kullanici bulunamadi" });
    }

    if (existing.role === "PHARMACIST") {
      const pharmacistCount = await prisma.user.count({
        where: { pharmacyId: req.user.pharmacyId, role: "PHARMACIST" },
      });
      if (pharmacistCount <= 1) {
        return res.status(400).json({ message: "Son eczaci silinemez" });
      }
    }

    await prisma.user.delete({ where: { id: existing.id } });
    return res.json({ message: "Kullanici silindi" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Kullanici silinemedi" });
  }
});

export default router;
