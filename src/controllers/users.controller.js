import prisma from "../prisma.js";
import { hashPassword } from "../utils/hash.js";

/* GET /api/users */
export async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, email: true, active: true, createdAt: true }});
    res.json(users);
  } catch (err) {
    console.error("listUsers", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* POST /api/users */
export async function createUser(req, res) {
  try {
    const { username, password, role = "user", email } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({ data: { username, password: hashed, role, email } });
    res.status(201).json({ id: user.id, username: user.username, role: user.role, email: user.email });
  } catch (err) {
    console.error("createUser", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* PUT /api/users/:id */
export async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { role, active, email } = req.body;
    const updated = await prisma.user.update({ where: { id }, data: { role, active, email }});
    res.json({ id: updated.id, username: updated.username, role: updated.role, email: updated.email, active: updated.active});
  } catch (err) {
    console.error("updateUser", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* PUT /api/users/:id/password */
export async function updatePassword(req, res) {
  try {
    const id = Number(req.params.id);
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Missing password" });
    const hashed = await hashPassword(password);
    await prisma.user.update({ where: { id }, data: { password: hashed }});
    res.json({ success: true });
  } catch (err) {
    console.error("updatePassword", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* DELETE /api/users/:id */
export async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id }});
    res.json({ success: true });
  } catch (err) {
    console.error("deleteUser", err);
    res.status(500).json({ error: "Server error" });
  }
}
