// src/routes/membres.routes.js
import { Router } from "express";
import {
  getAllMembres,
  createMembre,
  updateMembre,
  deleteMembre,
  getMembreProfile,
  registerDecesForMembre,
  uploadMembrePhoto,
  searchMembresByContact, 
  searchMembresByName,
} from "../controllers/membres.controller.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

// ⭐ REST
router.get("/", getAllMembres);
router.post("/", createMembre);
router.put("/:id", updateMembre);
router.delete("/:id", deleteMembre);

// ⭐ Recherche par nom/prénom (pour autocomplétion)
router.get("/search/name", searchMembresByName); // ← Nouvelle route

// ⭐ Recherche par contact (optionnel)
router.get("/search/contact", searchMembresByContact);

// ⭐ Métier
router.get("/:id/details", getMembreProfile);
router.post("/:id/deces", registerDecesForMembre);
router.post("/:id/photo", upload.single("photo"), uploadMembrePhoto);

export default router;
