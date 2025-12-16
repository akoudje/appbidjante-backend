// src/routes/cotisations.routes.js
import { Router } from "express";
import {
  getAllCotisations,
  getCotisation,
  createCotisation,
  updateCotisation,
  payCotisation,
  deleteCotisation,
  generateCotisationsForDeces,
} from "../controllers/cotisations.controller.js";

import {
  getPaiementsForCotisation,
  addPaiement,
} from "../controllers/paiements.controller.js";

const router = Router();

// ⭐ Génération automatique des cotisations pour un décès
router.post("/generate-from-deces/:decesId", generateCotisationsForDeces);

// ⭐ CRUD Cotisations
router.get("/", getAllCotisations);
router.get("/:id", getCotisation);
router.post("/", createCotisation);
router.put("/:id", updateCotisation);
router.delete("/:id", deleteCotisation);

// ⭐ Paiement rapide (marquer tout payé)
router.put("/:id/pay", payCotisation);

// ⭐ Paiements liés à une cotisation
router.get("/:id/paiements", getPaiementsForCotisation);
router.post("/:id/paiements", addPaiement);

export default router;

