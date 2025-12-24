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
        city,
      },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
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
    const token = jwt.sign(
      {
        userId: 0,
        role: "OWNER",
        pharmacyId: 0,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: 0,
        name: "Demo Admin",
        email: demoEmail,
        role: "OWNER",
        pharmacyId: 0,
        pharmacyName: "Demo Eczane",
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
