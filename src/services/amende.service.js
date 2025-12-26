// src/services/amende.service.js

import prisma from "../prisma.js";
import { generateReference } from "../utils/reference.js";

/* ============================================================
   RÉSOLUTION DES INFORMATIONS DE CIBLE
   ============================================================ */

async function resolveCibleNom(cible) {

  const type = cible.type?.toUpperCase();

  switch (cible.type) {
    case "INDIVIDU": {
      const m = await prisma.membre.findUnique({
        where: { id: cible.cibleId },
        select: { nom: true, prenoms: true },
      });
      return m ? `${m.nom} ${m.prenoms ?? ""}`.trim() : "—";
    }

    case "LIGNEE": {
      const l = await prisma.lignee.findUnique({
        where: { id: cible.cibleId },
        select: { nom: true },
      });
      return l?.nom || "—";
    }

    case "CATEGORIE": {
      const c = await prisma.categorie.findUnique({
        where: { id: cible.cibleId },
        select: { label: true },
      });
      return c?.label || "—";
    }

    default:
      return "—";
  }
}

async function resolveCiblePrenom(cible) {
  if (cible.type === "INDIVIDU") {
    const m = await prisma.membre.findUnique({
      where: { id: cible.cibleId },
      select: { prenoms: true },
    });
    return m?.prenoms || "";
  }
  return "";
}

/* ============================================================
   CRÉATION D’UNE AMENDE
   ============================================================ */

export async function creerAmendeService(data, userId) {
  const {
    type,
    motif,
    description,
    montant,
    cibles = [],
    dateLimite,
  } = data;

  // Validation
  if (!type || !motif || cibles.length === 0) {
    throw new Error("Type, motif et au moins une cible sont obligatoires");
  }

  if (
    (type === "PECUNIAIRE" || type === "MIXTE") &&
    (!montant || montant <= 0)
  ) {
    throw new Error(
      "Montant obligatoire et > 0 pour les amendes pécuniaires ou mixtes"
    );
  }

  // Résolution complète des cibles
  const ciblesAvecInfos = await Promise.all(
    cibles.map(async (c) => ({
      type: c.type,
      cibleId: c.cibleId,
      cibleNom: await resolveCibleNom(c),
      ciblePrenom: await resolveCiblePrenom(c),
    }))
  );

  const dataToCreate = {
    reference: generateReference("AM"),
    type,
    motif,
    description: description || null,
    montant: ["PECUNIAIRE", "MIXTE"].includes(type)
      ? Number(montant)
      : null,
    dateLimite: dateLimite ? new Date(dateLimite) : null,

    createdBy: {
      connect: { id: userId },
    },

    cibles: {
      create: ciblesAvecInfos,
    },
  };

  try {
    return await prisma.amende.create({
      data: dataToCreate,
      include: { cibles: true },
    });
  } catch (error) {
    console.error("❌ Erreur création amende:", error);
    throw new Error(`Erreur lors de la création : ${error.message}`);
  }
}

/* ============================================================
   AJOUT D’UN PAIEMENT
   ============================================================ */

export async function ajouterPaiementService(amendeId, data) {
  const { montant, mode, reference } = data;

  if (!montant || montant <= 0) {
    throw new Error("Montant de paiement invalide");
  }

  const amende = await prisma.amende.findUnique({
    where: { id: amendeId },
    include: { paiements: true },
  });

  if (!amende) throw new Error("Amende introuvable");

  if (amende.montant === null) {
    throw new Error("Cette amende ne peut pas recevoir de paiement");
  }

  const totalPaye = amende.paiements.reduce((s, p) => s + p.montant, 0);
  const nouveauTotal = totalPaye + montant;

  if (nouveauTotal > amende.montant) {
    throw new Error(
      `Le montant dépasse le reste à payer (${amende.montant - totalPaye} FCFA)`
    );
  }

  let statut = "PARTIEL";
  if (nouveauTotal >= amende.montant) statut = "PAYEE";

  return prisma.$transaction(async (tx) => {
    const paiement = await tx.amendePaiement.create({
      data: {
        montant,
        mode,
        reference: reference || null,
        amendeId,
      },
    });

    await tx.amende.update({
      where: { id: amendeId },
      data: { statut },
    });

    return paiement;
  });
}

/* ============================================================
   TRANSFERT INDIVIDU → LIGNÉE
   ============================================================ */

export async function transfererAmendeService(amendeId) {
  const amende = await prisma.amende.findUnique({
    where: { id: amendeId },
    include: { cibles: true },
  });

  if (!amende) throw new Error("Amende introuvable");

  if (amende.statut === "PAYEE") {
    throw new Error("Impossible de transférer une amende déjà payée");
  }

  const cibleIndividu = amende.cibles.find(
    (c) => c.type === "INDIVIDU" && !c.estTransferee
  );

  if (!cibleIndividu) {
    throw new Error("Aucune cible individuelle transférable");
  }

  const individu = await prisma.membre.findUnique({
    where: { id: cibleIndividu.cibleId },
    include: { lignee: true },
  });

  if (!individu?.lignee) {
    throw new Error("Lignée introuvable pour cet individu");
  }

  return prisma.$transaction(async (tx) => {
    await tx.amendeCible.update({
      where: { id: cibleIndividu.id },
      data: { estTransferee: true },
    });

    await tx.amendeCible.create({
      data: {
        type: "LIGNEE",
        cibleId: individu.lignee.id,
        cibleNom: individu.lignee.nom,
        ciblePrenom: "",
        amendeId,
      },
    });

    return tx.amende.update({
      where: { id: amendeId },
      data: { statut: "TRANSFEREE" },
    });
  });
}

/* ============================================================
   DÉTAIL COMPLET D’UNE AMENDE
   ============================================================ */

export async function getAmendeDetailService(amendeId) {
  const amende = await prisma.amende.findUnique({
    where: { id: amendeId },
    include: {
      cibles: true,
      paiements: true,
      relances: true,
      createdBy: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
        },
      },
    },
  });

  if (!amende) throw new Error("Amende introuvable");

  const totalPaye = amende.paiements.reduce((s, p) => s + p.montant, 0);

  return {
    ...amende,
    totalPaye,
    resteAPayer:
      amende.montant !== null ? amende.montant - totalPaye : null,
  };
}
