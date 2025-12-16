// backend/src/controllers/archives.controller.js
import prisma from "../prisma.js";

/**
 * Liste propre des membres décédés
 * Formatée pour le frontend Archives.jsx
 */
export async function getArchivesMembres(req, res) {
  try {
    const membres = await prisma.membre.findMany({
      where: {
        statutMembre: "Décédé",
        deces: { isNot: null } // ← évite les décès fantômes
      },

      include: {
        lignee: { include: { famille: true } },
        categorie: true,
        deces: true
      },

      orderBy: {
        deces: { dateDeces: "desc" }
      }
    });

    // Transformation → structure frontend
    const formatted = membres.map(m => ({
      id: m.id,
      nom: m.nom,
      prenoms: m.prenoms,
      genre: m.genre,

      categorie: m.categorie?.label ?? "—",

      famille: m.lignee?.famille?.nom ?? "—",
      lignee: m.lignee?.nom ?? "—",

      dateNaissance: m.dateNaissance,
      dateDeces: m.deces?.dateDeces || null,

      ageAuDeces: computeAgeAtDeath(m),

      statutHistorique: "Décédé"
    }));

    res.json(formatted);

  } catch (err) {
    console.error("Erreur getArchivesMembres:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}


// -------------------------
// Calcul de l'âge au décès
// -------------------------
function computeAgeAtDeath(m) {
  if (!m.dateNaissance || !m.deces?.dateDeces) return null;

  const naissance = new Date(m.dateNaissance);
  const deces = new Date(m.deces.dateDeces);

  let age = deces.getFullYear() - naissance.getFullYear();
  if (
    deces.getMonth() < naissance.getMonth() ||
    (deces.getMonth() === naissance.getMonth() &&
      deces.getDate() < naissance.getDate())
  ) {
    age--;
  }

  return age;
}
