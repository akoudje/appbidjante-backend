// src/controllers/membres.controller.js

import prisma from "../prisma.js";

// 📌 Récupérer tous les membres
export async function getAllMembres(req, res) {
  try {
    const membres = await prisma.membre.findMany({
      where: {
        statutMembre: { not: "Décédé" }   // 👈 CACHE LES DÉCÉDÉS
      },
      include: {
        lignee: { include: { famille: true } },
        categorie: true,
        deces: true,
        cotisations: true,
      },
      orderBy: { nom: "asc" },
    });

    res.json(membres);
  } catch (error) {
    console.error("Erreur getAllMembres :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// 📌 Récupérer un membre par ID
export async function getMembreProfile(req, res) {
  try {
    const { id } = req.params;

    const membre = await prisma.membre.findUnique({
      where: { id },
      include: {
        lignee: {
          include: {
            famille: true,
          },
        },
        categorie: true,
        deces: true,
        cotisations: {
          include: { paiements: true, deces: true },
        },
      },
    });

    if (!membre) {
      return res.status(404).json({ error: "Membre introuvable" });
    }

    res.json(membre);
  } catch (error) {
    console.error("Erreur getMembreProfile :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// 📌 Créer un membre
export async function createMembre(req, res) {
  try {
    const data = req.body;

    if (!data.ligneeId) {
      return res
        .status(400)
        .json({ error: "La lignée (ligneeId) est obligatoire." });
    }

    const membre = await prisma.membre.create({
      data: {
        nom: data.nom,
        prenoms: data.prenoms,
        genre: data.genre,
        statutMembre: data.statutMembre ?? "Actif",
        ligneeId: data.ligneeId,
        categorieId: data.categorieId || null,
        dateNaissance: data.dateNaissance
          ? new Date(data.dateNaissance)
          : null,
        photo: data.photo || null,
        // Ajout des champs de contact
        email: data.email || null,
        contact1: data.contact1 || null,
        contact2: data.contact2 || null,
      },
    });

    res.status(201).json(membre);
  } catch (error) {
    console.error("Erreur createMembre :", error);
    
    // Gestion des erreurs spécifiques Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: "Un membre avec ce nom et prénom existe déjà" 
      });
    }
    
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// 📌 Modifier un membre
export async function updateMembre(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    const membre = await prisma.membre.update({
      where: { id },
      data: {
        nom: data.nom,
        prenoms: data.prenoms,
        genre: data.genre,
        statutMembre: data.statutMembre,
        ligneeId: data.ligneeId,
        categorieId: data.categorieId || null,
        dateNaissance: data.dateNaissance
          ? new Date(data.dateNaissance)
          : null,
        photo: data.photo || null,
        // Ajout des champs de contact
        email: data.email || null,
        contact1: data.contact1 || null,
        contact2: data.contact2 || null,
      },
    });

    res.json(membre);
  } catch (error) {
    console.error("Erreur updateMembre :", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: "Un membre avec ce nom et prénom existe déjà" 
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: "Membre non trouvé" 
      });
    }
    
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// 📌 Supprimer
export async function deleteMembre(req, res) {
  try {
    const { id } = req.params;

    await prisma.membre.delete({
      where: { id },
    });

    res.json({ message: "Membre supprimé" });
  } catch (error) {
    console.error("Erreur deleteMembre :", error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: "Membre non trouvé" 
      });
    }
    
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// 📌 Déclarer un décès directement depuis /membres/:id/deces (optionnel)
export async function registerDecesForMembre(req, res) {
  try {
    const { id } = req.params;
    const { dateDeces, motif } = req.body;

    // Vérifier si le membre existe
    const membre = await prisma.membre.findUnique({ 
      where: { id } 
    });
    
    if (!membre) {
      return res.status(404).json({ error: "Membre non trouvé" });
    }

    // Vérifier si un décès existe déjà
    const exist = await prisma.deces.findUnique({ 
      where: { membreId: id } 
    });
    
    if (exist) {
      return res.status(400).json({ 
        error: "Ce membre possède déjà un dossier décès." 
      });
    }

    // Transaction create deces + update membre
    const [deces] = await prisma.$transaction([
      prisma.deces.create({
        data: {
          membreId: id,
          dateDeces: new Date(dateDeces),
          motif: motif || null,
        },
      }),
      prisma.membre.update({
        where: { id },
        data: { statutMembre: "Décédé" },
      }),
    ]);

    res.json(deces);
  } catch (error) {
    if (error && error.code === "P2002") {
      return res.status(400).json({ 
        error: "Un dossier décès existe déjà pour ce membre." 
      });
    }
    console.error("Erreur registerDecesForMembre :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// 📌 Upload photo membre
export async function uploadMembrePhoto(req, res) {
  try {
    const { id } = req.params;

    if (!req.file)
      return res.status(400).json({ error: "Aucun fichier reçu." });

    const photoUrl = `/uploads/membres/${req.file.filename}`;

    const updated = await prisma.membre.update({
      where: { id },
      data: { photo: photoUrl },
    });

    res.json(updated);
  } catch (err) {
    console.error("Erreur upload photo :", err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        error: "Membre non trouvé" 
      });
    }
    
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// 📌 Rechercher des membres par contact (email ou numéro)
export async function searchMembresByContact(req, res) {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: "Requête de recherche trop courte (minimum 2 caractères)" 
      });
    }

    const membres = await prisma.membre.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { contact1: { contains: query } },
          { contact2: { contains: query } },
        ],
        statutMembre: { not: "Décédé" }
      },
      include: {
        lignee: { include: { famille: true } },
        categorie: true,
      },
      take: 20, // Limiter les résultats
    });

    res.json(membres);
  } catch (error) {
    console.error("Erreur searchMembresByContact :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// 📌 Rechercher des membres par nom ou prénom (pour autocomplétion)
export async function searchMembresByName(req, res) {
  try {
    const { q, statutMembre, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]); // Retourne tableau vide si recherche trop courte
    }

    const statuts = statutMembre 
      ? statutMembre.split(',') 
      : ['Actif', 'Actif Exempté']; // Exclure "Décédé" par défaut

    const membres = await prisma.membre.findMany({
      where: {
        OR: [
          { nom: { contains: q, mode: 'insensitive' } },
          { prenoms: { contains: q, mode: 'insensitive' } },
        ],
        statutMembre: { in: statuts }
      },
      select: {
        id: true,
        nom: true,
        prenoms: true,
        genre: true,
        contact1: true,
        contact2: true,
        statutMembre: true,
        categorie: {
          select: { label: true }
        }
      },
      take: parseInt(limit),
      orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }]
    });

    res.json(membres);
  } catch (error) {
    console.error("Erreur searchMembresByName :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}