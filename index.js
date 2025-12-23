import express from "express";
import cors from "cors";
import dotenv from "dotenv";


import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("PharmaMB backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
