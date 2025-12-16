// src/controllers/bilan.controller.js
import prisma from "../prisma.js";


/**
 * Bilan annuel
 */
export async function getBilanAnnuel(req, res) {
  try {
    const { year } = req.params;
    const y = Number(year);

    if (isNaN(y))
      return res.status(400).json({ error: "Année invalide" });

    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59));

    // --- 1) Comptage décès ---
    const deces = await prisma.deces.count({
      where: {
        dateDeces: { gte: start, lte: end },
      },
    });

    // --- 2) Cotisations ---
    const cots = await prisma.cotisation.findMany({
      where: {
        date: { gte: start, lte: end },
      },
      include: { paiements: true },
    });

    let totalDu = 0;
    let totalPaye = 0;

    const monthly = Array(12).fill(0);

    cots.forEach((c) => {
      const montant = Number(c.montant) || 0;
      const date = c.date ? new Date(c.date) : null;

      // Sécuriser le mois (0 à 11)
      if (date instanceof Date && !isNaN(date)) {
        const m = date.getMonth();
        if (m >= 0 && m <= 11) {
          monthly[m] += montant;
        }
      }

      totalDu += montant;

      const paye = c.paiements?.reduce(
        (s, p) => s + (Number(p.montant) || 0),
        0
      ) || 0;

      totalPaye += paye;
    });

    return res.json({
      annee: y,
      deces,
      totalCotisations: totalDu,
      totalPaiements: totalPaye,
      totalImpayes: totalDu - totalPaye,
      monthly,
    });

  } catch (err) {
    console.error("getBilanAnnuel ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur interne" });
  }
}

