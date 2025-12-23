import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../backend/lib/prisma.js";

const router = express.Router();

// REGISTER
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

    res.json({ message: "User created", userId: user.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Wrong password" });
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

  res.json({ token });
});

export default router;
