// src/controllers/paiements.controller.js
import prisma from "../prisma.js";
import { generateReceiptPDF } from "../services/pdfGenerator.js";
import { sendReceiptEmail } from "../services/sendReceiptEmail.js";

/**
 * 📌 Récupérer les paiements d’une cotisation
 * GET /api/cotisations/:id/paiements
 */
export async function getPaiementsForCotisation(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const list = await prisma.paiement.findMany({
      where: { cotisationId: id },
      orderBy: { date: "desc" },
    });

    res.json(list);
  } catch (error) {
    console.error("Erreur getPaiementsForCotisation :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * 📌 Journal global des paiements
 * GET /api/paiements
 */
export async function getAllPaiements(req, res) {
  try {
    const list = await prisma.paiement.findMany({
      include: {
        cotisation: {
          include: {
            membre: {
              include: {
                lignee: { include: { famille: true } },
                categorie: true,
              },
            },
            deces: {
              include: {
                membre: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const shaped = list.map((p) => ({
      ...p,
      membre: p.cotisation?.membre || null,
    }));

    res.json(shaped);
  } catch (error) {
    console.error("Erreur getAllPaiements :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * 📌 Ajouter un paiement
 * POST /api/paiements
 * POST /api/cotisations/:id/paiements
 */
export async function addPaiement(req, res) {
  try {
    const cotisationIdParam = req.params.id;
    const { cotisationId, montant, date, mode } = req.body;

    const finalCotisationId = Number(cotisationIdParam || cotisationId);
    const montantNum = Number(montant);

    if (!finalCotisationId || Number.isNaN(finalCotisationId)) {
      return res.status(400).json({ error: "cotisationId invalide" });
    }

    if (!montantNum || montantNum <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    // 1️⃣ Charger cotisation
    const cotisation = await prisma.cotisation.findUnique({
      where: { id: finalCotisationId },
      include: { membre: true, paiements: true },
    });

    if (!cotisation) {
      return res.status(404).json({ error: "Cotisation introuvable" });
    }

    // 2️⃣ Créer paiement
    const paiement = await prisma.paiement.create({
      data: {
        cotisationId: finalCotisationId,
        montant: montantNum,
        date: date ? new Date(date) : new Date(),
        mode: mode || "Espèces",
      },
    });

    // 3️⃣ Recharger cotisation mise à jour
    const cotisationUpdated = await prisma.cotisation.findUnique({
      where: { id: finalCotisationId },
      include: { membre: true, paiements: true },
    });

    const totalPaye = cotisationUpdated.paiements.reduce(
      (s, p) => s + p.montant,
      0
    );

    const soldeRestant = cotisationUpdated.montant - totalPaye;

    // 4️⃣ Mettre à jour statut
    await prisma.cotisation.update({
      where: { id: finalCotisationId },
      data: {
        statutCotisation:
          totalPaye >= cotisationUpdated.montant ? "Payé" : "Impayé",
        paidAt: totalPaye >= cotisationUpdated.montant ? new Date() : null,
      },
    });

    // 5️⃣ Générer PDF + email (NON BLOQUANT)
    let emailSent = false;

    try {
      const pdfBuffer = await generateReceiptPDF({
        paiement,
        cotisation,
        membre: cotisation.membre,
        soldeRestant,
      });

      if (cotisation.membre?.email) {
        await sendReceiptEmail({
          email: cotisation.membre.email,
          nom: `${cotisation.membre.nom} ${cotisation.membre.prenoms}`,
          montant: montantNum,
          soldeRestant,
          pdfBuffer,
        });
        emailSent = true;
      }
    } catch (err) {
      console.error("⚠️ PDF / Email error (non bloquant):", err);
    }

    res.status(201).json({
      success: true,
      paiement,
      soldeRestant,
      emailSent,
    });
  } catch (error) {
    console.error("Erreur addPaiement :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * 📌 Paiements batch (sans PDF / email)
 */
export async function addPaiementBatch(req, res) {
  try {
    const { cotisationIds, montant, date, mode } = req.body;

    if (!Array.isArray(cotisationIds) || cotisationIds.length === 0) {
      return res.status(400).json({ error: "cotisationIds invalide" });
    }

    const montantNum = Number(montant);
    if (!montantNum || montantNum <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    const paiementDate = date ? new Date(date) : new Date();
    const results = [];

    for (const id of cotisationIds) {
      const cot = await prisma.cotisation.findUnique({
        where: { id: Number(id) },
      });
      if (!cot) continue;

      const paiement = await prisma.paiement.create({
        data: {
          cotisationId: Number(id),
          montant: montantNum,
          date: paiementDate,
          mode: mode || "Espèces",
        },
      });

      results.push(paiement);
    }

    res.status(201).json({
      success: true,
      count: results.length,
      paiements: results,
    });
  } catch (error) {
    console.error("Erreur addPaiementBatch :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * 📄 Télécharger le reçu PDF
 * GET /api/paiements/:id/receipt
 */
export async function getPaiementReceipt(req, res) {
  const paiementId = Number(req.params.id);

  const paiement = await prisma.paiement.findUnique({
    where: { id: paiementId },
    include: {
      cotisation: {
        include: {
          membre: {
            include: {
              lignee: { include: { famille: true } },
              categorie: true,
            },
          },
          paiements: true,
        },
      },
    },
  });

  if (!paiement) {
    return res.status(404).json({ error: "Paiement introuvable" });
  }

  const cotisation = paiement.cotisation;
  const totalPaye = cotisation.paiements.reduce((s, p) => s + p.montant, 0);
  const soldeRestant = cotisation.montant - totalPaye;

  const pdf = await generateReceiptPDF({
    paiement,
    cotisation,
    membre: cotisation.membre,
    soldeRestant,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=recu.pdf");
  res.end(pdf);
}

/**
 * 📧 Envoyer le reçu PDF par email
 * POST /api/paiements/:id/send-receipt
 */
export async function sendPaiementReceipt(req, res) {
  const paiementId = Number(req.params.id);

  const paiement = await prisma.paiement.findUnique({
    where: { id: paiementId },
    include: {
      cotisation: {
        include: {
          membre: true,
          paiements: true,
        },
      },
    },
  });

  if (!paiement || !paiement.cotisation?.membre?.email) {
    return res.status(400).json({ error: "Email indisponible" });
  }

  const cotisation = paiement.cotisation;
  const totalPaye = cotisation.paiements.reduce((s, p) => s + p.montant, 0);
  const soldeRestant = cotisation.montant - totalPaye;

  const pdf = await generateReceiptPDF({
    paiement,
    cotisation,
    membre: cotisation.membre,
    soldeRestant,
  });

  await sendReceiptEmail({
    email: cotisation.membre.email,
    nom: `${cotisation.membre.nom} ${cotisation.membre.prenoms}`,
    montant: paiement.montant,
    soldeRestant,
    pdfBuffer: pdf,
  });

  res.json({ success: true });
}
