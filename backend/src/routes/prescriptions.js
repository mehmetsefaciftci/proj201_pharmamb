import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { pharmacyId: req.user.pharmacyId },
      orderBy: { createdAt: "desc" },
    });
    res.json(prescriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Receteler getirilemedi" });
  }
});

router.post("/lookup", async (req, res) => {
  const { patientTc, prescriptionNo } = req.body;
  const safeTc = patientTc ? String(patientTc).trim() : "";
  const safeNo = prescriptionNo ? String(prescriptionNo).trim() : "";

  if (!safeTc || !safeNo) {
    return res.status(400).json({ message: "TC ve recete no gerekli" });
  }

  try {
    let prescription = await prisma.prescription.findFirst({
      where: {
        pharmacyId: req.user.pharmacyId,
        patientTc: safeTc,
        prescriptionNo: safeNo,
      },
    });

    if (!prescription) {
      prescription = await prisma.prescription.create({
        data: {
          patientTc: safeTc,
          prescriptionNo: safeNo,
          status: "VERIFIED",
          pharmacyId: req.user.pharmacyId,
          createdById: req.user.userId,
        },
      });
    }

    return res.json(prescription);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Recete sorgulanamadi" });
  }
});

export default router;
