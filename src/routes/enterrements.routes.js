import { Router } from "express";
import {
  createEnterrement,
  getAllEnterrements,
  getEnterrement,
  updateEnterrement,
  deleteEnterrement,
  getEnterrementStats
} from "../controllers/enterrements.controller.js";

const router = Router();

// 📌 CRUD ENTERREMENTS
router.post("/", createEnterrement);
router.get("/", getAllEnterrements);
router.get("/stats", getEnterrementStats);
router.get("/:id", getEnterrement);
router.put("/:id", updateEnterrement);
router.delete("/:id", deleteEnterrement);

export default router;
