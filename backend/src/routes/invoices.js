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

function buildPdfBuffer(invoice) {
  const text = `Fatura ${invoice.invoiceNo} - Tutar ${Number(invoice.sale?.total || 0).toFixed(2)} TRY`;
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
    const invoices = await prisma.invoice.findMany({
      where: { pharmacyId: req.user.pharmacyId },
      include: {
        sale: { select: { id: true, total: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Faturalar getirilemedi" });
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
      return res.status(400).json({ message: "Sadece tamamlanan satislar faturalandir" });
    }

    const invoiceNo = `EINV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${sale.id}`;

    const invoice = await prisma.invoice.create({
      data: {
        saleId: sale.id,
        pharmacyId: req.user.pharmacyId,
        invoiceNo,
        status: "SENT",
        pdfUrl: null,
      },
    });

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl: `/invoices/${invoice.id}/pdf` },
    });

    res.status(201).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fatura olusturulamadi" });
  }
});

router.get("/:id", requirePharmacist, async (req, res) => {
  const invoiceId = Number(req.params.id);
  if (!invoiceId) {
    return res.status(400).json({ message: "Gecersiz fatura" });
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, pharmacyId: req.user.pharmacyId },
      include: {
        sale: {
          include: {
            items: { include: { product: { select: { name: true } } } },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Fatura bulunamadi" });
    }

    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fatura getirilemedi" });
  }
});

router.get("/:id/pdf", requirePharmacist, async (req, res) => {
  const invoiceId = Number(req.params.id);
  if (!invoiceId) {
    return res.status(400).json({ message: "Gecersiz fatura" });
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, pharmacyId: req.user.pharmacyId },
      include: { sale: true },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Fatura bulunamadi" });
    }

    const pdfBuffer = buildPdfBuffer(invoice);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=\"${invoice.invoiceNo}.pdf\"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "PDF olusturulamadi" });
  }
});

export default router;
