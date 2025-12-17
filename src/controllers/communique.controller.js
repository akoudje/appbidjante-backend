// src/controllers/communique.controller.js

import prisma from "../prisma.js";
import { diffuserCommunique } from "../services/diffusion.manager.js";
import { resolveDestinataires } from "../helpers/resolveDestinataires.js";


/**
 * GET /api/communiques
 */
export async function getAllCommuniques(req, res) {
  try {
    const { statut, type } = req.query;

    const where = {};
    if (statut) where.statut = statut;
    if (type) where.type = type;

    const communiques = await prisma.communique.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, username: true },
        },
      },
    });

    res.json(communiques);
  } catch (err) {
    console.error("ERREUR GET COMMUNIQUES:", err);
    res.status(500).json({ error: "Erreur chargement communiqués" });
  }
}

/**
 * GET /api/communiques/:id
 */
export async function getCommuniqueById(req, res) {
  const item = await prisma.communique.findUnique({
    where: { id: req.params.id },
    include: {
      diffusions: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!item) {
    return res.status(404).json({ message: "Communiqué introuvable" });
  }

  res.json(item);
}

/**
 * POST /api/communiques
 */
export async function createCommunique(req, res) {
  const data = req.body;

  const communique = await prisma.communique.create({
    data: {
      ...data,
      statut: "BROUILLON",
      createdById: req.user.id,
    },
  });

  res.status(201).json(communique);
}

/**
 * PUT /api/communiques/:id
 */
export async function updateCommunique(req, res) {
  const communique = await prisma.communique.findUnique({
    where: { id: req.params.id },
  });

  if (!communique) {
    return res.status(404).json({ message: "Communiqué introuvable" });
  }

  if (communique.statut !== "BROUILLON") {
    return res
      .status(403)
      .json({ message: "Impossible de modifier un communiqué publié" });
  }

  const updated = await prisma.communique.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json(updated);
}

/**
 * POST /api/communiques/:id/publier
 */
export async function publierCommunique(req, res) {
  try {
    const { id } = req.params;

    const communique = await prisma.communique.findUnique({ where: { id } });

    if (!communique) {
      return res.status(404).json({ error: "Communiqué introuvable" });
    }

    if (communique.statut !== "BROUILLON") {
      return res.status(400).json({
        error: "Seuls les communiqués en brouillon peuvent être publiés",
      });
    }

    if (!communique.canaux || communique.canaux.length === 0) {
      return res.status(400).json({
        error: "Aucun canal de diffusion sélectionné",
      });
    }

    // 1️⃣ Résoudre les destinataires AVANT publication
    const destinataires = await resolveDestinataires(communique);

    if (!Array.isArray(destinataires) || destinataires.length === 0) {
      return res.status(400).json({
        error: "Aucun destinataire trouvé pour ce communiqué",
      });
    }

    // 2️⃣ Publier
    const updated = await prisma.communique.update({
      where: { id },
      data: {
        statut: "PUBLIE",
        datePublication: new Date(),
      },
    });

    // 3️⃣ Diffuser (async)
    await diffuserCommunique(updated);

    return res.json(updated);
  } catch (err) {
    console.error("Erreur publication communiqué:", err);
    return res.status(500).json({
      error: "Erreur interne lors de la publication du communiqué",
    });
  }
}


/**
 * POST /api/communiques/:id/archiver
 */
export async function archiverCommunique(req, res) {
  const updated = await prisma.communique.update({
    where: { id: req.params.id },
    data: {
      statut: "ARCHIVE",
      dateArchivage: new Date(),
    },
  });

  res.json(updated);
}

/**
 * POST /api/communiques/:id/rediffuser
 */
export async function rediffuserCommunique(req, res) {
  try {
    const { id } = req.params;

    const communique = await prisma.communique.findUnique({
      where: { id },
    });

    if (!communique) {
      return res.status(404).json({ error: "Communiqué introuvable" });
    }

    if (communique.statut !== "PUBLIE") {
      return res.status(400).json({
        error: "Seuls les communiqués publiés peuvent être rediffusés",
      });
    }

    if (!communique.canaux || communique.canaux.length === 0) {
      return res.status(400).json({
        error: "Aucun canal de diffusion sélectionné",
      });
    }

    const destinataires = await resolveDestinataires(communique);

    if (!Array.isArray(destinataires) || destinataires.length === 0) {
      return res.status(400).json({
        error: "Aucun destinataire trouvé pour ce communiqué",
      });
    }

    // ⚠️ diffusion protégée
    await diffuserCommunique(communique);

    return res.json({
      success: true,
      count: destinataires.length,
    });
  } catch (err) {
    console.error("Erreur rediffusion communiqué :", err);
    return res.status(500).json({
      error: "Erreur interne lors de la rediffusion",
    });
  }
}


/**
 * GET /api/communiques/:id/diffusions
 */
export async function getDiffusionHistorique(req, res) {
  try {
    const { id } = req.params;

    const communique = await prisma.communique.findUnique({
      where: { id },
      include: {
        diffusions: {
          orderBy: {
            sentAt: "desc",
          },
        },
      },
    });

    if (!communique) {
      return res.status(404).json({
        error: "Communiqué introuvable",
      });
    }

    return res.json(communique.diffusions);
  } catch (err) {
    console.error("Erreur récupération diffusions :", err);
    return res.status(500).json({
      error: "Erreur lors du chargement de l’historique de diffusion",
    });
  }
}
