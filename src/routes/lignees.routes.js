import express from "express";
import {
  getAllLignees,
  getLignee,
  createLignee,
  updateLignee,
  deleteLignee,
  getLigneesByFamille
} from "../controllers/lignees.controller.js";

const router = express.Router();

router.get("/", getAllLignees);
router.get("/:id", getLignee);

// 🔥 route manquante
router.get("/by-famille/:familleId", getLigneesByFamille);

router.post("/", createLignee);
router.put("/:id", updateLignee);
router.delete("/:id", deleteLignee);

export default router;


