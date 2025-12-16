// src/controllers/categories.controller.js
import prisma from "../prisma.js";

// GET all catégories with stats
export async function getAllCategoriesWithStats(req, res) {
  try {
    const categories = await prisma.categorie.findMany({
      include: {
        membres: {
          include: {
            lignee: {
              include: {
                famille: true
              }
            }
          }
        }
      },
      orderBy: { label: "asc" },
    });

    // Enrichir avec les statistiques
    const categoriesWithStats = categories.map(categorie => ({
      ...categorie,
      membreCount: categorie.membres.length,
      stats: {
        total: categorie.membres.length,
        hommes: categorie.membres.filter(m => m.genre === "Homme").length,
        femmes: categorie.membres.filter(m => m.genre === "Femme").length,
        actifs: categorie.membres.filter(m => m.statutMembre === "Actif").length,
      }
    }));

    res.json(categoriesWithStats);
  } catch (err) {
    console.error("Erreur getAllCategoriesWithStats :", err);
    res.status(500).json({ error: "Erreur serveur catégories" });
  }
}

// GET all catégories (simple)
export async function getAllCategories(req, res) {
  try {
    const list = await prisma.categorie.findMany({
      include: { 
        membres: {
          select: {
            id: true,
            nom: true,
            prenoms: true,
            statutMembre: true
          }
        } 
      },
      orderBy: { label: "asc" },
    });

    // Ajouter le count pour compatibilité frontend
    const categoriesWithCount = list.map(cat => ({
      ...cat,
      membreCount: cat.membres.length
    }));

    res.json(categoriesWithCount);
  } catch (err) {
    console.error("Erreur getAllCategories :", err);
    res.status(500).json({ error: "Erreur serveur catégories" });
  }
}

// GET one
export async function getCategorie(req, res) {
  try {
    const { id } = req.params;

    const item = await prisma.categorie.findUnique({
      where: { id },
      include: { 
        membres: {
          include: {
            lignee: {
              include: {
                famille: true
              }
            }
          }
        } 
      },
    });

    if (!item)
      return res.status(404).json({ error: "Catégorie introuvable" });

    res.json(item);
  } catch (err) {
    console.error("Erreur getCategorie :", err);
    res.status(500).json({ error: "Erreur serveur catégories" });
  }
}

// CREATE
export async function createCategorie(req, res) {
  try {
    const data = req.body;

    const created = await prisma.categorie.create({
      data: {
        label: data.label,
        generation: data.generation,
        classe: data.classe,
        born_from: data.born_from ?? null,
        born_to: data.born_to ?? null,
        date_sortie_1er_guerrier: data.date_sortie_1er_guerrier
          ? new Date(data.date_sortie_1er_guerrier)
          : null,
        date_sortie_2eme_guerrier: data.date_sortie_2eme_guerrier
          ? new Date(data.date_sortie_2eme_guerrier)
          : null,
        description: data.description || null,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("Erreur createCategorie :", err);
    res.status(500).json({ error: "Erreur serveur catégories" });
  }
}

// UPDATE
export async function updateCategorie(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.categorie.update({
      where: { id },
      data: {
        label: data.label,
        generation: data.generation,
        classe: data.classe,
        born_from: data.born_from ?? null,
        born_to: data.born_to ?? null,
        date_sortie_1er_guerrier: data.date_sortie_1er_guerrier
          ? new Date(data.date_sortie_1er_guerrier)
          : null,
        date_sortie_2eme_guerrier: data.date_sortie_2eme_guerrier
          ? new Date(data.date_sortie_2eme_guerrier)
          : null,
        description: data.description || null,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Erreur updateCategorie :", err);
    res.status(500).json({ error: "Erreur serveur catégories" });
  }
}

// DELETE
export async function deleteCategorie(req, res) {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des membres dans cette catégorie
    const membresCount = await prisma.membre.count({
      where: { categorieId: id }
    });

    if (membresCount > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer cette catégorie car elle contient ${membresCount} membre(s).` 
      });
    }

    await prisma.categorie.delete({
      where: { id },
    });

    res.json({ message: "Catégorie supprimée" });
  } catch (err) {
    console.error("Erreur deleteCategorie :", err);
    res.status(500).json({ error: "Erreur serveur catégories" });
  }
}

// 📊 GET /categories/:id/stats
export async function getCategoryStats(req, res) {
  try {
    const { id } = req.params;

    // Vérifier si la catégorie existe
    const cat = await prisma.categorie.findUnique({
      where: { id },
    });

    if (!cat) {
      return res.status(404).json({ error: "Catégorie introuvable" });
    }

    // Récupérer les membres de cette catégorie
    const membres = await prisma.membre.findMany({
      where: { categorieId: id },
      include: {
        lignee: {
          include: {
            famille: true,
          },
        },
      },
    });

    const total = membres.length;
    const actifs = membres.filter(m => m.statutMembre === "Actif").length;
    const hommes = membres.filter((m) => m.genre === "Homme").length;
    const femmes = membres.filter((m) => m.genre === "Femme").length;

    // Répartition par grandes familles
    const famillesMap = {};
    for (const m of membres) {
      const nomFam = m.lignee?.famille?.nom || "Non définie";
      famillesMap[nomFam] = (famillesMap[nomFam] || 0) + 1;
    }

    const familles = Object.entries(famillesMap).map(([nom, total]) => ({
      nom,
      total,
    }));

    res.json({
      total,
      actifs,
      hommes,
      femmes,
      familles,
    });
  } catch (err) {
    console.error("Erreur getCategoryStats :", err);
    res.status(500).json({ error: "Erreur serveur stats catégorie" });
  }
}

// GET /categories/:id/membres
export async function getCategoryMembres(req, res) {
  try {
    const { id } = req.params;

    const membres = await prisma.membre.findMany({
      where: { categorieId: id },
      include: {
        lignee: {
          include: {
            famille: true
          }
        }
      },
      orderBy: { nom: "asc" }
    });

    res.json(membres);
  } catch (err) {
    console.error("Erreur getCategoryMembres :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}