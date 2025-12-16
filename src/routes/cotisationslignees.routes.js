import express from "express";
import {
  getAllCotisationsLignees,
  getCotisationLignee,
  createCotisationLignee,
  updateCotisationLignee,
  payCotisationLignee,
  deleteCotisationLignee,
  addPaiementLignee,
  generateCotisationsLigneesForDeces,
  getCotisationsLigneeByLignee,
  getCotisationsLigneesStats,
} from "../controllers/cotisationsLignees.controller.js";

import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

// 🔐 Toutes les routes nécessitent une authentification
router.use(verifyToken);

/**
 * GET /api/cotisations-lignees
 */
router.get("/", getAllCotisationsLignees);

/**
 * GET /api/cotisations-lignees/stats/global
 */
router.get("/stats/global", getCotisationsLigneesStats);

/**
 * GET /api/cotisations-lignees/lignee/:ligneeId
 */
router.get("/lignee/:ligneeId", getCotisationsLigneeByLignee);

/**
 * GET /api/cotisations-lignees/:id
 */
router.get("/:id", getCotisationLignee);

/**
 * POST /api/cotisations-lignees
 */
router.post("/", createCotisationLignee);

/**
 * POST /api/cotisations-lignees/:id/paiements  (partiel)
 */
router.post("/:id/paiements", addPaiementLignee);

/**
 * POST /api/cotisations-lignees/generate-from-deces/:decesId
 */
router.post("/generate-from-deces/:decesId", generateCotisationsLigneesForDeces);

/**
 * PUT /api/cotisations-lignees/:id
 */
router.put("/:id", updateCotisationLignee);

/**
 * PUT /api/cotisations-lignees/:id/pay (payement total)
 */
router.put("/:id/pay", payCotisationLignee);

/**
 * DELETE /api/cotisations-lignees/:id
 */
router.delete("/:id", deleteCotisationLignee);

export default router;
