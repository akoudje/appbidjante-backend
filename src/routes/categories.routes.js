// src/routes/categories.routes.js
import { Router } from "express";
import {
  getAllCategories,
  getAllCategoriesWithStats,
  getCategorie,
  createCategorie,
  updateCategorie,
  deleteCategorie,
  getCategoryStats,
  getCategoryMembres
} from "../controllers/categories.controller.js";

const router = Router();

router.get("/", getAllCategories);
router.get("/with-stats", getAllCategoriesWithStats);
router.get("/:id/stats", getCategoryStats);
router.get("/:id/membres", getCategoryMembres);
router.get("/:id", getCategorie);
router.post("/", createCategorie);
router.put("/:id", updateCategorie);
router.delete("/:id", deleteCategorie);

export default router;