import prisma from "../prisma.js";

/**
 * CREATE – Créer un enterrement (lié à un décès)
 */
export async function createEnterrement(req, res) {
  try {
    const {
      decesId,
      declareAuVillage,
      funeraillesAuVillage,
      enterreAuVillage,
      lieuEnterrement,
      dateEnterrement
    } = req.body;

    // Vérification que le décès existe
    const deces = await prisma.deces.findUnique({
      where: { id: decesId }
    });

    if (!deces) {
      return res.status(404).json({ message: "Décès introuvable." });
    }

    // Vérifier si un enterrement existe déjà
    const existing = await prisma.enterrement.findUnique({
      where: { decesId }
    });

    if (existing) {
      return res.status(400).json({ message: "Un enterrement existe déjà pour ce décès." });
    }

    const enterrement = await prisma.enterrement.create({
      data: {
        decesId,
        declareAuVillage,
        funeraillesAuVillage,
        enterreAuVillage,
        lieuEnterrement: enterreAuVillage ? null : lieuEnterrement,
        dateEnterrement: dateEnterrement ? new Date(dateEnterrement) : null
      }
    });

    return res.status(201).json(enterrement);
  } catch (error) {
    console.error("Erreur création enterrement:", error);
    return res.status(500).json({ message: "Erreur interne.", error });
  }
}

/**
 * GET ALL – Liste complète avec jointures
 */
export async function getAllEnterrements(req, res) {
  try {
    const enterrements = await prisma.enterrement.findMany({
      orderBy: { dateEnterrement: "desc" },
      include: {
        deces: {
          include: {
            membre: {
              include: {
                lignee: {
                  include: { famille: true }
                }
              }
            }
          }
        }
      }
    });

    return res.json(enterrements);
  } catch (error) {
    console.error("Erreur récupération enterrements:", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
}

/**
 * GET ONE – Par ID
 */
export async function getEnterrement(req, res) {
  try {
    const { id } = req.params;

    const enterrement = await prisma.enterrement.findUnique({
      where: { id },
      include: {
        deces: {
          include: {
            membre: {
              include: {
                lignee: {
                  include: { famille: true }
                }
              }
            }
          }
        }
      }
    });

    if (!enterrement) {
      return res.status(404).json({ message: "Enterrement introuvable." });
    }

    return res.json(enterrement);
  } catch (error) {
    console.error("Erreur récupération enterrement:", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
}

/**
 * UPDATE
 */
export async function updateEnterrement(req, res) {
  try {
    const { id } = req.params;
    const {
      declareAuVillage,
      funeraillesAuVillage,
      enterreAuVillage,
      lieuEnterrement,
      dateEnterrement
    } = req.body;

    const enterrement = await prisma.enterrement.update({
      where: { id },
      data: {
        declareAuVillage,
        funeraillesAuVillage,
        enterreAuVillage,
        lieuEnterrement: enterreAuVillage ? null : lieuEnterrement,
        dateEnterrement: dateEnterrement ? new Date(dateEnterrement) : null
      }
    });

    return res.json(enterrement);
  } catch (error) {
    console.error("Erreur mise à jour enterrement:", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
}

/**
 * DELETE – Rarement utilisé mais utile
 */
export async function deleteEnterrement(req, res) {
  try {
    const { id } = req.params;

    await prisma.enterrement.delete({
      where: { id }
    });

    return res.json({ message: "Enterrement supprimé." });
  } catch (error) {
    console.error("Erreur suppression enterrement:", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
}

/**
 * STATS – Pour la page Enterrements et dashboard famille/macrobe
 */
export async function getEnterrementStats(req, res) {
  try {
    const total = await prisma.enterrement.count();

    const declares = await prisma.enterrement.count({
      where: { declareAuVillage: true }
    });

    const funerVillage = await prisma.enterrement.count({
      where: { funeraillesAuVillage: true }
    });

    const enterresVillage = await prisma.enterrement.count({
      where: { enterreAuVillage: true }
    });

    const enterresAilleurs = await prisma.enterrement.count({
      where: { enterreAuVillage: false }
    });

    return res.json({
      total,
      declares,
      funerVillage,
      enterresVillage,
      enterresAilleurs,
      tauxDeclaration: total ? Math.round((declares / total) * 100) : 0,
      tauxEnterrementVillage: total ? Math.round((enterresVillage / total) * 100) : 0
    });
  } catch (error) {
    console.error("Erreur stats enterrements:", error);
    return res.status(500).json({ message: "Erreur interne." });
  }
}
