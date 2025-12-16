// src/controllers/soldes.controller.js
import prisma from "../prisma.js";

// ---------------------------------------------------------
// 🔥 Solde d'un membre (format normalisé)
// ---------------------------------------------------------
export async function getSoldeMembre(req, res) {
  try {
    const { id } = req.params;

    console.log("=== DEBUG getSoldeMembre ===");
    console.log("ID reçu:", id);

    // Récupérer le membre avec ses informations de base
    const membre = await prisma.membre.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        prenoms: true,
        genre: true,
        statutMembre: true,
        categorie: { select: { label: true } },
        lignee: {
          select: {
            nom: true,
            famille: { select: { nom: true } }
          }
        }
      },
    });

    console.log("Membre trouvé:", membre?.id);
    console.log("Statut du membre:", membre?.statutMembre);

    if (!membre) {
      return res.status(404).json({ error: "Membre introuvable" });
    }

    // Vérifier si le membre est "Actif" (seuls les actifs paient)
    if (membre.statutMembre !== "Actif") {
      console.log(`Membre ${membre.nom} a le statut "${membre.statutMembre}" - solde à 0`);
      return res.json({
        id: membre.id,
        nom: membre.nom,
        prenoms: membre.prenoms,
        genre: membre.genre,
        categorie: membre.categorie?.label || null,
        famille: membre.lignee?.famille?.nom || null,
        lignee: membre.lignee?.nom || null,
        totalDu: 0,
        totalPaye: 0,
        solde: 0,
        cotisationsImpayees: [],
        statutMembre: membre.statutMembre,
        message: `Le membre a le statut "${membre.statutMembre}" et n'est pas tenu de payer des cotisations`
      });
    }

    // Si le membre est actif, récupérer toutes ses cotisations
    const membreComplet = await prisma.membre.findUnique({
      where: { id },
      include: {
        categorie: true,
        lignee: {
          include: { famille: true },
        },
        cotisations: {
          include: {
            paiements: true,
            deces: {
              include: { membre: true },
            },
          },
          orderBy: { date: "asc" },
        },
      },
    });

    console.log("Nombre de cotisations:", membreComplet?.cotisations?.length);

    // Calculs détaillés
    let totalDu = 0;
    let totalPaye = 0;
    const cotisationsDetail = [];
    const cotisationsImpayees = [];

    membreComplet.cotisations.forEach((c) => {
      const paye = c.paiements.reduce((s, p) => s + p.montant, 0);
      const reste = c.montant - paye;

      totalDu += c.montant;
      totalPaye += paye;

      const cotisationDetail = {
        id: c.id,
        date: c.date,
        montant: c.montant,
        montantPaye: paye,
        reste,
        motif: c.motif || "Cotisation",
        statut: c.statutCotisation,
        paiements: c.paiements.map(p => ({
          id: p.id,
          date: p.date,
          montant: p.montant,
          mode: p.mode,
        })),
        deces: c.deces ? {
          id: c.deces.id,
          dateDeces: c.deces.dateDeces,
          defuntNom: `${c.deces.membre.nom} ${c.deces.membre.prenoms}`,
        } : null,
      };

      cotisationsDetail.push(cotisationDetail);

      // Ajouter aux impayées si reste > 0
      if (reste > 0) {
        cotisationsImpayees.push(cotisationDetail);
      }
    });

    const solde = totalDu - totalPaye;

    console.log("Calculs finaux:", { totalDu, totalPaye, solde });
    console.log("Cotisations impayées:", cotisationsImpayees.length);

    // Format normalisé pour le frontend
    res.json({
      id: membreComplet.id,
      nom: membreComplet.nom,
      prenoms: membreComplet.prenoms,
      genre: membreComplet.genre,
      categorie: membreComplet.categorie?.label || null,
      famille: membreComplet.lignee?.famille?.nom || null,
      lignee: membreComplet.lignee?.nom || null,
      totalDu,
      totalPaye,
      solde,
      cotisationsImpayees, // Pour StepCotisations
      statutMembre: membreComplet.statutMembre,
      // Structure détaillée optionnelle
      details: {
        membre: {
          id: membreComplet.id,
          nom: membreComplet.nom,
          prenoms: membreComplet.prenoms,
          genre: membreComplet.genre,
          categorie: membreComplet.categorie?.label || null,
          famille: membreComplet.lignee?.famille?.nom || null,
          lignee: membreComplet.lignee?.nom || null,
        },
        resume: {
          totalDu,
          totalPaye,
          solde,
          nombreCotisations: membreComplet.cotisations.length,
          nombreCotisationsImpayees: cotisationsImpayees.length,
        },
        cotisations: cotisationsDetail,
      }
    });
  } catch (err) {
    console.error("getSoldeMembre ERREUR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ---------------------------------------------------------
// 🔥 Liste des soldes de tous les membres ACTIFS (optimisé)
// ---------------------------------------------------------
export async function getSoldeAllMembres(req, res) {
  try {
    console.log("=== DEBUG getSoldeAllMembres ===");

    // SEULEMENT les membres avec statut "Actif"
    const membres = await prisma.membre.findMany({
      where: {
        statutMembre: "Actif" // ← Modification importante
      },
      include: {
        cotisations: {
          include: { paiements: true },
        },
        lignee: {
          include: { famille: true },
        },
      },
      orderBy: { nom: "asc" },
    });

    console.log(`Nombre de membres actifs trouvés: ${membres.length}`);

    const result = membres.map((m) => {
      const totalDu = m.cotisations.reduce((sum, c) => sum + c.montant, 0);
      const totalPaye = m.cotisations.reduce(
        (sum, c) => sum + c.paiements.reduce((pSum, p) => pSum + p.montant, 0),
        0
      );
      const solde = totalDu - totalPaye;

      // DEBUG pour suivre
      if (m.cotisations.length > 0) {
        console.log(`Membre ${m.nom} ${m.prenoms}: ${m.cotisations.length} cotisations, solde: ${solde}`);
      }

      return {
        id: m.id,
        nom: m.nom,
        prenoms: m.prenoms,
        genre: m.genre,
        famille: m.lignee?.famille?.nom || null,
        lignee: m.lignee?.nom || null,
        totalDu,
        totalPaye,
        solde,
        statutSolde: solde === 0 ? "À jour" : solde > 0 ? "Débiteur" : "Créditeur",
        nombreCotisations: m.cotisations.length,
        statutMembre: m.statutMembre,
      };
    });

    // Ajouter des statistiques globales
    const stats = {
      totalMembres: result.length,
      totalDette: result.reduce((sum, r) => sum + (r.solde > 0 ? r.solde : 0), 0),
      totalCredit: result.reduce((sum, r) => sum + (r.solde < 0 ? Math.abs(r.solde) : 0), 0),
      membresAJour: result.filter(r => r.solde === 0).length,
      membresDebiteurs: result.filter(r => r.solde > 0).length,
      membresCrediteurs: result.filter(r => r.solde < 0).length,
    };

    console.log("Statistiques:", stats);

    res.json({ membres: result, stats });
  } catch (err) {
    console.error("getSoldeAllMembres ERREUR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ---------------------------------------------------------
// 🔥 Statistiques détaillées par famille/lignée
// ---------------------------------------------------------
export async function getStatsSoldes(req, res) {
  try {
    // Inclure tous les membres pour les statistiques
    const membres = await prisma.membre.findMany({
      where: {
        statutMembre: "Actif" // Seulement les actifs pour les stats
      },
      include: {
        cotisations: { include: { paiements: true } },
        lignee: { include: { famille: true } },
      },
    });

    console.log(`Statistiques sur ${membres.length} membres actifs`);

    // Par famille
    const parFamille = {};
    const parLignee = {};

    membres.forEach(m => {
      const familleNom = m.lignee?.famille?.nom || "Non assigné";
      const ligneeNom = m.lignee?.nom || "Non assigné";

      if (!parFamille[familleNom]) {
        parFamille[familleNom] = { total: 0, membres: 0, dette: 0, credit: 0, soldeMoyen: 0 };
      }
      if (!parLignee[ligneeNom]) {
        parLignee[ligneeNom] = { total: 0, membres: 0, dette: 0, credit: 0, soldeMoyen: 0 };
      }

      const totalDu = m.cotisations.reduce((s, c) => s + c.montant, 0);
      const totalPaye = m.cotisations.reduce((s, c) => s + c.paiements.reduce((p, x) => p + x.montant, 0), 0);
      const solde = totalDu - totalPaye;

      parFamille[familleNom].total += solde;
      parFamille[familleNom].membres += 1;
      if (solde > 0) parFamille[familleNom].dette += solde;
      if (solde < 0) parFamille[familleNom].credit += Math.abs(solde);

      parLignee[ligneeNom].total += solde;
      parLignee[ligneeNom].membres += 1;
      if (solde > 0) parLignee[ligneeNom].dette += solde;
      if (solde < 0) parLignee[ligneeNom].credit += Math.abs(solde);
    });

    // Calculer les moyennes
    Object.keys(parFamille).forEach(famille => {
      const data = parFamille[famille];
      data.soldeMoyen = data.membres > 0 ? data.total / data.membres : 0;
    });

    Object.keys(parLignee).forEach(lignee => {
      const data = parLignee[lignee];
      data.soldeMoyen = data.membres > 0 ? data.total / data.membres : 0;
    });

    res.json({
      parFamille: Object.entries(parFamille).map(([nom, data]) => ({
        nom,
        ...data,
      })),
      parLignee: Object.entries(parLignee).map(([nom, data]) => ({
        nom,
        ...data,
      })),
      totalMembresActifs: membres.length,
    });
  } catch (err) {
    console.error("getStatsSoldes ERREUR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ---------------------------------------------------------
// 🔥 Vérification rapide d'un membre (pour Paiements.jsx)
// ---------------------------------------------------------
export async function checkMembreSolde(req, res) {
  try {
    const { id } = req.params;

    // Version simplifiée pour le stepper de paiement
    const membre = await prisma.membre.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        prenoms: true,
        statutMembre: true,
        _count: {
          select: {
            cotisations: {
              where: {
                statutCotisation: "Impayé"
              }
            }
          }
        }
      },
    });

    if (!membre) {
      return res.status(404).json({ error: "Membre introuvable" });
    }

    // Retourner une réponse simplifiée
    res.json({
      id: membre.id,
      nom: membre.nom,
      prenoms: membre.prenoms,
      statutMembre: membre.statutMembre,
      aDesCotisationsImpayees: membre._count.cotisations > 0,
      nombreCotisationsImpayees: membre._count.cotisations,
      peutPayer: membre.statutMembre === "Actif" && membre._count.cotisations > 0
    });
  } catch (err) {
    console.error("checkMembreSolde ERREUR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}