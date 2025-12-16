// src/routes/auth.routes.js
import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import { ensureAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);

// Accessible seulement aux superadmin
import { requireRole } from "../middlewares/auth.middleware.js";
router.post("/register", ensureAuth, requireRole("superadmin"), register);

// route protégée
router.get("/me", ensureAuth, (req, res) => {
  res.json(req.user);
});

export default router;
