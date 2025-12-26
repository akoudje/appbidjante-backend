// src/routes/amendes.routes.js

import express from "express";
import {
  createAmende,
  updateAmende,
  getAllAmendes,
  getAmendeById,
  addPaiementAmende,
  transfererAmende,
} from "../controllers/amendes.controller.js";

import { ensureAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(ensureAuth);

/**
 * 📄 Consultation
 */
router.get("/", getAllAmendes);
router.get("/:id", getAmendeById);

/**
 * ✍️ Création
 */
router.post("/", requireRole("admin", "superadmin"), createAmende);

/**
 * ✍️ Edition
 */
router.put('/:id', requireRole("admin", "superadmin"), updateAmende);


/**
 * 💰 Paiement
 */
router.post(
  "/:id/paiements",
  requireRole("admin", "superadmin"),
  addPaiementAmende
);

/**
 * 🔁 Transfert à la lignée
 */
router.post(
  "/:id/transferer",
  requireRole("admin", "superadmin"),
  transfererAmende
);

export default router;
