import { Router } from "express";
import prisma from "../prisma.js";
import bcrypt from "bcryptjs";
import { ensureAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", ensureAuth, requireRole("superadmin"), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true },
  });
  res.json(users);
});

router.put("/:id", ensureAuth, requireRole("superadmin"), async (req, res) => {
  const { role } = req.body;

  const updated = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { role },
    select: { id: true, username: true, role: true },
  });

  res.json(updated);
});

router.delete("/:id", ensureAuth, requireRole("superadmin"), async (req, res) => {
  const id = Number(req.params.id);

  await prisma.user.delete({ where: { id } });

  res.json({ success: true });
});


router.put("/update-password", ensureAuth, async (req, res) => {
  const { password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashed },
  });

  res.json({ success: true });
});

export default router;
