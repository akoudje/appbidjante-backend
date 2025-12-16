// src/services/pdfGenerator.js
import fs from "fs";
import path from "path";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Génère un reçu PDF (Buffer)
 * ⚠️ Ne doit JAMAIS throw vers le controller
 */
export async function generateReceiptPDF({
  paiement,
  cotisation,
  membre,
  soldeRestant = 0,
}) {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    /* =====================
       HELPERS
    ===================== */

    const formatDate = (date) =>
      new Date(date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

    const safeAddImage = (filePath, x, y, w, h) => {
      try {
        if (fs.existsSync(filePath)) {
          const img = fs.readFileSync(filePath, { encoding: "base64" });
          doc.addImage(img, "PNG", x, y, w, h);
        }
      } catch (err) {
        console.warn("⚠️ Image ignorée:", filePath);
      }
    };

    /* =====================
       ASSETS (BACKEND SAFE)
    ===================== */

    const assetsDir = path.join(process.cwd(), "public", "assets", "pdf");

    const logoPath = path.join(assetsDir, "logo-bidjante.png");
    const signaturePath = path.join(assetsDir, "signature-notable.png");
    const tamponPath = path.join(assetsDir, "tampon-bidjante.png");

    /* =====================
       HEADER
    ===================== */

    let y = 15;

    safeAddImage(logoPath, margin, y, 25, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("REÇU DE PAIEMENT", pageWidth / 2, y + 15, {
      align: "center",
    });

    y += 40;

    /* =====================
       INFOS MEMBRE
    ===================== */

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(`Membre : ${membre.nom} ${membre.prenoms}`, margin, y);
    doc.text(`Date : ${formatDate(paiement.date)}`, margin, y + 7);
    doc.text(`Mode de paiement : ${paiement.mode}`, margin, y + 14);

    y += 25;

    /* =====================
       TABLE PAIEMENT
    ===================== */

    autoTable(doc, {
      startY: y,
      head: [["Motif", "Montant"]],
      body: [
        [
          cotisation.motif || "Contribution",
          `${paiement.montant.toLocaleString()} FCFA`,
        ],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [28, 76, 139] },
    });

    y = doc.lastAutoTable.finalY + 15;

    /* =====================
       TOTAL / SOLDE
    ===================== */

    doc.setFont("helvetica", "bold");
    doc.text("MONTANT PAYÉ :", margin, y);
    doc.text(
      `${paiement.montant.toLocaleString()} FCFA`,
      pageWidth - margin,
      y,
      { align: "right" }
    );

    if (soldeRestant > 0) {
      y += 10;
      doc.text("SOLDE RESTANT :", margin, y);
      doc.text(
        `${soldeRestant.toLocaleString()} FCFA`,
        pageWidth - margin,
        y,
        { align: "right" }
      );
    }

    y += 25;

    doc.text(
      "Le notable chargé des contributions",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    safeAddImage(signaturePath, pageWidth / 2 - 30, y + 5, 60, 25);
    safeAddImage(tamponPath, pageWidth - margin - 35, y - 10, 35, 35);

    /* =====================
       EXPORT BUFFER
    ===================== */

    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    console.error("❌ generateReceiptPDF failed:", error);
    // ⚠️ On retourne un PDF minimal pour ne JAMAIS bloquer
    const fallback = new jsPDF();
    fallback.text("Reçu de paiement indisponible", 20, 20);
    return Buffer.from(fallback.output("arraybuffer"));
  }
}
