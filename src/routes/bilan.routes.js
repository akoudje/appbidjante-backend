// src/routes/bilan.routes.js

import { Router } from "express";
import { getBilanAnnuel } from "../controllers/bilan.controller.js";

const router = Router();

// Bilan annuel : /api/bilan/2025
router.get("/:year", getBilanAnnuel);

export default router;

