// src/routes/paiements.routes.js
import { Router } from "express";
import {
  getAllPaiements,
  addPaiement,
  addPaiementBatch,
  getPaiementReceipt,
  sendPaiementReceipt,
} from "../controllers/paiements.controller.js";

const router = Router();

// Journal global des paiements
router.get("/", getAllPaiements);

// Ajouter un paiement
router.post("/", addPaiement);

// Paiements batch
router.post("/batch", addPaiementBatch);

// 📄 Télécharger le reçu PDF d’un paiement
router.get("/:id/receipt", getPaiementReceipt);

// 📧 Envoyer le reçu PDF par email
router.post("/:id/send-receipt", sendPaiementReceipt);

export default router;
