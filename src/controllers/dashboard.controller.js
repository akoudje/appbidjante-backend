// src/controllers/dashboard.controller.js

import prisma from "../prisma.js";

export async function getDashboardStats(req, res) {
  try {
    // --- Année choisie ---
    const now = new Date();
    const selectedYear = Number(req.query.year) || now.getFullYear();

    const yearStart = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${selectedYear}-12-31T23:59:59.999Z`);

    // --- Mois courant (inchangé) ---
    const month = now.getMonth();
    const monthStart = new Date(selectedYear, month, 1);
    const monthEnd = new Date(selectedYear, month + 1, 0, 23, 59, 59);

    // Total membres
    const totalMembres = await prisma.membre.count();

    // Décès dans l'année
    const nbDeces = await prisma.deces.count({
      where: { dateDeces: { gte: yearStart, lte: yearEnd } },
    });

    // Cotisations de l’année
    const allCotisations = await prisma.cotisation.findMany({
      where: {
        date: { gte: yearStart, lte: yearEnd }
      },
      include: { paiements: true }
    });

    const monthlyCotisations = Array(12).fill(0);
    const monthlyPaiements = Array(12).fill(0);

    let totalDuAnnuel = 0;
    let totalPaiementsAnnuel = 0;

    allCotisations.forEach(c => {
      const m = new Date(c.date).getMonth();
      monthlyCotisations[m] += c.montant;

      const pay = c.paiements.reduce((s,p)=>s+p.montant,0);
      monthlyPaiements[m] += pay;

      totalDuAnnuel += c.montant;
      totalPaiementsAnnuel += pay;
    });

    // Impayés
    const totalImpayes = totalDuAnnuel - totalPaiementsAnnuel;

    // Top familles
    const familles = await prisma.grandeFamille.findMany({
      include: {
        lignees: { include: { membres: true } }
      }
    });

    const topFamilles = familles
      .map(f => ({
        nom: f.nom,
        count: f.lignees.reduce((s,l)=>s+l.membres.length, 0)
      }))
      .sort((a,b)=>b.count - a.count)
      .slice(0, 5);

    // --- 🆕 TIMELINE : 5 derniers décès ---
    const lastDeces = await prisma.deces.findMany({
      take: 5,
      orderBy: { dateDeces: "desc" },
      include: {
        membre: {
          include: {
            lignee: { include: { famille: true } }
          }
        }
      }
    });

    return res.json({
      year: selectedYear,
      totalMembres,
      nbDeces,
      totalCotisationsMois: monthlyCotisations[month],
      totalPaiementsMois: monthlyPaiements[month],
      totalDuAnnuel,
      totalPaiementsAnnuel,
      totalImpayes,
      monthlyCotisations,
      monthlyPaiements,
      topFamilles,
      lastDeces    // 🆕
    });

  } catch(err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Erreur serveur dashboard" });
  }
}

