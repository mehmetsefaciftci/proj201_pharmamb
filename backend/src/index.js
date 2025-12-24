import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";
import ordersRoutes from "./routes/orders.js";
import auth from "./middleware/auth.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/products", auth, productRoutes);
app.use("/sales", auth, salesRoutes);
app.use("/orders", auth, ordersRoutes);

app.get("/", (req, res) => {
  res.send("PharmaMB backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
