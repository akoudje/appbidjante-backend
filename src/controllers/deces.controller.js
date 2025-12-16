// src/controllers/deces.controller.js

import prisma from "../prisma.js";
import { generateCotisationsForDeces } from "./cotisations.controller.js";

// -------------------------------------------
// GET ALL DECES
// -------------------------------------------
export async function getAllDeces(req, res) {
  try {
    const list = await prisma.deces.findMany({
      include: {
        membre: {
          include: {
            lignee: { include: { famille: true } },
            categorie: true
          }
        }
      },
      orderBy: { dateDeces: "desc" }
    });

    res.json(list);
  } catch (err) {
    console.error("Erreur getAllDeces:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// -------------------------------------------
// GET ONE
// -------------------------------------------
export async function getDeces(req, res) {
  try {
    const { id } = req.params;

    const d = await prisma.deces.findUnique({
      where: { id },
      include: {
        membre: {
          include: {
            lignee: { include: { famille: true } },
            categorie: true
          }
        }
      }
    });

    if (!d) return res.status(404).json({ error: "Décès introuvable" });

    res.json(d);
  } catch (err) {
    console.error("Erreur getDeces:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// -------------------------------------------
// CREATE
// -------------------------------------------

export async function createDeces(req, res) {
  try {
    const { membreId, dateDeces, motif } = req.body;

    // VÉRIFIER SI LE MEMBRE EXISTE D'ABORD
    const membre = await prisma.membre.findUnique({
      where: { id: membreId }
    });

    if (!membre) {
      return res.status(404).json({ error: "Membre non trouvé" });
    }

    // VÉRIFIER SI LE MEMBRE N'EST PAS DÉJÀ DÉCÉDÉ
    if (membre.statutMembre === "Décédé") {
      return res.status(400).json({ 
        error: "Ce membre est déjà enregistré comme décédé" 
      });
    }

    // 1) transaction: create deces + update membre atomiquement
    const [deces] = await prisma.$transaction([
      prisma.deces.create({
        data: {
          membreId,
          dateDeces: new Date(dateDeces),
          motif: motif || null,
        },
      }),
      prisma.membre.update({
        where: { id: membreId },
        data: { statutMembre: "Décédé" },
      }),
    ]);

    // 2) Générer les cotisations — hors transaction pour éviter blocages longs
    try {
      const fakeReq = { params: { decesId: deces.id } };
      const fakeRes = {
        json: (payload) => console.log("Cotisations générées pour le décès", deces.id, payload),
        status: () => fakeRes,
      };
      await generateCotisationsForDeces(fakeReq, fakeRes);
    } catch (cotErr) {
      // on log mais on ne rollback pas : le décès est bien créé.
      console.error("Erreur génération cotisations:", cotErr);
    }

    // 3) Retourner le décès créé
    res.json(deces);
  } catch (err) {
    // Gérer contrainte unique (doublon membreId)
    if (err && err.code === "P2002") {
      return res.status(400).json({ 
        error: "Un dossier décès existe déjà pour ce membre." 
      });
    }
    console.error("Erreur createDeces :", err);
    res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}


// -------------------------------------------
// UPDATE (modification d’un décès)
// -------------------------------------------
export async function updateDeces(req, res) {
  try {
    const { id } = req.params;
    const { dateDeces, motif } = req.body;

    const exist = await prisma.deces.findUnique({ where: { id } });
    if (!exist) return res.status(404).json({ error: "Décès introuvable" });

    const updated = await prisma.deces.update({
      where: { id },
      data: {
        dateDeces: new Date(dateDeces),
        motif: motif || null
      }
    });

    res.json(updated);
  } catch (err) {
    console.error("Erreur updateDeces:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// -------------------------------------------
// DELETE
// -------------------------------------------
export async function deleteDeces(req, res) {
  try {
    const { id } = req.params;

    const exist = await prisma.deces.findUnique({ where: { id } });
    if (!exist) return res.status(404).json({ error: "Décès introuvable" });

    const membreId = exist.membreId;

    // Suppression décès
    await prisma.deces.delete({ where: { id } });

    // Réactiver membre
    await prisma.membre.update({
      where: { id: membreId },
      data: { statutMembre: "Actif" }
    });

    res.json({ message: "Décès supprimé" });
  } catch (err) {
    console.error("Erreur deleteDeces:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
/**
 * 📊 Statistiques globales sur les décès
 * Route: GET /api/deces/stats
 *
 * Renvoie :
 * {
 *   total: number,
 *   parAnnee: [{ year, count }],
 *   parGenre: [{ genre, count }],
 *   parFamille: [{ famille, count }],
 *   ageMoyen: number | null
 * }
 */
export async function getDecesStats(req, res) {
  try {
    // On récupère tous les décès avec les infos nécessaires
    const decesList = await prisma.deces.findMany({
      include: {
        membre: {
          include: {
            lignee: {
              include: {
                famille: true,
              },
            },
          },
        },
      },
      orderBy: { dateDeces: "asc" },
    });

    const total = decesList.length;

    // ---- A) Par année ----
    const parAnneeMap = new Map();
    decesList.forEach((d) => {
      const year = new Date(d.dateDeces).getFullYear();
      parAnneeMap.set(year, (parAnneeMap.get(year) || 0) + 1);
    });
    const parAnnee = Array.from(parAnneeMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    // ---- B) Par genre (Homme/Femme/autres) ----
    const parGenreMap = new Map();
    decesList.forEach((d) => {
      const genre = d.membre?.genre || "Inconnu";
      parGenreMap.set(genre, (parGenreMap.get(genre) || 0) + 1);
    });
    const parGenre = Array.from(parGenreMap.entries()).map(
      ([genre, count]) => ({ genre, count })
    );

    // ---- C) Par grande famille ----
    const parFamilleMap = new Map();
    decesList.forEach((d) => {
      const familleNom =
        d.membre?.lignee?.famille?.nom || "Famille inconnue / non renseignée";
      parFamilleMap.set(familleNom, (parFamilleMap.get(familleNom) || 0) + 1);
    });
    const parFamille = Array.from(parFamilleMap.entries())
      .map(([famille, count]) => ({ famille, count }))
      .sort((a, b) => b.count - a.count);

    // ---- D) Âge moyen au décès (si dateNaissance disponible) ----
    let totalAge = 0;
    let countAge = 0;

    decesList.forEach((d) => {
      const naissance = d.membre?.dateNaissance
        ? new Date(d.membre.dateNaissance)
        : null;
      const decesDate = d.dateDeces ? new Date(d.dateDeces) : null;

      if (!naissance || !decesDate) return;

      const age =
        decesDate.getFullYear() - naissance.getFullYear() -
        (decesDate < new Date(decesDate.getFullYear(), naissance.getMonth(), naissance.getDate()) ? 1 : 0);

      if (!isNaN(age) && age >= 0 && age < 120) {
        totalAge += age;
        countAge += 1;
      }
    });

    const ageMoyen =
      countAge > 0 ? Math.round((totalAge / countAge) * 10) / 10 : null;

    res.json({
      total,
      parAnnee,
      parGenre,
      parFamille,
      ageMoyen,
    });
  } catch (error) {
    console.error("Erreur getDecesStats :", error);
    res.status(500).json({ error: "Erreur serveur statistiques décès" });
  }
}