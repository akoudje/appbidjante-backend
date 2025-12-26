// src/amendes.controller.js

import prisma from "../prisma.js";
import {
  creerAmendeService,
  ajouterPaiementService,
  transfererAmendeService,
} from "../services/amende.service.js";

/* =========================
   UTIL — ENRICHIR LES CIBLES
========================= */
async function enrichCibles(cibles) {
  const idsByType = {
    INDIVIDU: [],
    LIGNEE: [],
    CATEGORIE: [],
  };

  for (const c of cibles) {
    if (!c.cibleNom || c.cibleNom === "—") {
      if (idsByType[c.type]) {
        idsByType[c.type].push(c.cibleId);
      }
    }
  }

  const [membres, lignees, categories] = await Promise.all([
    idsByType.INDIVIDU.length
      ? prisma.membre.findMany({
          where: { id: { in: idsByType.INDIVIDU } },
          select: { id: true, nom: true, prenoms: true },
        })
      : [],
    idsByType.LIGNEE.length
      ? prisma.lignee.findMany({
          where: { id: { in: idsByType.LIGNEE } },
          select: { id: true, nom: true },
        })
      : [],
    idsByType.CATEGORIE.length
      ? prisma.categorie.findMany({
          where: { id: { in: idsByType.CATEGORIE } },
          select: { id: true, label: true },
        })
      : [],
  ]);

  return cibles.map((c) => {
    // 👉 PRIORITÉ À LA VALEUR STOCKÉE
    if (c.cibleNom && c.cibleNom !== "—") {
      return c;
    }

    let cibleNom = "—";

    if (c.type === "INDIVIDU") {
      const m = membres.find((x) => x.id === c.cibleId);
      if (m) cibleNom = `${m.nom} ${m.prenoms ?? ""}`.trim();
    }

    if (c.type === "LIGNEE") {
      const l = lignees.find((x) => x.id === c.cibleId);
      if (l) cibleNom = l.nom;
    }

    if (c.type === "CATEGORIE") {
      const cat = categories.find((x) => x.id === c.cibleId);
      if (cat) cibleNom = cat.label; // ✅ CORRIGÉ
    }

    return {
      ...c,
      cibleNom,
    };
  });
}


