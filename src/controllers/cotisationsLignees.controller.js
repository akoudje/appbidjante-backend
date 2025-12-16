// src/controllers/cotisationsLignees.controller.js

import prisma from "../prisma.js";
import { Prisma } from "@prisma/client";

/**
 * 📌 GET /api/cotisations-lignees
 * Liste toutes les cotisations de lignées avec pagination et filtres
 */
export async function getAllCotisationsLignees(req, res) {
  try {
    const { 
      page = 1, 
      limit = 20,
      statut,
      ligneeId,
      familleId,
      decesId,
      dateFrom,
      dateTo,
      search,
      sortBy = "date",
      sortOrder = "desc"
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construction de la condition WHERE
    const where = {};
    
    // Filtre par statut
    if (statut) {
      where.statut = statut;
    }
    
    // Filtre par lignée
    if (ligneeId) {
      where.ligneeId = ligneeId;
    }
    
    // Filtre par famille
    if (familleId) {
      where.lignee = { familleId };
    }
    
    // Filtre par décès
    if (decesId) {
      where.decesId = decesId;
    }
    
    // Filtre par date
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    
    // Recherche textuelle
    if (search) {
      where.OR = [
        { motif: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { lignee: { nom: { contains: search, mode: 'insensitive' } } },
        { lignee: { famille: { nom: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Exclure les cotisations annulées par défaut
    if (!statut) {
      where.statut = { not: "Annule" };
    }

    const [cotisations, total, stats] = await Promise.all([
      prisma.cotisationLignee.findMany({
        where,
        include: {
          lignee: {
            include: { 
              famille: true 
            }
          },
          deces: {
            include: {
              membre: {
                select: {
                  id: true,
                  nom: true,
                  prenoms: true
                }
              }
            }
          },
          paiements: {
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: skip,
        take: parseInt(limit),
      }),
      prisma.cotisationLignee.count({ where }),
      // Statistiques globales
      prisma.cotisationLignee.aggregate({
        where: { ...where, statut: { not: "Annule" } },
        _sum: {
          montant: true,
          montantPaye: true,
          montantRestant: true
        },
        _avg: {
          montant: true
        },
        _count: true
      })
    ]);

    res.json({
      cotisations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        totalCotisations: stats._count,
        totalMontant: stats._sum.montant || 0,
        totalPaye: stats._sum.montantPaye || 0,
        totalRestant: stats._sum.montantRestant || 0,
        moyenneMontant: Math.round(stats._avg.montant || 0)
      }
    });
  } catch (error) {
    console.error("Erreur getAllCotisationsLignees :", error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des cotisations de lignées",
      code: "SERVER_ERROR"
    });
  }
}

/**
 * 📌 GET /api/cotisations-lignees/:id
 * Récupérer une cotisation de lignée par ID
 */
export async function getCotisationLignee(req, res) {
  try {
    const { id } = req.params;

    const cotisation = await prisma.cotisationLignee.findUnique({
      where: { id },
      include: {
        lignee: {
          include: { 
            famille: true 
          }
        },
        deces: {
          include: {
            membre: {
              include: {
                lignee: { include: { famille: true } }
              }
            }
          }
        },
        paiements: {
          orderBy: { date: 'desc' },
          include: {
            cotisation: {
              select: {
                lignee: {
                  select: {
                    nom: true,
                    famille: { select: { nom: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!cotisation) {
      return res.status(404).json({ 
        error: "Cotisation de lignée introuvable",
        code: "COTISATION_LIGNEE_NOT_FOUND"
      });
    }

    // Calcul des totaux des paiements
    const totalPaiements = cotisation.paiements.reduce((sum, p) => sum + p.montant, 0);
    const restantAPayer = cotisation.montant - totalPaiements;

    res.json({
      ...cotisation,
      finances: {
        totalPaiements,
        restantAPayer,
        tauxPaiement: cotisation.montant > 0 ? 
          Math.round((totalPaiements / cotisation.montant) * 100) : 0
      }
    });
  } catch (error) {
    console.error("Erreur getCotisationLignee :", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2023') {
        return res.status(400).json({ 
          error: "Format d'ID invalide",
          code: "INVALID_ID_FORMAT"
        });
      }
    }
    
    res.status(500).json({ 
      error: "Erreur lors de la récupération de la cotisation de lignée",
      code: "SERVER_ERROR"
    });
  }
}

/**
 * 📌 POST /api/cotisations-lignees
 * Création manuelle d'une cotisation de lignée
 */
export async function createCotisationLignee(req, res) {
  try {
    const {
      ligneeId,
      date,
      montant,
      motif,
      description,
      statut = "Impaye",
      decesId,
      dateEcheance
    } = req.body;

    // Validation des champs obligatoires
    if (!ligneeId || !montant) {
      return res.status(400).json({ 
        error: "L'ID de la lignée et le montant sont obligatoires",
        code: "MISSING_REQUIRED_FIELDS"
      });
    }

    // Vérifier que la lignée existe
    const lignee = await prisma.lignee.findUnique({
      where: { id: ligneeId },
      include: { famille: true }
    });

    if (!lignee) {
      return res.status(404).json({ 
        error: "Lignée introuvable",
        code: "LIGNEE_NOT_FOUND"
      });
    }

    // Vérifier si un décès est spécifié
    if (decesId) {
      const deces = await prisma.deces.findUnique({
        where: { id: decesId }
      });

      if (!deces) {
        return res.status(404).json({ 
          error: "Décès introuvable",
          code: "DECES_NOT_FOUND"
        });
      }

      // Vérifier les doublons : même lignée + même décès
      const existingCotisation = await prisma.cotisationLignee.findFirst({
        where: {
          ligneeId,
          decesId,
          statut: { not: "Annule" }
        }
      });

      if (existingCotisation) {
        return res.status(409).json({ 
          error: "Une cotisation de lignée existe déjà pour cette lignée et ce décès",
          code: "COTISATION_LIGNEE_ALREADY_EXISTS"
        });
      }
    }

    // Calcul des montants initiaux
    const montantNum = Number(montant);
    const montantPaye = statut === "Paye" ? montantNum : 0;
    const montantRestant = montantNum - montantPaye;

    const cotisation = await prisma.cotisationLignee.create({
      data: {
        ligneeId,
        decesId: decesId || null,
        date: date ? new Date(date) : new Date(),
        montant: montantNum,
        motif: motif || null,
        description: description || null,
        statut,
        montantPaye,
        montantRestant,
        dateEcheance: dateEcheance ? new Date(dateEcheance) : null
      },
      include: {
        lignee: {
          include: { famille: true }
        }
      }
    });

    // Si la cotisation est marquée comme payée, créer un paiement
    if (statut === "Paye") {
      await prisma.paiementLignee.create({
        data: {
          cotisationId: cotisation.id,
          montant: montantNum,
          date: new Date(),
          mode: "Especes",
          reference: `COT-L-${cotisation.id.substring(0, 8)}`,
          commentaire: "Paiement complet à la création"
        }
      });
    }

    res.status(201).json({
      message: "Cotisation de lignée créée avec succès",
      cotisation
    });
  } catch (error) {
    console.error("Erreur createCotisationLignee :", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return res.status(409).json({ 
            error: "Une cotisation similaire existe déjà",
            code: "UNIQUE_CONSTRAINT"
          });
        case 'P2003':
          return res.status(400).json({ 
            error: "Référence étrangère invalide",
            code: "FOREIGN_KEY_CONSTRAINT"
          });
      }
    }
    
    res.status(500).json({ 
      error: "Erreur lors de la création de la cotisation de lignée",
      code: "SERVER_ERROR"
    });
  }
}

/**
 * 📌 PUT /api/cotisations-lignees/:id
 * Mise à jour d'une cotisation de lignée
 */
export async function updateCotisationLignee(req, res) {
  try {
    const { id } = req.params;
    const {
      ligneeId,
      date,
      montant,
      motif,
      description,
      statut,
      decesId,
      dateEcheance
    } = req.body;

    // Vérifier si la cotisation existe
    const cotisationExistante = await prisma.cotisationLignee.findUnique({
      where: { id }
    });

    if (!cotisationExistante) {
      return res.status(404).json({ 
        error: "Cotisation de lignée introuvable",
        code: "COTISATION_LIGNEE_NOT_FOUND"
      });
    }

    // Si changement de lignée, vérifier la nouvelle lignée
    if (ligneeId && ligneeId !== cotisationExistante.ligneeId) {
      const nouvelleLignee = await prisma.lignee.findUnique({
        where: { id: ligneeId }
      });

      if (!nouvelleLignee) {
        return res.status(404).json({ 
          error: "Nouvelle lignée introuvable",
          code: "LIGNEE_NOT_FOUND"
        });
      }
    }

    // Si changement de décès, vérifier les doublons
    const nouveauDecesId = decesId !== undefined ? decesId : cotisationExistante.decesId;
    const nouvelleLigneeId = ligneeId || cotisationExistante.ligneeId;

    if (nouveauDecesId) {
      const doublon = await prisma.cotisationLignee.findFirst({
        where: {
          ligneeId: nouvelleLigneeId,
          decesId: nouveauDecesId,
          id: { not: id },
          statut: { not: "Annule" }
        }
      });

      if (doublon) {
        return res.status(409).json({ 
          error: "Une cotisation de lignée existe déjà pour cette lignée et ce décès",
          code: "DUPLICATE_COTISATION_LIGNEE"
        });
      }
    }

    // Si changement de montant, recalculer les montants
    let montantPaye = cotisationExistante.montantPaye;
    let montantRestant = cotisationExistante.montantRestant;

    if (montant !== undefined) {
      const nouveauMontant = Number(montant);
      montantPaye = Math.min(montantPaye, nouveauMontant);
      montantRestant = nouveauMontant - montantPaye;
      
      // Si le nouveau montant est inférieur à ce qui est déjà payé
      if (nouveauMontant < montantPaye) {
        return res.status(400).json({ 
          error: "Le montant ne peut pas être inférieur au montant déjà payé",
          code: "INVALID_AMOUNT"
        });
      }
    }

    // Si changement de statut, mettre à jour les montants
    if (statut === "Paye" && cotisationExistante.statut !== "Paye") {
      montantPaye = montant || cotisationExistante.montant;
      montantRestant = 0;
    } else if (statut === "Annule") {
      // Si annulation, tout devient 0
      montantPaye = 0;
      montantRestant = 0;
    }

    const cotisation = await prisma.cotisationLignee.update({
      where: { id },
      data: {
        ...(ligneeId && { ligneeId }),
        ...(date && { date: new Date(date) }),
        ...(montant !== undefined && { montant: Number(montant) }),
        ...(motif !== undefined && { motif }),
        ...(description !== undefined && { description }),
        ...(statut !== undefined && { statut }),
        ...(decesId !== undefined && { decesId }),
        ...(dateEcheance !== undefined && { dateEcheance: dateEcheance ? new Date(dateEcheance) : null }),
        montantPaye,
        montantRestant,
        updatedAt: new Date()
      },
      include: {
        lignee: {
          include: { famille: true }
        },
        paiements: {
          orderBy: { date: 'desc' }
        }
      }
    });

    res.json({
      message: "Cotisation de lignée mise à jour avec succès",
      cotisation
    });
  } catch (error) {
    console.error("Erreur updateCotisationLignee :", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return res.status(404).json({ 
            error: "Cotisation de lignée introuvable",
            code: "COTISATION_LIGNEE_NOT_FOUND"
          });
        case 'P2002':
          return res.status(409).json({ 
            error: "Conflit de contrainte unique",
            code: "UNIQUE_CONSTRAINT"
          });
      }
    }
    
    res.status(500).json({ 
      error: "Erreur lors de la mise à jour de la cotisation de lignée",
      code: "SERVER_ERROR"
    });
  }
}

/**
 * 📌 PUT /api/cotisations-lignees/:id/pay
 * Marquer une cotisation de lignée comme payée (paiement complet)
 */
export async function payCotisationLignee(req, res) {
  try {
    const { id } = req.params;
    const { mode = "Especes", reference, commentaire } = req.body;

    // Vérifier si la cotisation existe
    const cotisation = await prisma.cotisationLignee.findUnique({
      where: { id },
      include: {
        paiements: true,
        lignee: {
          select: {
            nom: true,
            famille: { select: { nom: true } }
          }
        }
      }
    });

    if (!cotisation) {
      return res.status(404).json({ 
        error: "Cotisation de lignée introuvable",
        code: "COTISATION_LIGNEE_NOT_FOUND"
      });
    }

    // Vérifier si la cotisation n'est pas déjà payée
    if (cotisation.statut === "Paye") {
      return res.status(400).json({ 
        error: "Cette cotisation de lignée est déjà payée",
        code: "ALREADY_PAID"
      });
    }

    // Vérifier si la cotisation n'est pas annulée
    if (cotisation.statut === "Annule") {
      return res.status(400).json({ 
        error: "Impossible de payer une cotisation de lignée annulée",
        code: "COTISATION_LIGNEE_ANNULLEE"
      });
    }

    // Calculer le montant restant à payer
    const totalPaiements = cotisation.paiements.reduce((sum, p) => sum + p.montant, 0);
    const montantRestant = cotisation.montant - totalPaiements;

    if (montantRestant <= 0) {
      return res.status(400).json({ 
        error: "Cette cotisation de lignée est déjà entièrement payée",
        code: "ALREADY_FULLY_PAID"
      });
    }

    // Utiliser une transaction pour garantir l'intégrité
    const result = await prisma.$transaction(async (tx) => {
      // Créer le paiement
      const paiement = await tx.paiementLignee.create({
        data: {
          cotisationId: id,
          montant: montantRestant,
          date: new Date(),
          mode,
          reference: reference || `PAY-L-${Date.now()}`,
          commentaire: commentaire || "Paiement complet",
          validePar: req.user?.id || "system",
          valideLe: new Date()
        }
      });

      // Mettre à jour la cotisation
      const cotisationMiseAJour = await tx.cotisationLignee.update({
        where: { id },
        data: {
          statut: "Paye",
          montantPaye: cotisation.montant,
          montantRestant: 0,
          updatedAt: new Date()
        },
        include: {
          lignee: {
            include: { famille: true }
          },
          paiements: {
            orderBy: { date: 'desc' }
          }
        }
      });

      // Log de l'action
      await tx.logUtilisateur.create({
        data: {
          utilisateurId: req.user?.id || "system",
          action: "pay_cotisation_lignee",
          details: JSON.stringify({
            cotisationId: id,
            lignee: cotisation.lignee.nom,
            famille: cotisation.lignee.famille.nom,
            montant: montantRestant,
            mode
          }),
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      return { paiement, cotisation: cotisationMiseAJour };
    });

    res.json({
      message: "Cotisation de lignée marquée comme payée avec succès",
      ...result
    });
  } catch (error) {
    console.error("Erreur payCotisationLignee :", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: "Cotisation de lignée introuvable",
          code: "COTISATION_LIGNEE_NOT_FOUND"
        });
      }
    }
    
    res.status(500).json({ 
      error: "Erreur lors du paiement de la cotisation de lignée",
      code: "SERVER_ERROR"
    });
  }
}

/**
 * 📌 POST /api/cotisations-lignees/:id/paiements
 * Ajouter un paiement partiel à une cotisation de lignée
 */
export async function addPaiementLignee(req, res) {
  try {
    const { id } = req.params;
    const { montant, mode = "Especes", reference, commentaire } = req.body;

    // Validation
    if (!montant || montant <= 0) {
      return res.status(400).json({ 
        error: "Le montant doit être supérieur à 0",
        code: "INVALID_AMOUNT"
      });
    }

    // Vérifier si la cotisation existe
    const cotisation = await prisma.cotisationLignee.findUnique({
      where: { id },
      include: {
        paiements: true,
        lignee: {
          select: {
            nom: true,
            famille: { select: { nom: true } }
          }
        }
      }
    });

    if (!cotisation) {
      return res.status(404).json({ 
        error: "Cotisation de lignée introuvable",
        code: "COTISATION_LIGNEE_NOT_FOUND"
      });
    }

    // Vérifier si la cotisation n'est pas déjà payée
    if (cotisation.statut === "Paye") {
      return res.status(400).json({ 
        error: "Cette cotisation de lignée est déjà entièrement payée",
        code: "ALREADY_FULLY_PAID"
      });
    }

    // Vérifier si la cotisation n'est pas annulée
    if (cotisation.statut === "Annule") {
      return res.status(400).json({ 
        error: "Impossible d'ajouter un paiement à une cotisation annulée",
        code: "COTISATION_LIGNEE_ANNULLEE"
      });
    }

    // Calculer le montant déjà payé et le restant
    const totalPaiements = cotisation.paiements.reduce((sum, p) => sum + p.montant, 0);
    const montantRestantAvant = cotisation.montant - totalPaiements;

    // Vérifier que le paiement ne dépasse pas le montant restant
    if (montant > montantRestantAvant) {
      return res.status(400).json({ 
        error: `Le paiement (${montant}) dépasse le montant restant (${montantRestantAvant})`,
        code: "PAYMENT_EXCEEDS_REMAINING"
      });
    }

    // Utiliser une transaction pour garantir l'intégrité
    const result = await prisma.$transaction(async (tx) => {
      // Créer le paiement
      const paiement = await tx.paiementLignee.create({
        data: {
          cotisationId: id,
          montant: Number(montant),
          date: new Date(),
          mode,
          reference: reference || `PAY-PARTIEL-${Date.now()}`,
          commentaire: commentaire || "Paiement partiel",
          validePar: req.user?.id || "system",
          valideLe: new Date()
        }
      });

      // Calculer les nouveaux totaux
      const nouveauTotalPaiements = totalPaiements + Number(montant);
      const nouveauMontantRestant = cotisation.montant - nouveauTotalPaiements;
      
      // Déterminer le nouveau statut
      let nouveauStatut = cotisation.statut;
      if (nouveauMontantRestant === 0) {
        nouveauStatut = "Paye";
      } else if (nouveauTotalPaiements > 0 && nouveauMontantRestant > 0) {
        nouveauStatut = "PartiellementPaye";
      }

      // Mettre à jour la cotisation
      const cotisationMiseAJour = await tx.cotisationLignee.update({
        where: { id },
        data: {
          statut: nouveauStatut,
          montantPaye: nouveauTotalPaiements,
          montantRestant: nouveauMontantRestant,
          updatedAt: new Date()
        },
        include: {
          lignee: {
            include: { famille: true }
          },
          paiements: {
            orderBy: { date: 'desc' }
          }
        }
      });

      // Log de l'action
      await tx.logUtilisateur.create({
        data: {
          utilisateurId: req.user?.id || "system",
          action: "add_paiement_lignee",
          details: JSON.stringify({
            cotisationId: id,
            lignee: cotisation.lignee.nom,
            famille: cotisation.lignee.famille.nom,
            montant,
            mode,
            nouveauStatut
          }),
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      return { paiement, cotisation: cotisationMiseAJour };
    });

    res.json({
      message: "Paiement ajouté avec succès",
      ...result
    });
  } catch (error) {
    console.error("Erreur addPaiementLignee :", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: "Cotisation de lignée introuvable",
          code: "COTISATION_LIGNEE_NOT_FOUND"
        });
      }
    }
    
    res.status(500).json({ 
      error: "Erreur lors de l'ajout du paiement",
      code: "SERVER_ERROR"
    });
  }
}

/**
 * 📌 POST /api/cotisations-lignees/generate-from-deces/:decesId
 * Génération automatique des cotisations de lignées pour un décès
 */
export async function generateCotisationsLigneesForDeces(req, res) {
  try {
    const { decesId } = req.params;
    const { montantParLignee } = req.body;

    // Vérifier que le décès existe
    const deces = await prisma.deces.findUnique({
      where: { id: decesId },
      include: {
        membre: {
          include: {
            categorie: true
          }
        }
      }
    });

    if (!deces) {
      return res.status(404).json({ 
        error: "Décès introuvable",
        code: "DECES_NOT_FOUND"
      });
    }

    // Déterminer le montant de la cotisation
    let montant = montantParLignee || 10000; // Montant par défaut
    
    // Si le membre décédé a une catégorie avec montantCotisationLignee, l'utiliser
    if (deces.membre.categorie?.montantCotisationLignee > 0) {
      montant = deces.membre.categorie.montantCotisationLignee;
    }

    // Récupérer toutes les lignées
    const lignees = await prisma.lignee.findMany({
      include: { famille: true },
      where: {
        // Exclure la lignée du membre décédé si nécessaire
        // id: { not: deces.membre.ligneeId }
      }
    });

    if (lignees.length === 0) {
      return res.json({
        message: "Aucune lignée trouvée",
        totalLignees: 0,
        totalCreated: 0,
        deces: {
          id: deces.id,
          membre: deces.membre.nom + " " + deces.membre.prenoms,
          dateDeces: deces.dateDeces
        }
      });
    }

    // Préparer les données des cotisations
    const cotisationsData = lignees.map((lignee) => ({
      ligneeId: lignee.id,
      decesId,
      date: new Date(),
      montant,
      motif: `Cotisation lignée décès - ${deces.membre.nom} ${deces.membre.prenoms}`,
      description: `Cotisation obligatoire de lignée suite au décès de ${deces.membre.nom} ${deces.membre.prenoms} (${deces.dateDeces.toLocaleDateString()})`,
      statut: "Impaye",
      montantPaye: 0,
      montantRestant: montant,
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    }));

    // Créer les cotisations en évitant les doublons
    const result = await prisma.$transaction(async (tx) => {
      // Filtrer les lignées qui n'ont pas déjà de cotisation pour ce décès
      const cotisationsExistantes = await tx.cotisationLignee.findMany({
        where: {
          decesId,
          ligneeId: { in: lignees.map(l => l.id) }
        },
        select: { ligneeId: true }
      });

      const ligneesIdsAvecCotisation = new Set(cotisationsExistantes.map(c => c.ligneeId));
      const cotisationsAFiltrer = cotisationsData.filter(c => !ligneesIdsAvecCotisation.has(c.ligneeId));

      if (cotisationsAFiltrer.length === 0) {
        return { count: 0 };
      }

      // Créer les cotisations
      const result = await tx.cotisationLignee.createMany({
        data: cotisationsAFiltrer,
        skipDuplicates: true
      });

      // Log de l'action
      await tx.logUtilisateur.create({
        data: {
          utilisateurId: req.user?.id || "system",
          action: "generate_cotisations_lignees_deces",
          details: JSON.stringify({
            decesId,
            membreDecede: deces.membre.nom + " " + deces.membre.prenoms,
            ligneeDecede: deces.membre.ligneeId,
            totalCotisations: result.count,
            montantParCotisation: montant
          }),
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      return result;
    });

    res.json({
      message: "Cotisations de lignées générées avec succès",
      totalLignees: lignees.length,
      totalCreated: result.count || 0,
      montantParCotisation: montant,
      totalMontant: (result.count || 0) * montant,
      deces: {
        id: deces.id,
        membre: deces.membre.nom + " " + deces.membre.prenoms,
        dateDeces: deces.dateDeces
      }
    });
  } catch (error) {
    console.error("Erreur generateCotisationsLigneesForDeces :", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: "Décès introuvable",
          code: "DECES_NOT_FOUND"
        });
      }
    }
    
    res.status(500).json({ 
      error: "Erreur lors de la génération des cotisations de lignées",
      code: "SERVER_ERROR"
    });
  }
}

/**
 * 📌 GET /api/cotisations-lignees/lignee/:ligneeId
 * Récupérer les cotisations d'une lignée
 */
export async function getCotisationsLigneeByLignee(req, res) {
  try {
    const { ligneeId } = req.params;
    const { statut, dateFrom, dateTo } = req.query;

    // Vérifier que la lignée existe
    const lignee = await prisma.lignee.findUnique({
      where: { id: ligneeId },
      include: { famille: true }
    });

    if (!lignee) {
      return res.status(404).json({ 
        error: "Lignée introuvable",
        code: "LIGNEE_NOT_FOUND"
      });
    }

    const where = { ligneeId };
    
    if (statut) {
      where.statut = statut;
    }
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [cotisations, stats] = await Promise.all([
      prisma.cotisationLignee.findMany({
        where,
        include: {
          deces: {
            include: {
              membre: {
                select: {
                  nom: true,
                  prenoms: true
                }
              }
            }
          },
          paiements: {
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.cotisationLignee.aggregate({
        where: { ...where, statut: { not: "Annule" } },
        _sum: {
          montant: true,
          montantPaye: true,
          montantRestant: true
        },
        _count: true
      })
    ]);

    res.json({
      lignee: {
        id: lignee.id,
        nom: lignee.nom,
        famille: lignee.famille
      },
      cotisations,
      stats: {
        totalCotisations: stats._count,
        totalMontant: stats._sum.montant || 0,
        totalPaye: stats._sum.montantPaye || 0,
        totalRestant: stats._sum.montantRestant || 0,
        tauxPaiement: stats._sum.montant ? 
          Math.round(((stats._sum.montantPaye || 0) / stats._sum.montant) * 100) : 0
      }
    });
  } catch (error) {
    console.error("Erreur getCotisationsLigneeByLignee :", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2023') {
        return res.status(400).json({ 
          error: "Format d'ID invalide",
          code: "INVALID_ID_FORMAT"
        });
      }
    }
    
    res.status(500).json({ 
      error: "Erreur lors de la récupération des cotisations de la lignée",
      code: "SERVER_ERROR"
    });
  }
}

/**
 * 📌 DELETE /api/cotisations-lignees/:id
 * Annuler une cotisation de lignée (soft delete)
 */
export async function deleteCotisationLignee(req, res) {
  try {
    const { id } = req.params;

    // Vérifier si la cotisation existe
    const cotisation = await prisma.cotisationLignee.findUnique({
      where: { id },
      include: {
        lignee: {
          select: {
            nom: true,
            famille: { select: { nom: true } }
          }
        },
        paiements: true
      }
    });

    if (!cotisation) {
      return res.status(404).json({ 
        error: "Cotisation de lignée introuvable",
        code: "COTISATION_LIGNEE_NOT_FOUND"
      });
    }

    // Vérifier si la cotisation a des paiements
    if (cotisation.paiements.length > 0) {
      return res.status(400).json({
        error: "Impossible de supprimer une cotisation de lignée avec des paiements",
        details: {
          paiements: cotisation.paiements.length,
          suggestion: "Annulez la cotisation à la place"
        },
        code: "COTISATION_LIGNEE_HAS_PAYMENTS"
      });
    }

    // Annuler la cotisation (soft delete)
    const cotisationAnnulee = await prisma.cotisationLignee.update({
      where: { id },
      data: {
        statut: "Annule",
        montantPaye: 0,
        montantRestant: 0,
        updatedAt: new Date()
      }
    });

    res.json({
      message: "Cotisation de lignée annulée avec succès",
      cotisation: cotisationAnnulee,
      code: "COTISATION_LIGNEE_CANCELLED"
    });
  } catch (error) {
    console.error("Erreur deleteCotisationLignee :", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: "Cotisation de lignée introuvable",
          code: "COTISATION_LIGNEE_NOT_FOUND"
        });
      }
    }
    
    res.status(500).json({ 
      error: "Erreur lors de la suppression de la cotisation de lignée",
      code: "SERVER_ERROR"
    });
  }
}

/**
 * 📌 GET /api/cotisations-lignees/stats/global
 * Statistiques globales des cotisations de lignées
 */
export async function getCotisationsLigneesStats(req, res) {
  try {
    const { annee, familleId } = req.query;

    const where = { statut: { not: "Annule" } };
    
    if (annee) {
      where.date = {
        gte: new Date(`${annee}-01-01`),
        lt: new Date(`${parseInt(annee) + 1}-01-01`)
      };
    }
    
    if (familleId) {
      where.lignee = { familleId };
    }

    const [
      statsGlobales,
      statsParStatut,
      statsParMois,
      topLignees,
      evolutionAnnuelle
    ] = await Promise.all([
      // Statistiques globales
      prisma.cotisationLignee.aggregate({
        where,
        _sum: {
          montant: true,
          montantPaye: true,
          montantRestant: true
        },
        _avg: { montant: true },
        _count: true
      }),
      // Répartition par statut
      prisma.cotisationLignee.groupBy({
        by: ['statut'],
        _count: true,
        _sum: {
          montant: true,
          montantPaye: true,
          montantRestant: true
        },
        where
      }),
      // Répartition par mois (année en cours)
      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM "date") as mois,
          COUNT(*) as nombre,
          SUM("montant") as total_montant,
          SUM("montantPaye") as total_paye,
          SUM("montantRestant") as total_restant
        FROM "CotisationLignee"
        WHERE EXTRACT(YEAR FROM "date") = EXTRACT(YEAR FROM CURRENT_DATE)
        AND "statut" != 'Annule'
        ${annee ? Prisma.sql`AND EXTRACT(YEAR FROM "date") = ${parseInt(annee)}` : Prisma.empty}
        ${familleId ? Prisma.sql`AND "ligneeId" IN (
          SELECT id FROM "Lignee" WHERE "familleId" = ${familleId}
        )` : Prisma.empty}
        GROUP BY EXTRACT(MONTH FROM "date")
        ORDER BY mois
      `,
      // Top 10 lignées avec le plus de cotisations impayées
      prisma.cotisationLignee.groupBy({
        by: ['ligneeId'],
        _sum: {
          montantRestant: true
        },
        where: {
          ...where,
          statut: { in: ["Impaye", "PartiellementPaye"] }
        },
        orderBy: {
          _sum: {
            montantRestant: 'desc'
          }
        },
        take: 10
      }),
      // Évolution annuelle (5 dernières années)
      prisma.$queryRaw`
        SELECT 
          EXTRACT(YEAR FROM "date") as annee,
          COUNT(*) as nombre,
          SUM("montant") as total_montant,
          SUM("montantPaye") as total_paye,
          SUM("montantRestant") as total_restant
        FROM "CotisationLignee"
        WHERE "statut" != 'Annule'
        AND "date" >= CURRENT_DATE - INTERVAL '5 years'
        GROUP BY EXTRACT(YEAR FROM "date")
        ORDER BY annee DESC
      `
    ]);

    // Enrichir les top lignées avec leurs informations
    const topLigneesEnrichis = await Promise.all(
      topLignees.map(async (item) => {
        const lignee = await prisma.lignee.findUnique({
          where: { id: item.ligneeId },
          include: {
            famille: { select: { nom: true } }
          }
        });

        return {
          ...item,
          lignee
        };
      })
    );

    res.json({
      global: {
        totalCotisations: statsGlobales._count,
        totalMontant: statsGlobales._sum.montant || 0,
        totalPaye: statsGlobales._sum.montantPaye || 0,
        totalRestant: statsGlobales._sum.montantRestant || 0,
        moyenneMontant: Math.round(statsGlobales._avg.montant || 0),
        tauxPaiement: statsGlobales._sum.montant ? 
          Math.round(((statsGlobales._sum.montantPaye || 0) / statsGlobales._sum.montant) * 100) : 0
      },
      parStatut: statsParStatut,
      parMois: statsParMois,
      topLigneesImpayes: topLigneesEnrichis,
      evolutionAnnuelle
    });
  } catch (error) {
    console.error("Erreur getCotisationsLigneesStats :", error);
    res.status(500).json({ 
      error: "Erreur lors du calcul des statistiques",
      code: "SERVER_ERROR"
    });
  }
}