import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js"; // 👈 EKLENDİ

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/sales", salesRoutes); // 👈 EKLENDİ

// Health check
app.get("/", (req, res) => {
  res.send("PharmaMB backend is running");
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
