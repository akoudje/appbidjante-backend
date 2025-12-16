// src/controllers/lignees.controller.js

import prisma from "../prisma.js";

// --------------------------------------------
// GET ALL LIGNEES
// --------------------------------------------
export async function getAllLignees(req, res) {
  try {
    const list = await prisma.lignée.findMany({
      include: {
        famille: true,
        membres: true
      },
      orderBy: { nom: "asc" }
    });

    res.json(list);
  } catch (err) {
    console.error("Erreur getAllLignees :", err);
    res.status(500).json({ error: "Erreur serveur lignée" });
  }
}

// --------------------------------------------
// GET ONE
// --------------------------------------------
export async function getLignee(req, res) {
  try {
    const { id } = req.params;

    const lignee = await prisma.lignée.findUnique({
      where: { id },
      include: {
        famille: true,
        membres: true
      }
    });

    if (!lignee) return res.status(404).json({ error: "Lignée introuvable" });

    res.json(lignee);
  } catch (err) {
    console.error("Erreur getLignee :", err);
    res.status(500).json({ error: "Erreur serveur lignée" });
  }
}

// --------------------------------------------
// GET LIGNEES BY GRANDE FAMILLE
// --------------------------------------------
export async function getLigneesByFamille(req, res) {
  try {
    const { familleId } = req.params;

    if (!familleId) {
      return res.status(400).json({ error: "familleId manquant." });
    }

    const list = await prisma.lignée.findMany({
      where: { familleId },
      orderBy: { nom: "asc" },
    });

    res.json(list);
  } catch (err) {
    console.error("Erreur getLigneesByFamille :", err);
    res.status(500).json({ error: "Erreur serveur lors du chargement des lignées." });
  }
}





// --------------------------------------------
// CREATE
// --------------------------------------------
export async function createLignee(req, res) {
  try {
    const { nom, familleId } = req.body;

    if (!nom || !familleId) {
      return res.status(400).json({ error: "nom et familleId sont obligatoires" });
    }

    const lignee = await prisma.lignée.create({
      data: { nom, familleId }
    });

    res.json(lignee);
  } catch (err) {
    console.error("Erreur createLignee :", err);
    res.status(500).json({ error: "Erreur serveur lignée" });
  }
}

// --------------------------------------------
// UPDATE
// --------------------------------------------
export async function updateLignee(req, res) {
  try {
    const { id } = req.params;
    const { nom, familleId } = req.body;

    const lignee = await prisma.lignée.update({
      where: { id },
      data: {
        nom,
        familleId
      }
    });

    res.json(lignee);
  } catch (err) {
    console.error("Erreur updateLignee :", err);
    res.status(500).json({ error: "Erreur serveur lignée" });
  }
}

// --------------------------------------------
// DELETE
// --------------------------------------------
export async function deleteLignee(req, res) {
  try {
    const { id } = req.params;

    // Optionnel : empêcher suppression si membres attachés
    const linkedMembers = await prisma.membre.count({
      where: { ligneeId: id }
    });

    if (linkedMembers > 0) {
      return res.status(400).json({
        error: "Impossible de supprimer : des membres sont liés à cette lignée."
      });
    }

    await prisma.lignée.delete({ where: { id } });

    res.json({ message: "Lignée supprimée" });
  } catch (err) {
    console.error("Erreur deleteLignee :", err);
    res.status(500).json({ error: "Erreur serveur lignée" });
  }
}
