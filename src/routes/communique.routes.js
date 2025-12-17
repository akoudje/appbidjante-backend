// src/routes/communique.routes.js

import express from "express";
import {
  getAllCommuniques,
  getCommuniqueById,
  createCommunique,
  updateCommunique,
  publierCommunique,
  archiverCommunique,
  rediffuserCommunique,
  getDiffusionHistorique,
} from "../controllers/communique.controller.js";

import {
  ensureAuth,
  requireRole,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * 🔐 Protection globale
 */
router.use(ensureAuth);

/**
 * 📄 Consultation
 */
router.get("/", getAllCommuniques);
router.get("/:id", getCommuniqueById);

/**
 * ✍️ Création / édition
 */
router.post("/", requireRole("admin", "superadmin"), createCommunique);
router.put("/:id", requireRole("admin", "superadmin"), updateCommunique);

/**
 * 🚀 Publication (AVEC diffusion)
 */
router.post("/:id/publier", requireRole("admin", "superadmin"), publierCommunique);

/**
 * 🔁 Rediffusion
 */
router.post("/:id/rediffuser", requireRole("admin", "superadmin"), rediffuserCommunique);

/**
 * 📜 Historique de diffusion
 */
router.get("/:id/diffusions", requireRole("admin", "superadmin"), getDiffusionHistorique);

/**
 * 🗄️ Archivage
 */
router.post("/:id/archiver", requireRole("admin", "superadmin"), archiverCommunique);

export default router;