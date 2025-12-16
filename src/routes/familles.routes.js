// src/routes/familles.routes.js
import { Router } from "express";
import {
  getAllFamilles,
  getFamille,
  createFamille,
  updateFamille,
  deleteFamille,
} from "../controllers/familles.controller.js";

const router = Router();

router.get("/", getAllFamilles);
router.get("/:id", getFamille);
router.post("/", createFamille);
router.put("/:id", updateFamille);
router.delete("/:id", deleteFamille);

export default router;
