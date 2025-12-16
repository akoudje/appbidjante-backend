// src/controllers/auth.controller.js
import prisma from "../prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


//-----------------------------------------------------------
// LOGIN
//-----------------------------------------------------------
export async function login(req, res) {
  const { username, password } = req.body;

  try {
    // Vérif user exist
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    // Vérif password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    // Générer JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Réponse formatée pour AuthContext
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
}
//-----------------------------------------------------------
// REGISTER
//-----------------------------------------------------------

export async function register(req, res) {
  const { username, password, role = "user", email } = req.body;

  try {
    const exists = await prisma.user.findUnique({ where: { username } });

    if (exists) {
      return res.status(400).json({ error: "Ce nom d'utilisateur existe déjà" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        role,
        email: email || null, // AJOUTEZ ICI
        active: true, // AJOUTEZ ICI
      },
    });

    return res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email, // AJOUTEZ ICI
      role: user.role,
      active: user.active, // AJOUTEZ ICI
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
}
