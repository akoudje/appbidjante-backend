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
  getCommuniquePreview,
} from "../controllers/communique.controller.js";

import {
  ensureAuth,
  requireRole,
} from "../middlewares/auth.middleware.js";
import { previewEmailCommunique } from "../controllers/communique.controller.js";
import { sendTestEmailCommunique } from "../controllers/communique.controller.js";

const router = express.Router();


// 🔐 Protection globale 
router.use(ensureAuth);

 //📄 Consultation
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
 * 🚀 Revue - Preview (Avant diffusion)
 */

router.get("/:id/preview", requireRole("admin", "superadmin"), getCommuniquePreview);

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

/**
 * 📧 Preview email
 */
router.get("/:id/preview-email", previewEmailCommunique);


// Envoi d'email de test
router.post("/:id/test-email", sendTestEmailCommunique);


export default router;