//src/routes/menu.routes.js

import prisma from "../prisma.js";
import { Router } from "express";
import {
  getMenuItems,
  getFullMenu,
  createGroup,
  updateGroup,
  deleteGroup,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/menu.controller.js";

import { ensureAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// ===== PUBLIC OU AUTHENTIFIÉ SELON TON CHOIX =====
// Ta SidebarDynamic consomme CE endpoint :
router.get("/", ensureAuth, async (req, res) => {
  try {
    const groups = await prisma.menuGroup.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
      include: {
        items: {
          where: { visible: true, parentId: null },
          orderBy: { order: "asc" },
          include: {
            children: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    res.json(groups);
  } catch (err) {
    console.error("❌ MENU ERROR :", err);
    res.status(500).json({ error: "Erreur serveur menu" });
  }
});


// ===== MENU FULL (optionnel pour admin builder avancé) =====
router.get("/full", ensureAuth, requireRole("admin"), getFullMenu);

// ===== CRUD ADMIN =====
router.post("/groups", ensureAuth, requireRole("admin"), createGroup);
router.put("/groups/:id", ensureAuth, requireRole("admin"), updateGroup);
router.delete("/groups/:id", ensureAuth, requireRole("admin"), deleteGroup);

router.post("/items", ensureAuth, requireRole("admin"), createItem);
router.put("/items/:id", ensureAuth, requireRole("admin"), updateItem);
router.delete("/items/:id", ensureAuth, requireRole("admin"), deleteItem);

export default router;
