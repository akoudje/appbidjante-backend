// src/controllers/cotisations.controller.js

import prisma from "../prisma.js";

/**
 * GET /api/cotisations
 * Liste toutes les cotisations (vue admin / stats / page Cotisations.jsx)
 */
export async function getAllCotisations(req, res) {
  try {
    const list = await prisma.cotisation.findMany({
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
        paiements: true,
      },
      orderBy: { date: "desc" },
    });
    res.json(list);
  } catch (err) {
    console.error("Erreur getAllCotisations :", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/cotisations/:id
 */
export async function getCotisation(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const item = await prisma.cotisation.findUnique({
      where: { id },
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
        paiements: true,
      },
    });

    if (!item) return res.status(404).json({ error: "Cotisation introuvable" });

    res.json(item);
  } catch (err) {
    console.error("Erreur getCotisation :", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/cotisations
 * Création manuelle d'une cotisation (hors génération automatique décès)
 */
export async function createCotisation(req, res) {
  try {
    const { membreId, date, montant, motif, statutCotisation, decesId } =
      req.body;

    if (!membreId) {
      return res.status(400).json({ error: "membreId est requis" });
    }

    // Empêcher les doublons : même membre / même décès
    if (decesId) {
      const existing = await prisma.cotisation.findFirst({
        where: { membreId, decesId },
      });
      if (existing) {
        return res.status(400).json({
          error: "Une cotisation existe déjà pour ce membre et ce décès.",
        });
      }
    }

    const created = await prisma.cotisation.create({
      data: {
        membreId,
        decesId: decesId || null,
        date: date ? new Date(date) : new Date(),
        montant: Number(montant ?? 0),
        motif: motif || null,
        statutCotisation: statutCotisation || "Impayé",
      },
    });

    res.json(created);
  } catch (err) {
    console.error("Erreur createCotisation :", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * PUT /api/cotisations/:id
 * Mise à jour d'une cotisation
 */
export const updateCotisation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const existing = await prisma.cotisation.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Cotisation introuvable" });
    }

    const { membreId, date, montant, motif, statutCotisation, decesId } =
      req.body;

    const newMembreId = membreId ?? existing.membreId;
    const newDecesId = decesId ?? existing.decesId;

    // Empêcher les doublons si on modifie membreId ou decesId
    if (newDecesId) {
      const duplicate = await prisma.cotisation.findFirst({
        where: {
          membreId: newMembreId,
          decesId: newDecesId,
          NOT: { id }, // exclure l'actuelle
        },
      });
      if (duplicate) {
        return res.status(400).json({
          error:
            "Une cotisation existe déjà pour ce membre et ce décès (doublon).",
        });
      }
    }

    const updated = await prisma.cotisation.update({
      where: { id },
      data: {
        membreId: newMembreId,
        decesId: newDecesId,
        date: date ? new Date(date) : existing.date,
        montant:
          montant !== undefined && montant !== null
            ? Number(montant)
            : existing.montant,
        motif: motif ?? existing.motif,
        statutCotisation: statutCotisation ?? existing.statutCotisation,
      },
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
        paiements: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Erreur updateCotisation :", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/cotisations/:id/pay
 * Marquer une cotisation comme payée (mode simple, "marquer tout payé")
 */
export async function payCotisation(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const cotisation = await prisma.cotisation.findUnique({
      where: { id },
      include: { paiements: true },
    });

    if (!cotisation) {
      return res.status(404).json({ error: "Cotisation introuvable" });
    }

    const dejaPaye = cotisation.paiements.reduce(
      (s, p) => s + p.montant,
      0
    );
    const reste = cotisation.montant - dejaPaye;

    if (reste > 0) {
      await prisma.paiement.create({
        data: {
          cotisationId: cotisation.id,
          montant: reste,
          date: new Date(),
          mode: "Marqué payé",
        },
      });
    }

    const updated = await prisma.cotisation.update({
      where: { id },
      data: {
        statutCotisation: "Payé",
        paidAt: new Date(),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Erreur payCotisation :", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/cotisations/:id
 */
export async function deleteCotisation(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    await prisma.paiement.deleteMany({
      where: { cotisationId: id },
    });

    await prisma.cotisation.delete({ where: { id } });

    res.json({ message: "Cotisation supprimée" });
  } catch (err) {
    console.error("Erreur deleteCotisation :", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * 🔥 Génération automatique des cotisations pour un décès
 *
 * Règle :
 *  - Membre Actif (statutMembre = "Actif")
 *  - Non décédé (relation deces null)
 *  - Catégorie avec date_sortie_1er_guerrier <= dateDeces
 *  - Une seule cotisation par (membre, décès)
 *
 * POST /api/cotisations/generate-from-deces/:decesId
 */
export async function generateCotisationsForDeces(req, res) {
  try {
    const { decesId } = req.params;

    const deces = await prisma.deces.findUnique({
      where: { id: decesId },
      include: { membre: true },
    });

    if (!deces) {
      return res.status(404).json({ error: "Décès introuvable" });
    }

    const dateDeces = deces.dateDeces;

    // Membres éligibles : Actifs, non décédés, avec catégorie valide
    const membresEligibles = await prisma.membre.findMany({
      where: {
        statutMembre: "Actif",
        deces: { is: null },
        categorie: {
          is: {
            date_sortie_1er_guerrier: {
              lte: dateDeces,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (membresEligibles.length === 0) {
      return res.json({
        message: "Aucun membre éligible pour ce décès.",
        totalEligibles: 0,
        totalCreated: 0,
      });
    }

    const data = membresEligibles.map((m) => ({
      membreId: m.id,
      decesId,
      date: dateDeces, // ou new Date() si tu préfères la date de génération
      montant: 500, // montant fixe
      motif: `Décès de ${deces.membre?.nom} ${deces.membre?.prenoms}`,
      statutCotisation: "Impayé",
    }));

    // anti-doublon béton si tu as un index unique (membreId, decesId)
    const result = await prisma.cotisation.createMany({
      data,
      skipDuplicates: true,
    });

    res.json({
      message: "Cotisations générées avec succès.",
      totalEligibles: membresEligibles.length,
      totalCreated: result.count,
    });
  } catch (err) {
    console.error("Erreur generateCotisationsForDeces :", err);
    res.status(500).json({ error: err.message });
  }
}
