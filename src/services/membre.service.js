// src/services/membre.service.js

import prisma from "../prisma.js";

export async function getMembresWithDetails(filters = {}) {
  const { statut, search, includeCategories = false } = filters;
  
  const where = {};
  
  if (statut) {
    where.statut = statut;
  }
  
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { matricule: { contains: search, mode: 'insensitive' } },
    ];
  }

  const include = {};
  
  if (includeCategories) {
    include.categorie = {
      select: {
        id: true,
        nom: true,
      }
    };
  }

  const membres = await prisma.membre.findMany({
    where,
    include: Object.keys(include).length > 0 ? include : undefined,
    orderBy: [
      { nom: 'asc' },
      { prenom: 'asc' },
    ],
  });

  return membres;
}