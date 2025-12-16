// src/controllers/menu.controller.js
import prisma from "../prisma.js";

/* ============================================================================
   1. GET /api/menu → version FLAT (MenuItem seulement)  
   ============================================================================
   C'est CE ENDPOINT que ta SidebarDynamic doit consommer.
   Il renvoie directement la liste des menuItem triés et prêts à être affichés.
============================================================================ */

export async function getMenuItems(req, res) {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: [
        { parentId: "asc" },
        { order: "asc" }
      ]
    });

    res.json(items);
  } catch (err) {
    console.error("getMenuItems ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* ============================================================================
   2. GET /api/menu/full → version GROUPÉE (MenuGroup + children)
   ============================================================================
   Optionnel — utile pour une future page de gestion avancée.
============================================================================ */

export async function getFullMenu(req, res) {
  try {
    const groups = await prisma.menuGroup.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
      include: {
        items: {
          where: { parentId: null },
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
    console.error("getFullMenu ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// Helper: notifier si websockets actifs
function emitMenuUpdate(req) {
  try {
    req.app?.locals?.io?.emit("menu:updated", { at: new Date().toISOString() });
  } catch {}
}

/* ============================================================================
   3. CRUD : GROUPS
============================================================================ */

export async function createGroup(req, res) {
  try {
    const g = await prisma.menuGroup.create({ data: req.body });
    res.status(201).json(g);
    emitMenuUpdate(req);
  } catch (err) {
    console.error("createGroup ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function updateGroup(req, res) {
  try {
    const g = await prisma.menuGroup.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });

    res.json(g);
    emitMenuUpdate(req);
  } catch (err) {
    console.error("updateGroup ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function deleteGroup(req, res) {
  try {
    await prisma.menuGroup.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true });
    emitMenuUpdate(req);
  } catch (err) {
    console.error("deleteGroup ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* ============================================================================
   4. CRUD : ITEMS
============================================================================ */

export async function createItem(req, res) {
  try {
    const item = await prisma.menuItem.create({
      data: req.body,
    });

    res.status(201).json(item);
    emitMenuUpdate(req);
  } catch (err) {
    console.error("createItem ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function updateItem(req, res) {
  try {
    const item = await prisma.menuItem.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });

    res.json(item);
    emitMenuUpdate(req);
  } catch (err) {
    console.error("updateItem ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function deleteItem(req, res) {
  try {
    await prisma.menuItem.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ success: true });
    emitMenuUpdate(req);
  } catch (err) {
    console.error("deleteItem ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}
