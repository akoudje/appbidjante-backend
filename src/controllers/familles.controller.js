// src/controllers/familles.controller.js
import prisma from "../prisma.js";

// GET ALL
export async function getAllFamilles(req, res) {
  try {
    const list = await prisma.grandeFamille.findMany({
      include: {
        lignees: true,
      },
      orderBy: { nom: "asc" },
    });

    res.json(list);
  } catch (err) {
    console.error("Erreur getAllFamilles :", err);
    res.status(500).json({ error: "Erreur serveur familles" });
  }
}

// GET ONE
export async function getFamille(req, res) {
  try {
    const { id } = req.params;

    const item = await prisma.grandeFamille.findUnique({
      where: { id },
      include: {
        lignees: true,
      },
    });

    if (!item) return res.status(404).json({ error: "Famille introuvable" });

    res.json(item);
  } catch (err) {
    console.error("Erreur getFamille :", err);
    res.status(500).json({ error: "Erreur serveur familles" });
  }
}

// CREATE
export async function createFamille(req, res) {
  try {
    const { nom } = req.body;

    const f = await prisma.grandeFamille.create({
      data: { nom },
    });

    res.json(f);
  } catch (err) {
    console.error("Erreur createFamille :", err);
    res.status(500).json({ error: "Erreur serveur familles" });
  }
}

// UPDATE
export async function updateFamille(req, res) {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    const f = await prisma.grandeFamille.update({
      where: { id },
      data: { nom },
    });

    res.json(f);
  } catch (err) {
    console.error("Erreur updateFamille :", err);
    res.status(500).json({ error: "Erreur serveur familles" });
  }
}

// DELETE
export async function deleteFamille(req, res) {
  try {
    const { id } = req.params;

    await prisma.grandeFamille.delete({
      where: { id },
    });

    res.json({ message: "Famille supprimée" });
  } catch (err) {
    console.error("Erreur deleteFamille :", err);
    res.status(500).json({ error: "Erreur serveur familles" });
  }
}
