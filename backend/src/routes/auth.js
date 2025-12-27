import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password, role, pharmacyName, city } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const pharmacy = await prisma.pharmacy.create({
      data: {
        name: pharmacyName,
        city: city || null,
      },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: role === "PHARMACIST" ? "PHARMACIST" : "STAFF",
        pharmacyId: pharmacy.id,
      },
    });

    res.json({ message: "Kullanici olusturuldu", userId: user.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const demoEmail = process.env.DEMO_ADMIN_EMAIL || "admin@pharmamb.local";
  const demoPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin123!";

  if (email === demoEmail && password === demoPassword) {
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    let demoUser = await prisma.user.findUnique({
      where: { email: demoEmail },
      include: { pharmacy: true },
    });

    if (!demoUser) {
      let demoPharmacy = await prisma.pharmacy.findFirst({
        where: { name: "Demo Eczane", city: "Istanbul" },
      });

      if (!demoPharmacy) {
        demoPharmacy = await prisma.pharmacy.create({
          data: { name: "Demo Eczane", city: "Istanbul" },
        });
      }

      demoUser = await prisma.user.create({
        data: {
          name: "Demo Admin",
          email: demoEmail,
          passwordHash: hashedPassword,
          role: "PHARMACIST",
          pharmacyId: demoPharmacy.id,
        },
        include: { pharmacy: true },
      });
    }

    const token = jwt.sign(
      {
        userId: demoUser.id,
        role: demoUser.role,
        pharmacyId: demoUser.pharmacyId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoEmail,
        role: demoUser.role,
        pharmacyId: demoUser.pharmacyId,
        pharmacyName: demoUser.pharmacy?.name,
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { pharmacy: true },
  });

  if (!user) {
    return res.status(404).json({ error: "Kullanici bulunamadi" });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "Hesap pasif" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Sifre hatali" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      pharmacyId: user.pharmacyId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      pharmacyId: user.pharmacyId,
      pharmacyName: user.pharmacy?.name,
    },
  });
});

export default router;
