// src/helpers/resolveDestinataires.js
import prisma from "../prisma.js";

export default async function resolveDestinataires(communique) {
  const { cibleType, cibleIds } = communique;

  // 🔹 TOUS les membres actifs
  if (cibleType === "ALL") {
    return prisma.membre.findMany({
      where: {
        statutMembre: { in: ["Actif", "Actif Exempté", "Non actif"] },
      },
    });
  }

  // 🔹 LIGNÉES
  if (cibleType === "LIGNEE") {
    if (!Array.isArray(cibleIds) || cibleIds.length === 0) {
      return [];
    }

    return prisma.membre.findMany({
      where: {
        ligneeId: { in: cibleIds },
        statutMembre: { in: ["Actif", "Actif Exempté", "Non actif"] },
      },
    });
  }

  // 🔹 CATÉGORIES
  if (cibleType === "CATEGORIE") {
    if (!Array.isArray(cibleIds) || cibleIds.length === 0) {
      return [];
    }

    return prisma.membre.findMany({
      where: {
        categorieId: { in: cibleIds },
        statutMembre: { in: ["Actif", "Actif Exempté", "Non actif"] },
      },
    });
  }

  // 🔹 GRANDE FAMILLE
  if (cibleType === "FAMILLE") {
    if (!Array.isArray(cibleIds) || cibleIds.length === 0) {
      return [];
    }

    return prisma.membre.findMany({
      where: {
        lignee: {
          familleId: { in: cibleIds },
        },
        statutMembre: { in: ["Actif", "Actif Exempté", "Non actif"] },
      },
    });
  }

  // 🔹 CUSTOM / fallback
  return [];
}

export { resolveDestinataires };
