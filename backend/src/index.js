import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";
import usersRoutes from "./routes/users.js";
import stockRoutes from "./routes/stock.js";
import cashRoutes from "./routes/cash.js";
import invoiceRoutes from "./routes/invoices.js";
import efaturaRoutes from "./routes/efatura.js";
import reportRoutes from "./routes/reports.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import integrationRoutes from "./routes/integrations.js";
import auth from "./middleware/auth.js";
import prisma from "./lib/prisma.js";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/products", auth, productRoutes);
app.use("/sales", auth, salesRoutes);
app.use("/users", auth, usersRoutes);
app.use("/stock", auth, stockRoutes);
app.use("/cash", auth, cashRoutes);
app.use("/invoices", auth, invoiceRoutes);
app.use("/efatura", auth, efaturaRoutes);
app.use("/reports", auth, reportRoutes);
app.use("/prescriptions", auth, prescriptionRoutes);
app.use("/integrations", auth, integrationRoutes);

app.get("/", (req, res) => {
  res.send("PharmaMB backend is running");
});

async function ensureDemoUser() {
  const demoEmail = process.env.DEMO_ADMIN_EMAIL || "admin@pharmamb.local";
  const demoPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin123!";
  const demoPharmacyName = process.env.DEMO_PHARMACY_NAME || "Demo Eczane";
  const demoCity = process.env.DEMO_PHARMACY_CITY || "Istanbul";

  const existing = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existing) return;

  const passwordHash = await bcrypt.hash(demoPassword, 10);
  let pharmacy = await prisma.pharmacy.findFirst({
    where: { name: demoPharmacyName, city: demoCity },
  });

  if (!pharmacy) {
    pharmacy = await prisma.pharmacy.create({
      data: { name: demoPharmacyName, city: demoCity },
    });
  }

  await prisma.user.create({
    data: {
      name: "Demo Admin",
      email: demoEmail,
      passwordHash,
      role: "PHARMACIST",
      pharmacyId: pharmacy.id,
    },
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await ensureDemoUser();
  } catch (error) {
    console.error("Demo user seed failed", error);
  }
  console.log(`Server running on port ${PORT}`);
});
