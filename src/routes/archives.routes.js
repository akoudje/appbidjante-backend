// backend/src/routes/archives.routes.js
import { Router } from "express";
import { getArchivesMembres } from "../controllers/archives.controller.js";

const router = Router();

// Liste des membres décédés
router.get("/membres", getArchivesMembres);

export default router;
