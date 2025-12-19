// src/controllers/communique.controller.js

import prisma from "../prisma.js";
import { diffuserCommunique } from "../services/diffusion.manager.js";
import { resolveDestinataires } from "../helpers/resolveDestinataires.js";
import { renderEmailCommunique } from "../templates/emailCommunique.js";
import emailService from "../services/email.service.js";

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
 * 🔁 Rediffusion SAFE (ne bloque jamais sur 0 destinataire)
 */
export async function rediffuserCommunique(req, res) {
  try {
    const { id } = req.params;

    const communique = await prisma.communique.findUnique({
      where: { id },
    });

    if (!communique) {
      return res.status(404).json({
        error: "Communiqué introuvable",
      });
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

    // 🔥 IMPORTANT : on résout MAIS on ne bloque PAS
    const destinataires = await resolveDestinataires(communique);

    // 🔁 tentative de rediffusion (logs gérés dans le service)
    await diffuserCommunique(communique);

    return res.json({
      success: true,
      totalDestinataires: Array.isArray(destinataires)
        ? destinataires.length
        : 0,
      message:
        destinataires.length === 0
          ? "Rediffusion exécutée sans destinataires (aucun membre éligible)"
          : "Rediffusion exécutée avec succès",
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


/**
 * GET /api/communiques/:id/preview
 * 👁 Preview backend (sans diffusion)
 */
export async function getCommuniquePreview(req, res) {
  try {
    const { id } = req.params;

    const communique = await prisma.communique.findUnique({
      where: { id },
    });

    if (!communique) {
      return res.status(404).json({
        error: "Communiqué introuvable",
      });
    }

    const destinataires = await resolveDestinataires(communique);

    const details = {};
    const avertissements = [];

    let sansContact = 0;

    for (const canal of communique.canaux) {
      let count = 0;

      for (const d of destinataires) {
        if (canal === "SMS" && d.contact1) count++;
        else if (canal === "EMAIL" && d.email) count++;
        else if (canal === "WHATSAPP" && d.contact1) count++;
        else if (canal === "PUSH") count++;
        else sansContact++;
      }

      details[canal] = count;
    }

    if (sansContact > 0) {
      avertissements.push(
        `${sansContact} membre(s) n’ont aucun contact valide pour les canaux sélectionnés`
      );
    }

    return res.json({
      id: communique.id,
      titre: communique.titre,
      statut: communique.statut,
      canaux: communique.canaux,
      totalDestinataires: destinataires.length,
      details,
      avertissements,
    });
  } catch (err) {
    console.error("Erreur preview communiqué :", err);
    return res.status(500).json({
      error: "Erreur lors de la génération du preview",
    });
  }
}

// Préview du rendu email du communiqué
export async function previewEmailCommunique(req, res) {
  try {
    const { id } = req.params;

    const communique = await prisma.communique.findUnique({
      where: { id },
    });

    if (!communique) {
      return res.status(404).json({ error: "Communiqué introuvable" });
    }

    const html = renderEmailCommunique(communique);

    res.json({ html });
  } catch (e) {
    console.error("Erreur preview email :", e);
    res.status(500).json({ error: "Erreur preview email" });
  }
}

// Envoi d'un email de test du communiqué à l'utilisateur connecté
export async function sendTestEmailCommunique(req, res) {
  try {
    const { id } = req.params;

    const communique = await prisma.communique.findUnique({
      where: { id },
    });

    if (!communique) {
      return res.status(404).json({ error: "Communiqué introuvable" });
    }

    // 🔥 Récupération fiable de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true },
    });

    if (!user?.email) {
      return res.status(400).json({
        error: "Votre compte ne possède pas d’email",
      });
    }

    await emailService.send(
      { email: user.email },
      communique
    );

    return res.json({
      success: true,
      message: `Email de test envoyé à ${user.email}`,
    });
  } catch (e) {
    console.error("Erreur email test :", e);
    return res.status(500).json({
      error: "Erreur lors de l’envoi de l’email de test",
    });
  }
}


