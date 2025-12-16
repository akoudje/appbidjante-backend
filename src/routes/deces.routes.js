// src/routes/deces.routes.js
import { Router } from "express";
import {
  getAllDeces,
  getDeces,
  createDeces,
  updateDeces,
  deleteDeces,
  //getDecesByYear,
  getDecesStats,
} from "../controllers/deces.controller.js";

const router = Router();

// ⭐ REST
router.get("/", getAllDeces);

// ⭐ Métier (routes spécifiques AVANT /:id)
//router.get("/annee/:year", getDecesByYear);
router.get("/stats", getDecesStats);
router.get("/:id", getDeces);
router.post("/", createDeces);
router.put("/:id", updateDeces);
router.delete("/:id", deleteDeces);

export default router;