/* =========================
   GET /api/amendes
========================= */
export async function getAllAmendes(req, res) {
  try {
    const list = await prisma.amende.findMany({
      include: {
        cibles: true,
        paiements: true,
        createdBy: {
          select: {
            id: true,
            username: true, // Correction ici aussi
            email: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });


    const enriched = await Promise.all(
      list.map(async (a) => ({
        ...a,
        cibles: await enrichCibles(a.cibles),
        totalPaye: a.paiements.reduce((s, p) => s + p.montant, 0),
        resteAPayer:
          a.montant !== null
            ? a.montant - a.paiements.reduce((s, p) => s + p.montant, 0)
            : null,
      }))
    );

    res.json(enriched);
  } catch (e) {
    console.error("ERREUR GET AMENDES:", e);
    res.status(500).json({ error: "Erreur chargement des amendes" });
  }
}

/* =========================
   GET /api/amendes/:id
========================= */
export async function getAmendeById(req, res) {
  try {
    const a = await prisma.amende.findUnique({
      where: { id: req.params.id },
      include: {
        cibles: true,
        paiements: true,
        relances: true,
      },
    });

    if (!a) {
      return res.status(404).json({ error: "Amende introuvable" });
    }

    const cibles = await enrichCibles(a.cibles);

    const totalPaye = a.paiements.reduce((s, p) => s + p.montant, 0);

    res.json({
      ...a,
      cibles,
      totalPaye,
      resteAPayer: a.montant !== null ? a.montant - totalPaye : null,
    });
  } catch (e) {
    console.error("ERREUR GET AMENDE:", e);
    res.status(500).json({ error: "Erreur chargement amende" });
  }
}

/* =========================
   POST /api/amendes
========================= */
export async function createAmende(req, res) {
  try {
    const amende = await creerAmendeService(req.body, req.user.id);
    res.status(201).json(amende);
  } catch (e) {
    console.error("ERREUR CREATE AMENDE:", e);
    res.status(400).json({ error: e.message });
  }
}

/* =========================
   POST /api/amendes/:id/paiements
========================= */
export async function addPaiementAmende(req, res) {
  try {
    console.log("📥 Requête paiement:", {
      amendeId: req.params.id,
      body: req.body,
      user: req.user.id
    });
    
    const paiement = await ajouterPaiementService(req.params.id, req.body);
    
    console.log("✅ Paiement créé:", paiement);
    
    res.status(201).json(paiement);
  } catch (e) {
    console.error("❌ Erreur paiement:", e);
    res.status(400).json({ error: e.message });
  }
}

/* =========================
   POST /api/amendes/:id/transferer
========================= */
export async function transfererAmende(req, res) {
  try {
    console.log("📥 Requête transfert:", {
      amendeId: req.params.id,
      user: req.user.id
    });
    
    const amende = await transfererAmendeService(req.params.id);
    
    console.log("✅ Amende transférée:", amende);
    
    res.json(amende);
  } catch (e) {
    console.error("❌ Erreur transfert:", e);
    res.status(400).json({ error: e.message });
  }
}

/* =========================
   PUT /api/amendes/:id
========================= */
export async function updateAmende(req, res) {
  try {
    const { id } = req.params;
    const { type, motif, description, montant, dateLimite, cibles } = req.body;

    // Vérifier que l'amende existe et est modifiable
    const amendeExistante = await prisma.amende.findUnique({
      where: { id },
      include: { cibles: true },
    });

    if (!amendeExistante) {
      return res.status(404).json({ error: "Amende introuvable" });
    }

    // Vérifier que l'amende est encore modifiable
    if (amendeExistante.statut !== "EN_ATTENTE") {
      return res.status(400).json({ 
        error: "Cette amende ne peut plus être modifiée car son statut n'est plus 'EN_ATTENTE'" 
      });
    }

    // Validation
    if (!type || !motif || !cibles || cibles.length === 0) {
      return res.status(400).json({ error: "Données invalides" });
    }

    // Validation montant pour amendes pécuniaires
    if ((type === "PECUNIAIRE" || type === "MIXTE") && (!montant || montant <= 0)) {
      return res.status(400).json({ error: "Montant invalide pour ce type d'amende" });
    }

    // S'assurer que montant est un entier pour les types pécuniaires
    let montantFinal = null;
    if (["PECUNIAIRE", "MIXTE"].includes(type)) {
      const montantInt = Math.floor(Number(montant));
      if (isNaN(montantInt) || montantInt <= 0) {
        return res.status(400).json({ error: "Montant invalide" });
      }
      montantFinal = montantInt;
    }

    // Récupérer les noms des cibles
    const ciblesAvecNoms = await Promise.all(
      cibles.map(async (c) => {
        let cibleNom = "—";
        let ciblePrenom = "";
        
        if (c.type === "INDIVIDU") {
          const m = await prisma.membre.findUnique({ 
            where: { id: c.cibleId },
            select: { nom: true, prenoms: true }
          });
          if (m) {
            cibleNom = m.nom;
            ciblePrenom = m.prenoms || "";
          }
        } else if (c.type === "LIGNEE") {
          const l = await prisma.lignee.findUnique({ 
            where: { id: c.cibleId },
            select: { nom: true }
          });
          if (l) cibleNom = l.nom;
        } else if (c.type === "CATEGORIE") {
          const cat = await prisma.categorie.findUnique({ 
            where: { id: c.cibleId },
            select: { label: true }
          });
          if (cat) cibleNom = cat.label;
        }
        
        return {
          type: c.type,
          cibleId: c.cibleId,
          cibleNom,
          ciblePrenom, // AJOUTÉ
        };
      })
    );

    // Transaction pour la mise à jour
    const amende = await prisma.$transaction(async (tx) => {
      // Supprimer les anciennes cibles
      await tx.amendeCible.deleteMany({
        where: { amendeId: id },
      });

      // Mettre à jour l'amende (inclure description)
      const updated = await tx.amende.update({
        where: { id },
        data: {
          type,
          motif,
          description: description ? description.trim() : null,
          montant: montantFinal,
          dateLimite: dateLimite ? new Date(dateLimite) : null,
          updatedAt: new Date(),
        },
      });

      // Recréer les cibles avec ciblePrenom
      await tx.amendeCible.createMany({
        data: ciblesAvecNoms.map(c => ({
          type: c.type,
          cibleId: c.cibleId,
          cibleNom: c.cibleNom,
          ciblePrenom: c.ciblePrenom, // AJOUTÉ
          amendeId: id,
        })),
      });

      return updated;
    });

    // Récupérer l'amende complète avec ses relations
    const amendeComplete = await prisma.amende.findUnique({
      where: { id },
      include: { 
        cibles: true,
        paiements: {
          orderBy: { datePaiement: 'desc' }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      },
    });

    // Calculer les totaux
    const totalPaye = amendeComplete.paiements.reduce((s, p) => s + p.montant, 0);
    
    res.json({
      ...amendeComplete,
      totalPaye,
      resteAPayer: amendeComplete.montant !== null ? amendeComplete.montant - totalPaye : null,
    });
    
  } catch (e) {
    console.error("ERREUR UPDATE AMENDE:", e);
    
    // Gérer les erreurs spécifiques
    if (e.code === 'P2025') {
      return res.status(404).json({ error: "Amende introuvable" });
    }
    
    if (e.code === 'P2002') {
      return res.status(400).json({ error: "Violation de contrainte unique" });
    }
    
    res.status(500).json({ 
      error: "Erreur lors de la modification de l'amende",
      details: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
}


