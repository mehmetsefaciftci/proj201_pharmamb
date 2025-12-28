import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

function requirePharmacist(req, res, next) {
  if (req.user.role !== "PHARMACIST") {
    return res.status(403).json({ message: "Yetkisiz islem" });
  }
  return next();
}

function escapePdfText(value) {
  return String(value).replace(/[()\\]/g, "\\$&");
}

function buildPdfBuffer(efatura) {
  const text = `E-Fatura ${efatura.invoiceNo} - Tutar ${Number(
    efatura.sale?.total || 0
  ).toFixed(2)} TRY`;
  const stream = `BT\n/F1 16 Tf\n50 100 Td\n(${escapePdfText(text)}) Tj\nET`;

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj",
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
  ];

  let offset = 0;
  const chunks = [];

  const header = "%PDF-1.4\n";
  chunks.push(header);
  offset += Buffer.byteLength(header);

  const xrefOffsets = [0];
  objects.forEach((obj) => {
    xrefOffsets.push(offset);
    chunks.push(`${obj}\n`);
    offset += Buffer.byteLength(`${obj}\n`);
  });

  const xrefStart = offset;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i < xrefOffsets.length; i += 1) {
    xref += `${String(xrefOffsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  chunks.push(xref);

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  chunks.push(trailer);

  return Buffer.from(chunks.join(""));
}

router.get("/", requirePharmacist, async (req, res) => {
  try {
    const efaturas = await prisma.efatura.findMany({
      where: { pharmacyId: req.user.pharmacyId },
      include: {
        sale: { select: { id: true, total: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(efaturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "E-faturalar getirilemedi" });
  }
});

router.post("/", requirePharmacist, async (req, res) => {
  const { saleId } = req.body;
  const parsedSaleId = Number(saleId);
  if (!parsedSaleId) {
    return res.status(400).json({ message: "Satis secilmedi" });
  }

  try {
    const sale = await prisma.sale.findFirst({
      where: { id: parsedSaleId, pharmacyId: req.user.pharmacyId },
    });

    if (!sale) {
      return res.status(404).json({ message: "Satis bulunamadi" });
    }

    if (sale.status !== "COMPLETED") {
      return res.status(400).json({ message: "Sadece tamamlanan satislar faturalanir" });
    }

    const invoiceNo = `EFAT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${sale.id}`;

    const efatura = await prisma.efatura.create({
      data: {
        saleId: sale.id,
        pharmacyId: req.user.pharmacyId,
        invoiceNo,
        status: "DRAFT",
        pdfUrl: null,
      },
    });

    const updated = await prisma.efatura.update({
      where: { id: efatura.id },
      data: { pdfUrl: `/efatura/${efatura.id}/pdf`, status: "SENT" },
    });

    res.status(201).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "E-fatura olusturulamadi" });
  }
});

router.get("/:id", requirePharmacist, async (req, res) => {
  const efaturaId = Number(req.params.id);
  if (!efaturaId) {
    return res.status(400).json({ message: "Gecersiz e-fatura" });
  }

  try {
    const efatura = await prisma.efatura.findFirst({
      where: { id: efaturaId, pharmacyId: req.user.pharmacyId },
      include: {
        sale: {
          include: {
            items: { include: { product: { select: { name: true } } } },
          },
        },
      },
    });

    if (!efatura) {
      return res.status(404).json({ message: "E-fatura bulunamadi" });
    }

    res.json(efatura);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "E-fatura getirilemedi" });
  }
});

router.get("/:id/pdf", requirePharmacist, async (req, res) => {
  const efaturaId = Number(req.params.id);
  if (!efaturaId) {
    return res.status(400).json({ message: "Gecersiz e-fatura" });
  }

  try {
    const efatura = await prisma.efatura.findFirst({
      where: { id: efaturaId, pharmacyId: req.user.pharmacyId },
      include: { sale: true },
    });

    if (!efatura) {
      return res.status(404).json({ message: "E-fatura bulunamadi" });
    }

    const pdfBuffer = buildPdfBuffer(efatura);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=\"${efatura.invoiceNo}.pdf\"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "PDF olusturulamadi" });
  }
});

export default router;
